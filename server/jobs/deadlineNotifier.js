const cron = require('node-cron');
const pool = require('../database');
const { createNotification } = require('../controllers/notificationController');

const runDeadlineNotifier = () => {
  // Runs every day at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('[CRON] Running deadline notifier...');

    try {
      // Due tomorrow
      const tomorrowResult = await pool.query(
        `SELECT t.id, t.title, t.assigned_user_id 
         FROM tasks t
         WHERE t.deadline = CURRENT_DATE + INTERVAL '1 day'
           AND t.status != 'Done'
           AND t.assigned_user_id IS NOT NULL`
      );

      await Promise.all(
        tomorrowResult.rows.map((task) =>
          createNotification(task.assigned_user_id, `Reminder: "${task.title}" is due tomorrow.`)
        )
      );

      // Overdue
      const overdueResult = await pool.query(
        `SELECT t.id, t.title, t.assigned_user_id
         FROM tasks t
         WHERE t.deadline < CURRENT_DATE
           AND t.status != 'Done'
           AND t.assigned_user_id IS NOT NULL`
      );

      await Promise.all(
        overdueResult.rows.map((task) =>
          createNotification(task.assigned_user_id, `Alert: "${task.title}" is overdue!`)
        )
      );

      console.log(`[CRON] Notified ${tomorrowResult.rows.length} upcoming, ${overdueResult.rows.length} overdue.`);
    } catch (err) {
      console.error('[CRON] Deadline notifier failed:', err);
    }
  });
};

module.exports = { runDeadlineNotifier };