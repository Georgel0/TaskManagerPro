const pool = require('../database');
const bcrypt = require('bcrypt');
const { Resend } = require('resend');
const { createNotification, isNotificationAllowed } = require('./notificationController');

const resend = new Resend(process.env.RESEND_API_KEY);

const getUserProfile = async (req, res) => {
  try {
    const query = `
    SELECT 
      u.id, u.name, u.email, u.avatar, u.bio, u.created_at,

      -- Project Stats
      (SELECT COUNT(*) FROM projects WHERE owner_id = u.id) AS projects_owned,
      (SELECT COUNT(*) FROM project_members WHERE user_id = u.id) AS projects_joined,
      (SELECT COUNT(*) FROM project_members pm 
       JOIN projects p ON pm.project_id = p.id 
       WHERE pm.user_id = u.id AND p.owner_id != u.id) AS collaborative_projects,

      -- Task Basics
      (SELECT COUNT(*) FROM tasks WHERE assigned_user_id = u.id) AS total_tasks,
      (SELECT COUNT(*) FROM tasks WHERE assigned_user_id = u.id AND status = 'Done') AS completed_tasks,
      (SELECT COUNT(*) FROM tasks WHERE assigned_user_id = u.id AND status = 'In Progress') AS in_progress_tasks,
      
      -- Priority & Deadlines
      (SELECT COUNT(*) FROM tasks WHERE assigned_user_id = u.id AND priority = 'High' AND status != 'Done') AS urgent_tasks,
      (SELECT COUNT(*) FROM tasks 
      WHERE assigned_user_id = u.id 
      AND deadline < CURRENT_DATE 
      AND status != 'Done') AS overdue_tasks,
      (SELECT COUNT(*) FROM tasks 
      WHERE assigned_user_id = u.id 
      AND deadline BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '7 days')
      AND status != 'Done') AS upcoming_tasks,

      -- Interaction Stats
      (SELECT COUNT(*) FROM comments WHERE user_id = u.id) AS comments_count,
      (SELECT COUNT(*) FROM attachments a 
       JOIN tasks t ON a.task_id = t.id 
       WHERE t.assigned_user_id = u.id) AS task_resources,
      (SELECT COUNT(*) FROM notifications 
       WHERE user_id = u.id AND read_status = FALSE) AS unread_alerts

    FROM users u 
    WHERE u.id = $1;`;

    const result = await pool.query(query, [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const row = result.rows[0];

    // Calculate a 'Productivity Score' percentage
    const total = parseInt(row.total_tasks) || 0;
    const completed = parseInt(row.completed_tasks) || 0;
    const score = total > 0 ? Math.round((completed / total) * 100) : 0;

    res.status(200).json({
      ...row,
      stats: {
        projects: parseInt(row.projects_owned) + parseInt(row.collaborative_projects),
        tasks: total,
        completed: completed,
        urgent: parseInt(row.urgent_tasks),
        engagement: parseInt(row.comments_count),
        performance: {
          score: score,
          overdue: parseInt(row.overdue_tasks),
          upcoming: parseInt(row.upcoming_tasks)
        },
        activity: {
          owned: parseInt(row.projects_owned),
          collaboration: parseInt(row.collaborative_projects),
          resources: parseInt(row.task_resources),
          unread: parseInt(row.unread_alerts)
        }
      }
    });
  } catch (err) {
    console.error("Profile Stats Error:", err);
    res.status(500).json({ error: "Server error fetching stats." });
  }
};

const changeUsername = async (req, res) => {
  const { newUsername } = req.body;
  const userId = req.user.id;

  try {
    // Guard against changing to the same name
    const currentUser = await pool.query('SELECT name FROM users WHERE id = $1', [userId]);
    if (currentUser.rows[0]?.name === newUsername) {
      return res.status(400).json({ error: 'New username must be different from your current one.' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE name = $1', [newUsername]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'That username is already taken.' });
    }

    await pool.query('UPDATE users SET name = $1 WHERE id = $2', [newUsername, userId]);

    const allowed = await isNotificationAllowed(userId, 'account_actions');
    if (allowed) {
      await createNotification(userId, `Your username has been changed to "${newUsername}".`);
    }

    res.status(200).json({ message: 'Username updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while updating username.' });
  }
};

const changeEmail = async (req, res) => {
  const { newEmail, password } = req.body;
  const userId = req.user.id;

  try {
    const userResult = await pool.query('SELECT email, password FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const { email: oldEmail, password: hashedPassword } = userResult.rows[0];

    // Verify password before allowing the change
    const isMatch = await bcrypt.compare(password, hashedPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect password.' });
    }

    if (oldEmail === newEmail) {
      return res.status(400).json({ error: 'New email must be different from your current one.' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [newEmail]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'That email is already registered.' });
    }

    await pool.query('UPDATE users SET email = $1 WHERE id = $2', [newEmail, userId]);

    await resend.emails.send({
      from: 'Task Manager <noreply@yourdomain.com>',
      to: oldEmail,
      subject: 'Your email address was changed',
      html: `
        <p>Hi,</p>
        <p>Your account email was changed to <strong>${newEmail}</strong>.</p>
      `,
    });

    const allowed = await isNotificationAllowed(userId, 'account_actions');
    if (allowed) {
      await createNotification(userId, 'Your avatar has been updated successfully.');
    }

    res.status(200).json({ message: 'Email updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while updating email.' });
  }
};

const changeAvatar = async (req, res) => {
  const { newAvatarUrl } = req.body;

  try {
    if (newAvatarUrl.startsWith('data:image/')) {
      const sizeInBytes = (newAvatarUrl.length * 0.75);
      if (sizeInBytes > 2 * 1024 * 1024) {
        return res.status(400).json({ error: 'Base64 image is too large (max 2MB).' });
      }
    } else {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(newAvatarUrl, {
          method: 'GET',
          signal: controller.signal,
          headers: { Range: 'bytes=0-1023' },
        });

        if (!response.ok) {
          return res.status(400).json({ error: 'Unable to access the provided image URL.' });
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.startsWith('image/')) {
          return res.status(400).json({ error: 'The URL must point directly to an image file.' });
        }
      } finally {
        clearTimeout(timeout);
      }
    }

    await pool.query('UPDATE users SET avatar = $1 WHERE id = $2', [newAvatarUrl, req.user.id]);

    const allowed = await isNotificationAllowed(req.user.id, 'account_actions');
    if (allowed) {
      await createNotification(req.user.id, 'Your avatar has been updated successfully.');
    }

    res.status(200).json({ message: 'Avatar updated successfully.' });
  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(400).json({ error: 'Image URL timed out.' });
    }
    res.status(400).json({ error: 'Could not validate the image.' });
  }
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const userResult = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const isMatch = await bcrypt.compare(currentPassword, userResult.rows[0].password);
    if (!isMatch) {
      return res.status(400).json({ error: "Incorrect current password." });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedNewPassword, req.user.id]);

    const allowed = await isNotificationAllowed(req.user.id, 'account_actions');
    if (allowed) {
      await createNotification(req.user.id, 'Your password has been updated successfully.');
    }

    res.status(200).json({ message: "Password updated successfully." });
  } catch (err) {
    res.status(500).json({ error: "Server error while updating password." });
    console.error(err);
  }
};

const changeBio = async (req, res) => {
  const { newBio } = req.body;
  const userId = req.user.id;

  try {
    await pool.query('UPDATE users SET bio = $1 WHERE id = $2', [newBio, userId]);

    res.status(200).json({ message: 'Bio updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while updating bio.' });
  }
};

const deleteAccount = async (req, res) => {
  const { password } = req.body;

  try {
    const userResult = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const isMatch = await bcrypt.compare(password, userResult.rows[0].password);
    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect password. Deletion cancelled." });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [req.user.id]);
    res.status(200).json({ message: "Account deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: "Server error while deleting account." });
    console.error(err);
  }
};

const searchUsers = async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length < 2) return res.status(200).json([]);

  try {
    const result = await pool.query(
      `SELECT id, name, email, avatar FROM users WHERE (name ILIKE $1 OR email ILIKE $1) AND id != $2 LIMIT 8`,
      [`%${q.trim()}%`, req.user.id]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error while searching users.' });
    console.error(err);
  }
};

module.exports = {
  getUserProfile,
  changeUsername,
  changeEmail,
  changeAvatar,
  changePassword,
  changeBio,
  deleteAccount,
  searchUsers
};