const pool = require('../database');
const { createNotification, isNotificationAllowed } = require('./notificationController');

const createTask = async (req, res) => {
  const { title, description, status, priority, deadline, project_id, assigned_user_id } = req.body;
  const userId = req.user.id;

  const isPersonal = !project_id;

  try {
    if (project_id) {
      const projectCheck = await pool.query(
        `SELECT p.id FROM projects p 
       LEFT JOIN project_members pm ON p.id = pm.project_id 
       WHERE p.id = $1 AND (p.owner_id = $2 OR pm.user_id = $2)`,
        [project_id, userId]
      );

      if (projectCheck.rows.length === 0) {
        return res.status(403).json({ error: "Not authorized to add tasks to this project." });
      }
    }

    // For personal tasks, assign it to the creator implicitly
    const finalAssignee = isPersonal ? userId : (assigned_user_id || null);

    const insertResult = await pool.query(
      `INSERT INTO tasks (title, description, status, priority, deadline, project_id, assigned_user_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [title, description, status || 'To Do', priority || 'Medium', deadline, project_id || null, finalAssignee]
    );

    const newTaskId = insertResult.rows[0].id;

    const newTaskDetails = await pool.query(
      `SELECT t.*, 
        u.name AS assigned_user_name,
        p.name AS project_name,
        p.owner_id AS project_owner_id,
        0 AS comment_count,
        0 AS attachment_count
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON u.id = t.assigned_user_id
      WHERE t.id = $1`,
      [newTaskId]
    );

    // Only notify if it's assigned to someone else
    if (!isPersonal && assigned_user_id && assigned_user_id !== userId) {
      const allowed = await isNotificationAllowed(assigned_user_id, 'task_assigned');
      if (allowed) {
        await createNotification(assigned_user_id, `You have been assigned to a new task: ${title}`);
      }
    }

    res.status(201).json(newTaskDetails.rows[0]);
  } catch (err) {
    console.error("Error creating task: ", err);
    res.status(500).json({ error: "Server error while creating task." });
  }
};

const getTasks = async (req, res) => {
  const userId = req.user.id;
  const { title, project_id, assigned_user_id, status, priority } = req.query;

  try {
    let queryText = `
      SELECT DISTINCT t.*, 
        u.name AS assigned_user_name,
        p.name AS project_name,
        p.owner_id AS project_owner_id,
        (SELECT COUNT(*) FROM comments WHERE task_id = t.id) AS comment_count,
        (SELECT COUNT(*) FROM attachments WHERE task_id = t.id) AS attachment_count
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id  -- Changed to LEFT JOIN
      LEFT JOIN project_members pm ON p.id = pm.project_id
      LEFT JOIN users u ON u.id = t.assigned_user_id
      WHERE (
        p.owner_id = $1 OR 
        pm.user_id = $1 OR 
        (t.project_id IS NULL AND t.assigned_user_id = $1) -- Added personal task check
      ) AND t.is_archived = FALSE
    `;
    const queryParams = [userId];
    let paramIndex = 2;

    if (title) { queryText += ` AND t.title ILIKE $${paramIndex}`; queryParams.push(`%${title}%`); paramIndex++; }
    if (project_id) { queryText += ` AND t.project_id = $${paramIndex}`; queryParams.push(project_id); paramIndex++; }
    if (assigned_user_id) { queryText += ` AND t.assigned_user_id = $${paramIndex}`; queryParams.push(assigned_user_id); paramIndex++; }
    if (status) { queryText += ` AND t.status = $${paramIndex}`; queryParams.push(status); paramIndex++; }
    if (priority) { queryText += ` AND t.priority = $${paramIndex}`; queryParams.push(priority); paramIndex++; }

    queryText += ` ORDER BY t.created_at DESC`;

    const tasks = await pool.query(queryText, queryParams);
    res.status(200).json(tasks.rows);
  } catch (err) {
    console.error("Error fetching tasks: ", err);
    res.status(500).json({ error: "Server error while fetching tasks." });
  }
};

const updateTask = async (req, res) => {
  const { id } = req.params;
  const { title, description, status, priority, deadline, assigned_user_id } = req.body;
  const userId = req.user.id;

  try {
    const taskCheck = await pool.query(
      `SELECT t.id FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.id = $1 AND (
          p.owner_id = $2 OR 
          t.assigned_user_id = $2 OR
          (t.project_id IS NULL AND t.assigned_user_id = $2)
        )`,
      [id, userId]
    );

    if (taskCheck.rows.length === 0) {
      return res.status(403).json({ error: "Not authorized to update this task or task not found." });
    }

    const isPersonal = taskCheck.rows[0].project_id === null;
    const finalAssignee = isPersonal ? userId : assigned_user_id;

    const oldTaskResult = await pool.query('SELECT title, assigned_user_id, status FROM tasks WHERE id = $1', [id]);
    const oldTask = oldTaskResult.rows[0];

    const updatedTask = await pool.query(
      `UPDATE tasks 
       SET title = COALESCE($1, title), 
           description = COALESCE($2, description), 
           status = COALESCE($3, status), 
           priority = COALESCE($4, priority), 
           deadline = COALESCE($5, deadline), 
           assigned_user_id = $6
       WHERE id = $7 RETURNING *`,
      [title, description, status, priority, deadline, finalAssignee, id]
    );

    const finalTitle = title || oldTask.title;
    const newStatus = status || oldTask.status;

    // Notifications logic (skip for personal tasks)
    if (!isPersonal) {
      if (assigned_user_id && assigned_user_id !== oldTask.assigned_user_id) {
        if (assigned_user_id !== userId) {
          const allowed = await isNotificationAllowed(assigned_user_id, 'task_assigned');
          if (allowed) await createNotification(assigned_user_id, `You have been assigned to the task: "${finalTitle}"`);
        }
        if (oldTask.assigned_user_id && oldTask.assigned_user_id !== userId) {
          const allowed = await isNotificationAllowed(oldTask.assigned_user_id, 'task_assigned');
          if (allowed) await createNotification(oldTask.assigned_user_id, `You are no longer assigned to "${finalTitle}."`);
        }
      } else if (oldTask.assigned_user_id && oldTask.assigned_user_id !== userId) {
        if (newStatus === 'Done' && oldTask.status !== 'Done') {
          const taskWithProject = await pool.query(
            `SELECT p.owner_id, u.name AS user_name FROM tasks t JOIN projects p ON t.project_id = p.id JOIN users u ON u.id = $1 WHERE t.id = $2`,
            [userId, id]
          );
          const { owner_id, user_name } = taskWithProject.rows[0];
          if (owner_id !== userId) {
            const allowed = await isNotificationAllowed(owner_id, 'task_completed');
            if (allowed) await createNotification(owner_id, `${user_name} completed the task "${finalTitle}".`);
          }
        } else {
          const allowed = await isNotificationAllowed(oldTask.assigned_user_id, 'task_updated');
          if (allowed) await createNotification(oldTask.assigned_user_id, `There was an update to your task: "${finalTitle}"`);
        }
      }
    }

    res.status(200).json(updatedTask.rows[0]);
  } catch (err) {
    console.error("Error updating task: ", err);
    res.status(500).json({ error: "Server error while updating task." });
  }
};

const deleteTask = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const taskCheck = await pool.query(
      `SELECT t.id FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.id = $1 AND (
          p.owner_id = $2 OR 
          t.assigned_user_id = $2 OR
          (t.project_id IS NULL AND t.assigned_user_id = $2)
        )`,
      [id, userId]
    );

    if (taskCheck.rows.length === 0) {
      return res.status(403).json({ error: "Not authorized to delete this task or task not found." });
    }

    const taskToDeleteResult = await pool.query('SELECT title, assigned_user_id, project_id FROM tasks WHERE id = $1', [id]);
    const taskToDelete = taskToDeleteResult.rows[0];

    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);

    if (taskToDelete.project_id && taskToDelete.assigned_user_id && taskToDelete.assigned_user_id !== userId) {
      const allowed = await isNotificationAllowed(taskToDelete.assigned_user_id, 'task_deleted');
      if (allowed) {
        await createNotification(taskToDelete.assigned_user_id, `The task "${taskToDelete.title}" has been deleted.`);
      }
    }

    res.status(200).json({ message: "Task deleted successfully." });
  } catch (err) {
    console.error("Error deleting task: ", err);
    res.status(500).json({ error: "Server error while deleting task." });
  }
};

module.exports = { createTask, getTasks, updateTask, deleteTask };