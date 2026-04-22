const pool = require('../database');
const { createNotification, isNotificationAllowed } = require('./notificationController');

const createComment = async (req, res) => {
  const { task_id, comment } = req.body;
  const userId = req.user.id;

  try {
    const newComment = await pool.query(
      `INSERT INTO comments (task_id, user_id, comment)
       VALUES ($1, $2, $3)
       RETURNING *, (SELECT name FROM users WHERE id = $2) AS user_name,
                    (SELECT avatar FROM users WHERE id = $2) AS user_avatar`,
      [task_id, userId, comment]
    );

    const taskResult = await pool.query(
      `SELECT t.title, t.assigned_user_id, p.owner_id 
       FROM tasks t
       JOIN projects p ON p.id = t.project_id 
       WHERE t.id = $1`,
      [task_id]
    );

    const task = taskResult.rows[0];
    const commenterName = newComment.rows[0].user_name;

    const notified = new Set([userId]); // Never notify self

    // Notify assigned user
    if (task?.assigned_user_id && !notified.has(task.assigned_user_id)) {
      const allowed = await isNotificationAllowed(task.assigned_user_id, 'comment_added');
      if (allowed) {
        notified.add(task.assigned_user_id);
        await createNotification(
          task.assigned_user_id,
          `${commenterName} commented on your task: "${task.title}"`
        );
      }
    }

    // Notify project owner if not already notified
    if (task?.owner_id && !notified.has(task.owner_id)) {
      const allowed = await isNotificationAllowed(task.owner_id, 'comment_added');
      if (allowed) {
        notified.add(task.owner_id);
        await createNotification(
          task.owner_id,
          `${commenterName} commented on task: "${task.title}"`
        );
      }
    }

    res.status(201).json(newComment.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while creating comment.' });
  }
};

const getComments = async (req, res) => {
  const { taskId } = req.params;

  try {
    const comments = await pool.query(
      `SELECT c.*, u.name AS user_name, u.avatar AS user_avatar
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.task_id = $1
       ORDER BY c.created_at ASC`,
      [taskId]
    );
    res.status(200).json(comments.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while fetching comments.' });
  }
};

const updateComment = async (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;
  const userId = req.user.id;

  try {
    const updatedComment = await pool.query(
      `UPDATE comments
      SET comment = $1, updated_at = NOW()
      WHERE id = $2 AND user_id = $3
      RETURNING *`,
      [comment, id, userId]
    );

    if (updatedComment.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized or comment not found.' });
    }

    res.status(200).json(updatedComment.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while updating comment.' });
  }
};

const deleteComment = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const commentResult = await pool.query('SELECT user_id FROM comments WHERE id = $1', [id]);
    const commentAuthorId = commentResult.rows[0]?.user_id;

    await pool.query(
      `DELETE FROM comments
       WHERE id = $1
       AND (
         user_id = $2
         OR EXISTS (
           SELECT 1 FROM tasks t
           JOIN projects p ON p.id = t.project_id
           WHERE t.id = (SELECT task_id FROM comments WHERE id = $1)
           AND p.owner_id = $2
         )
       )`,
      [id, userId]
    );

    if (commentAuthorId && commentAuthorId !== userId) {
      const allowed = await isNotificationAllowed(commentAuthorId, 'comment_added');
      if (allowed) {
        await createNotification(
          commentAuthorId,
          `Your comment was removed by the project moderator.`
        );
      }
    }

    res.status(200).json({ message: 'Comment deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while deleting comment.' });
  }
};

module.exports = { getComments, createComment, updateComment, deleteComment };