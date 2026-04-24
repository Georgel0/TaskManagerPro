const pool = require('../database');
const webpush = require('../config/webpush');

const isNotificationAllowed = async (userId, category) => {
  try {
    const result = await pool.query(
      `SELECT ${category} FROM notification_preferences WHERE user_id = $1`,
      [userId]
    );
    // If no preference row, default to allowed
    if (result.rows.length === 0) return true;
    return result.rows[0][category] !== false;
  } catch {
    return true; // Fail open — always deliver if check fails
  }
};

const createNotification = async (userId, message) => {
  try {
    await pool.query(
      'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
      [userId, message]
    );

    const subResult = await pool.query(
      'SELECT * FROM push_subscriptions WHERE user_id = $1',
      [userId]
    );

    if (subResult.rows.length > 0) {
      const payload = JSON.stringify({ title: 'Task Manager', body: message });

      await Promise.allSettled(
        subResult.rows.map(async (sub) => {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              payload
            );
          } catch (err) {
            // Subscription expired or invalid — remove it
            if (err.statusCode === 410 || err.statusCode === 404) {
              await pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [sub.endpoint]);
            }
          }
        })
      );
    }
  } catch (err) {
    console.error('Error creating notification:', err);
  }
};

const getNotifications = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
};

const markAsRead = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    const result = await pool.query(
      'UPDATE notifications SET read_status = TRUE WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notification.' });
  }
};

const markAllAsRead = async (req, res) => {
  const userId = req.user.id;
  try {
    await pool.query(
      'UPDATE notifications SET read_status = TRUE WHERE user_id = $1',
      [userId]
    );
    res.status(200).json({ message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notifications.' });
  }
};

const deleteNotification = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    res.status(200).json({ message: 'Notification deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete notification.' });
  }
};

const deletePushSubscription = async (req, res) => {
  const { endpoint } = req.body;
  const userId = req.user.id;

  try {
    await pool.query(
      'DELETE FROM push_subscriptions WHERE endpoint = $1 AND user_id = $2',
      [endpoint, userId]
    );
    res.status(200).json({ message: 'Subscription removed.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove subscription.' });
  }
};

const savePushSubscription = async (req, res) => {
  const { endpoint, keys } = req.body;
  const userId = req.user.id;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ error: 'Invalid subscription data.' });
  }

  try {
    await pool.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (endpoint) DO UPDATE SET user_id = $1`,
      [userId, endpoint, keys.p256dh, keys.auth]
    );
    res.status(201).json({ message: 'Subscription saved.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save subscription.' });
  }
};

const getVapidPublicKey = (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
};

const getNotificationPreferences = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(
      'SELECT * FROM notification_preferences WHERE user_id = $1',
      [userId]
    );

    // If no row exists yet, return all defaults as true
    if (result.rows.length === 0) {
      return res.status(200).json({
        task_assigned: true,
        task_updated: true,
        task_completed: true,
        task_deleted: true,
        comment_added: true,
        project_changes: true,
        deadline_reminders: true,
        announcements: true,
        account_actions: true,
      });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch preferences.' });
  }
};

const updateNotificationPreferences = async (req, res) => {
  const userId = req.user.id;
  const {
    task_assigned, task_updated, task_completed, task_deleted,
    comment_added, project_changes, deadline_reminders, announcements, account_actions
  } = req.body;

  try {
    await pool.query(
      `INSERT INTO notification_preferences 
        (user_id, task_assigned, task_updated, task_completed, task_deleted,
         comment_added, project_changes, deadline_reminders, announcements)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (user_id) DO UPDATE SET
         task_assigned = $2, task_updated = $3, task_completed = $4,
         task_deleted = $5, comment_added = $6, project_changes = $7,
         deadline_reminders = $8, announcements = $9, account_actions = $10,`
      [userId, task_assigned, task_updated, task_completed, task_deleted,
       comment_added, project_changes, deadline_reminders, announcements, account_actions]
    );
    res.status(200).json({ message: 'Preferences updated.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update preferences.' });
  }
};

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  savePushSubscription,
  deletePushSubscription,
  getVapidPublicKey,
  getNotificationPreferences,
  updateNotificationPreferences,
  isNotificationAllowed
};