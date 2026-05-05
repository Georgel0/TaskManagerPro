const pool = require('../database');

const getSettings = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(
      'SELECT * FROM user_settings WHERE user_id = $1',
      [userId]
    );

    // If no row exists yet, return all defaults
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
        floating_windows_enabled: false
      });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings.' });
  }
};

const updateSettings = async (req, res) => {
  const userId = req.user.id;
  const {
    task_assigned, task_updated, task_completed, task_deleted,
    comment_added, project_changes, deadline_reminders, announcements, 
    account_actions, floating_windows_enabled
  } = req.body;

  try {
    await pool.query(
      `INSERT INTO user_settings 
        (user_id, task_assigned, task_updated, task_completed, task_deleted,
         comment_added, project_changes, deadline_reminders, announcements, 
         account_actions, floating_windows_enabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (user_id) DO UPDATE SET
         task_assigned = $2, task_updated = $3, task_completed = $4,
         task_deleted = $5, comment_added = $6, project_changes = $7,
         deadline_reminders = $8, announcements = $9, account_actions = $10,
         floating_windows_enabled = $11`,
      [userId, task_assigned, task_updated, task_completed, task_deleted,
        comment_added, project_changes, deadline_reminders, announcements, 
        account_actions, floating_windows_enabled]
    );
    res.status(200).json({ message: 'Settings updated successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to update settings.' });
  }
};

module.exports = { getSettings, updateSettings };