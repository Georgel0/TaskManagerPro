const pool = require('../database');

const getDashboardSummary = async (req, res) => {
  const userId = req.user.id;

  try {
    // Get Statistics (Total, Completed, Pending)
    // Using FILTER to get all these counts in a single query
    const statsQuery = `
      SELECT 
        COUNT(*) AS total_tasks,
        COUNT(*) FILTER (WHERE status = 'Done') AS completed_tasks,
        COUNT(*) FILTER (WHERE status != 'Done') AS pending_tasks
      FROM tasks
      WHERE assigned_user_id = $1
    `;
    const statsResult = await pool.query(statsQuery, [userId]);

    // Get Active Tasks (Not Done)
    const activeTasksQuery = `
      SELECT t.id, t.title, t.status, t.priority, t.deadline, t.project_id, u.name AS assigned_user_name, t.created_at
      FROM tasks t
      JOIN users u ON t.assigned_user_id = u.id
      WHERE t.assigned_user_id = $1 AND t.status != 'Done'
      ORDER BY t.deadline ASC NULLS LAST
      LIMIT 5
    `;
    const activeTasksResult = await pool.query(activeTasksQuery, [userId]);

    // Get Completed Tasks
    const completedTasksQuery = `
      SELECT t.id, t.title, t.status, t.priority, t.deadline, t.project_id, u.name AS assigned_user_name, t.created_at
      FROM tasks t
      JOIN users u ON t.assigned_user_id = u.id
      WHERE t.assigned_user_id = $1 AND t.status = 'Done'
      ORDER BY t.deadline DESC NULLS LAST
      LIMIT 5
    `;
    const completedTasksResult = await pool.query(completedTasksQuery, [userId]);

    // Get Tasks with Upcoming Deadlines (Due in the next 7 days)
    const upcomingDeadlinesQuery = `
      SELECT t.id, t.title, t.status, t.priority, t.deadline, t.project_id, u.name AS assigned_user_name, t.created_at
      FROM tasks t
      JOIN users u ON t.assigned_user_id = u.id
      WHERE t.assigned_user_id = $1 
        AND t.status != 'Done'
        AND t.deadline BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
      ORDER BY t.deadline ASC
    `;
    const upcomingDeadlinesResult = await pool.query(upcomingDeadlinesQuery, [userId]);

    // Send everything back in one clean JSON object
    res.status(200).json({
      statistics: {
        totalTasks: parseInt(statsResult.rows[0].total_tasks) || 0,
        completedTasks: parseInt(statsResult.rows[0].completed_tasks) || 0,
        pendingTasks: parseInt(statsResult.rows[0].pending_tasks) || 0
      },
      activeTasks: activeTasksResult.rows,
      completedTasks: completedTasksResult.rows,
      upcomingDeadlines: upcomingDeadlinesResult.rows
    });

  } catch (err) {
    console.error("Dashboard Error: ", err);
    res.status(500).json({ error: "Server error while fetching dashboard data." });
  }
};

module.exports = { getDashboardSummary };