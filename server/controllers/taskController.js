const pool = require('../database');
const { createNotification } = require('./notificationController');

const createTask = async (req, res) => {
  const { title, description, status, priority, deadline, project_id, assigned_user_id } = req.body;
  const userId = req.user.id;

  try {
    // Verify the user has access to this project (owner or member)
    const projectCheck = await pool.query(
      `SELECT p.id FROM projects p 
       LEFT JOIN project_members pm ON p.id = pm.project_id 
       WHERE p.id = $1 AND (p.owner_id = $2 OR pm.user_id = $2)`,
      [project_id, userId]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(403).json({ error: "Not authorized to add tasks to this project." });
    }

    // Insert the task
    const newTask = await pool.query(
      `INSERT INTO tasks (title, description, status, priority, deadline, project_id, assigned_user_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, description, status || 'To Do', priority || 'Medium', deadline, project_id, assigned_user_id || null]
    );

    if (assigned_user_id && assigned_user_id !== userId) {
      await createNotification(
        assigned_user_id, 
        `You have been assigned to a new task: ${title}`
      );
    }

    res.status(201).json(newTask.rows[0]);
  } catch (err) {
    console.error("Error creating task: ", err);
    res.status(500).json({ error: "Server error while creating task." });
  }
};

// Get tasks with optional search and filters
const getTasks = async (req, res) => {
  const userId = req.user.id;
  const { title, project_id, assigned_user_id, status, priority } = req.query;

  try {
    let queryText = `
      SELECT DISTINCT t.*, 
        u.name AS assigned_user_name,
        p.name AS project_name,
        p.owner_id AS project_owner_id,
        (SELECT COUNT(*) FROM comments WHERE task_id = t.id) AS comment_count
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN project_members pm ON p.id = pm.project_id
      LEFT JOIN users u ON u.id = t.assigned_user_id
      WHERE (p.owner_id = $1 OR pm.user_id = $1)
    `;
    const queryParams = [userId];
    let paramIndex = 2;

    if (title) {
      queryText += ` AND t.title ILIKE $${paramIndex}`;
      queryParams.push(`%${title}%`);
      paramIndex++;
    }
    if (project_id) {
      queryText += ` AND t.project_id = $${paramIndex}`;
      queryParams.push(project_id);
      paramIndex++;
    }
    if (assigned_user_id) {
      queryText += ` AND t.assigned_user_id = $${paramIndex}`;
      queryParams.push(assigned_user_id);
      paramIndex++;
    }
    if (status) {
      queryText += ` AND t.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }
    if (priority) {
      queryText += ` AND t.priority = $${paramIndex}`;
      queryParams.push(priority);
      paramIndex++;
    }

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
    // Check if the task exists and the user has access to its project
    const taskCheck = await pool.query(
      `SELECT t.id FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE t.id = $1 AND (p.owner_id = $2 OR t.assigned_user_id = $2)`,
      [id, userId]
    );

    if (taskCheck.rows.length === 0) {
      return res.status(403).json({ error: "Not authorized to update this task or task not found." });
    }

    const oldTaskResult = await pool.query('SELECT title, assigned_user_id FROM tasks WHERE id = $1', [id]);
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
      [title, description, status, priority, deadline, assigned_user_id, id]
    );

    const finalTitle = title || oldTask.title;
    
    if (assigned_user_id && assigned_user_id !== oldTask.assigned_user_id && assigned_user_id !== userId) {
      // The task was assigned to someone new
      await createNotification(assigned_user_id, `You have been assigned to the task: ${finalTitle}`);
    } else if (oldTask.assigned_user_id && oldTask.assigned_user_id !== userId) {
      // The task was just edited by someone else (like the project owner)
      await createNotification(oldTask.assigned_user_id, `There was an update to your task: ${finalTitle}`);
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
    // Check if the task exists and the user has access to its project
    const taskCheck = await pool.query(
      `SELECT t.id FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE t.id = $1 AND (p.owner_id = $2 OR t.assigned_user_id = $2)`,
      [id, userId]
    );

    if (taskCheck.rows.length === 0) {
      return res.status(403).json({ error: "Not authorized to delete this task or task not found." });
    }

    const taskToDeleteResult = await pool.query('SELECT title, assigned_user_id FROM tasks WHERE id = $1', [id]);
    const taskToDelete = taskToDeleteResult.rows[0];

    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);

    if (taskToDelete.assigned_user_id && taskToDelete.assigned_user_id !== userId) {
      await createNotification(
        taskToDelete.assigned_user_id, 
        `The task "${taskToDelete.title}" has been deleted.`
      );
    }

    res.status(200).json({ message: "Task deleted successfully." });
  } catch (err) {
    console.error("Error deleting task: ", err);
    res.status(500).json({ error: "Server error while deleting task." });
  }
};

module.exports = { createTask, getTasks, updateTask, deleteTask };