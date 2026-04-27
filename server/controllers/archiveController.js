const pool = require('../database');
const cloudinary = require('../config/cloudinary');

const getArchivedProjects = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT p.*,
        COUNT(DISTINCT t.id)::int AS task_count,
        COUNT(DISTINCT pm.user_id)::int + 1 AS member_count
       FROM projects p
       LEFT JOIN project_members pm ON p.id = pm.project_id
       LEFT JOIN tasks t ON t.project_id = p.id AND t.is_archived = FALSE
       WHERE p.owner_id = $1 AND p.is_archived = TRUE
       GROUP BY p.id
       ORDER BY p.archived_at DESC`,
      [userId]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching archived projects.' });
  }
};

const archiveProject = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const project = await pool.query(
      'SELECT * FROM projects WHERE id = $1 AND owner_id = $2',
      [id, userId]
    );

    if (project.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    // Archive project and all its tasks in one go
    await pool.query(
      'UPDATE projects SET is_archived = TRUE, archived_at = NOW() WHERE id = $1',
      [id]
    );
    await pool.query(
      'UPDATE tasks SET is_archived = TRUE, archived_at = NOW() WHERE project_id = $1',
      [id]
    );

    res.status(200).json({ message: 'Project archived.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error archiving project.' });
  }
};

const restoreProject = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const project = await pool.query(
      'SELECT * FROM projects WHERE id = $1 AND owner_id = $2',
      [id, userId]
    );

    if (project.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    await pool.query(
      'UPDATE projects SET is_archived = FALSE, archived_at = NULL WHERE id = $1',
      [id]
    );

    // Restore tasks that were archived at the same time as the project
    await pool.query(
      `UPDATE tasks SET is_archived = FALSE, archived_at = NULL
       WHERE project_id = $1 AND archived_at >= $2`,
      [id, project.rows[0].archived_at]
    );

    res.status(200).json({ message: 'Project restored.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error restoring project.' });
  }
};

const permanentDeleteProject = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const project = await pool.query(
      'SELECT * FROM projects WHERE id = $1 AND owner_id = $2 AND is_archived = TRUE',
      [id, userId]
    );

    if (project.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized or project not in archive.' });
    }

    // Delete Cloudinary attachments for all tasks in this project
    const attachments = await pool.query(
      `SELECT a.public_id, a.file_type FROM attachments a
       JOIN tasks t ON t.id = a.task_id
       WHERE t.project_id = $1`,
      [id]
    );

    await Promise.allSettled(
      attachments.rows.map((a) => {
        const resourceType = a.file_type?.startsWith('image/') || a.file_type === 'application/pdf'
          ? 'image' : a.file_type?.startsWith('video/') ? 'video' : 'raw';
        return cloudinary.uploader.destroy(a.public_id, { resource_type: resourceType });
      })
    );

    // CASCADE on projects table handles tasks, comments, attachments, notifications
    await pool.query('DELETE FROM projects WHERE id = $1', [id]);

    res.status(200).json({ message: 'Project permanently deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error deleting project.' });
  }
};

const getArchivedTasks = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT t.*, 
              p.name AS project_name,
              u.name AS assigned_user_name
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       LEFT JOIN users u ON u.id = t.assigned_user_id
       WHERE t.is_archived = TRUE 
       AND (
         p.owner_id = $1 OR 
         t.assigned_user_id = $1 OR 
         (t.project_id IS NULL AND t.assigned_user_id = $1)
       )
       ORDER BY t.archived_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch archived tasks" });
  }
};

const archiveTask = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const task = await pool.query(
      `SELECT t.* FROM tasks t
        LEFT JOIN projects p ON p.id = t.project_id
        WHERE t.id = $1 AND (
          p.owner_id = $2 OR 
          t.assigned_user_id = $2 OR
          (t.project_id IS NULL AND t.assigned_user_id = $2)
        )`,
      [id, userId]
    );

    if (task.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    await pool.query(
      'UPDATE tasks SET is_archived = TRUE, archived_at = NOW() WHERE id = $1',
      [id]
    );

    res.status(200).json({ message: 'Task archived.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error archiving task.' });
  }
};

const restoreTask = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const task = await pool.query(
      `SELECT t.* FROM tasks t
        LEFT JOIN projects p ON p.id = t.project_id
        WHERE t.id = $1 AND (
          p.owner_id = $2 OR 
          t.assigned_user_id = $2 OR
          (t.project_id IS NULL AND t.assigned_user_id = $2)
        )`,
      [id, userId]
    );

    if (task.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    await pool.query(
      'UPDATE tasks SET is_archived = FALSE, archived_at = NULL WHERE id = $1',
      [id]
    );

    res.status(200).json({ message: 'Task restored.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error restoring task.' });
  }
};

const permanentDeleteTask = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const task = await pool.query(
      `SELECT t.* FROM tasks t
        LEFT JOIN projects p ON p.id = t.project_id
        WHERE t.id = $1 AND t.is_archived = TRUE
          AND (
            p.owner_id = $2 OR 
            t.assigned_user_id = $2 OR
            (t.project_id IS NULL AND t.assigned_user_id = $2)
          )`,
      [id, userId]
    );

    if (task.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized or task not in archive.' });
    }

    // Delete Cloudinary attachments
    const attachments = await pool.query(
      'SELECT public_id, file_type FROM attachments WHERE task_id = $1',
      [id]
    );

    await Promise.allSettled(
      attachments.rows.map((a) => {
        const resourceType = a.file_type?.startsWith('image/') || a.file_type === 'application/pdf'
          ? 'image' : a.file_type?.startsWith('video/') ? 'video' : 'raw';
        return cloudinary.uploader.destroy(a.public_id, { resource_type: resourceType });
      })
    );

    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);

    res.status(200).json({ message: 'Task permanently deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error deleting task.' });
  }
};

module.exports = {
  getArchivedProjects, archiveProject, restoreProject, permanentDeleteProject,
  getArchivedTasks, archiveTask, restoreTask, permanentDeleteTask,
};