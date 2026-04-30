const pool = require('../database');

const escapeCSV = (val) => {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const toCSV = (rows, headers) => {
  const headerRow = headers.map(h => escapeCSV(h.label)).join(',');
  if (!rows || rows.length === 0) {
    return `${headerRow}\n(No data)`;
  }
  const dataRows = rows.map(row =>
    headers.map(h => escapeCSV(row[h.key])).join(',')
  );
  return [headerRow, ...dataRows].join('\n');
};

const buildMultiSectionCSV = (sections) => {
  return sections
    .map(s => `[${s.title}]\n${toCSV(s.rows, s.headers)}`)
    .join('\n\n');
};

const sendCSV = (res, filename, content) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.status(200).send('\uFEFF' + content); // BOM for Excel compatibility
};

const timestamp = () => new Date().toISOString().split('T')[0];

const checkTaskAccess = async (taskId, userId) => {
  const result = await pool.query(`
    SELECT t.id FROM tasks t
    LEFT JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = $2
    WHERE t.id = $1 AND (t.assigned_user_id = $2 OR pm.user_id IS NOT NULL)
  `, [taskId, userId]);
  return result.rows.length > 0;
};

const checkProjectOwner = async (projectId, userId) => {
  const result = await pool.query(
    'SELECT id FROM projects WHERE id = $1 AND owner_id = $2',
    [projectId, userId]
  );
  return result.rows.length > 0;
};


// Export a single task. 
// Query param: ?full=true for comments/attachments/subtasks
const exportTask = async (req, res) => {
  const userId = req.user.id;
  const { taskId } = req.params;
  const full = req.query.full === 'true';

  try {
    if (!(await checkTaskAccess(taskId, userId))) {
      return res.status(403).json({ error: 'Access denied to this task.' });
    }

    const taskResult = await pool.query(`
      SELECT t.id, t.title, t.description, t.status, t.priority,
             t.deadline, t.created_at, t.is_archived,
             p.name AS project_name,
             u.name AS assigned_user_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assigned_user_id = u.id
      WHERE t.id = $1
    `, [taskId]);

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const task = taskResult.rows[0];

    if (!full) {
      const csv = toCSV([task], [
        { key: 'id',                 label: 'ID' },
        { key: 'title',              label: 'Title' },
        { key: 'description',        label: 'Description' },
        { key: 'status',             label: 'Status' },
        { key: 'priority',           label: 'Priority' },
        { key: 'deadline',           label: 'Deadline' },
        { key: 'project_name',       label: 'Project' },
        { key: 'assigned_user_name', label: 'Assigned To' },
        { key: 'is_archived',        label: 'Archived' },
        { key: 'created_at',         label: 'Created At' },
      ]);
      return sendCSV(res, `task-${taskId}-${timestamp()}.csv`, csv);
    }

    // Full: include comments, attachments, subtasks
    const [commentsRes, attachmentsRes, subtasksRes] = await Promise.all([
      pool.query(`
        SELECT c.id, u.name AS author, c.comment, c.created_at, c.updated_at
        FROM comments c JOIN users u ON c.user_id = u.id
        WHERE c.task_id = $1 ORDER BY c.created_at ASC
      `, [taskId]),
      pool.query(`
        SELECT a.id, a.original_name, a.file_type, a.file_size,
               u.name AS uploaded_by, a.uploaded_at
        FROM attachments a LEFT JOIN users u ON a.user_id = u.id
        WHERE a.task_id = $1 ORDER BY a.uploaded_at ASC
      `, [taskId]),
      pool.query(`
        SELECT id, title, is_completed, created_at
        FROM subtasks WHERE task_id = $1 ORDER BY created_at ASC
      `, [taskId]),
    ]);

    const csv = buildMultiSectionCSV([
      {
        title: 'Task Details',
        headers: [
          { key: 'id',                 label: 'ID' },
          { key: 'title',              label: 'Title' },
          { key: 'description',        label: 'Description' },
          { key: 'status',             label: 'Status' },
          { key: 'priority',           label: 'Priority' },
          { key: 'deadline',           label: 'Deadline' },
          { key: 'project_name',       label: 'Project' },
          { key: 'assigned_user_name', label: 'Assigned To' },
          { key: 'created_at',         label: 'Created At' },
        ],
        rows: [task],
      },
      {
        title: 'Subtasks',
        headers: [
          { key: 'id',           label: 'ID' },
          { key: 'title',        label: 'Title' },
          { key: 'is_completed', label: 'Completed' },
          { key: 'created_at',   label: 'Created At' },
        ],
        rows: subtasksRes.rows.map(s => ({ ...s, is_completed: s.is_completed ? 'Yes' : 'No' })),
      },
      {
        title: 'Comments',
        headers: [
          { key: 'id',         label: 'ID' },
          { key: 'author',     label: 'Author' },
          { key: 'comment',    label: 'Comment' },
          { key: 'created_at', label: 'Created At' },
          { key: 'updated_at', label: 'Updated At' },
        ],
        rows: commentsRes.rows,
      },
      {
        title: 'Attachments',
        headers: [
          { key: 'id',            label: 'ID' },
          { key: 'original_name', label: 'File Name' },
          { key: 'file_type',     label: 'File Type' },
          { key: 'file_size',     label: 'File Size (bytes)' },
          { key: 'uploaded_by',   label: 'Uploaded By' },
          { key: 'uploaded_at',   label: 'Uploaded At' },
        ],
        rows: attachmentsRes.rows,
      },
    ]);

    return sendCSV(res, `task-${taskId}-full-${timestamp()}.csv`, csv);

  } catch (err) {
    console.error('exportTask error:', err);
    res.status(500).json({ error: 'Failed to export task.' });
  }
};

//Export all of the authenticated user's tasks (flat CSV).
// Query params: project_id, status, priority, include_done
const exportMyTasks = async (req, res) => {
  const userId = req.user.id;
  const { project_id, status, priority, include_done } = req.query;

  try {
    const params = [userId];
    let idx = 2;

    let query = `
      SELECT
        t.id, t.title, t.description, t.status, t.priority,
        t.deadline, t.created_at, t.is_archived,
        p.name AS project_name,
        COUNT(DISTINCT c.id)::int  AS comment_count,
        COUNT(DISTINCT a.id)::int  AS attachment_count,
        COUNT(DISTINCT s.id)::int  AS subtask_count,
        COUNT(DISTINCT s.id) FILTER (WHERE s.is_completed = true)::int AS completed_subtasks
      FROM tasks t
      LEFT JOIN projects    p ON t.project_id = p.id
      LEFT JOIN comments    c ON c.task_id = t.id
      LEFT JOIN attachments a ON a.task_id = t.id
      LEFT JOIN subtasks    s ON s.task_id = t.id
      WHERE t.assigned_user_id = $1
    `;

    if (include_done !== 'true') query += ` AND t.status != 'Done'`;
    if (project_id) { query += ` AND t.project_id = $${idx++}`; params.push(project_id); }
    if (status)     { query += ` AND t.status    = $${idx++}`; params.push(status); }
    if (priority)   { query += ` AND t.priority  = $${idx++}`; params.push(priority); }

    query += `
      GROUP BY t.id, t.title, t.description, t.status, t.priority,
               t.deadline, t.created_at, t.is_archived, p.name
      ORDER BY t.deadline ASC NULLS LAST, t.created_at DESC
    `;

    const result = await pool.query(query, params);

    const csv = toCSV(result.rows, [
      { key: 'id',                  label: 'Task ID' },
      { key: 'title',               label: 'Title' },
      { key: 'description',         label: 'Description' },
      { key: 'status',              label: 'Status' },
      { key: 'priority',            label: 'Priority' },
      { key: 'deadline',            label: 'Deadline' },
      { key: 'project_name',        label: 'Project' },
      { key: 'comment_count',       label: 'Comments' },
      { key: 'attachment_count',    label: 'Attachments' },
      { key: 'subtask_count',       label: 'Subtasks Total' },
      { key: 'completed_subtasks',  label: 'Subtasks Done' },
      { key: 'is_archived',         label: 'Archived' },
      { key: 'created_at',          label: 'Created At' },
    ]);

    sendCSV(res, `my-tasks-${timestamp()}.csv`, csv);

  } catch (err) {
    console.error('exportMyTasks error:', err);
    res.status(500).json({ error: 'Failed to export tasks.' });
  }
};

// Multi-section CSV: tasks + their subtasks, comments, attachments.
// Query params: project_id
const exportMyTasksFull = async (req, res) => {
  const userId = req.user.id;
  const { project_id } = req.query;

  try {
    const params = [userId];
    let taskQuery = `
      SELECT t.id, t.title, t.description, t.status, t.priority,
             t.deadline, t.created_at, p.name AS project_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.assigned_user_id = $1
    `;

    if (project_id) { taskQuery += ` AND t.project_id = $2`; params.push(project_id); }
    taskQuery += ` ORDER BY t.deadline ASC NULLS LAST`;

    const tasksResult = await pool.query(taskQuery, params);
    const taskIds = tasksResult.rows.map(t => t.id);

    if (taskIds.length === 0) {
      return sendCSV(res, `my-tasks-full-${timestamp()}.csv`,
        buildMultiSectionCSV([{ title: 'Tasks', headers: [{ key: 'msg', label: 'Message' }], rows: [{ msg: 'No tasks found.' }] }])
      );
    }

    const [subtasksRes, commentsRes, attachmentsRes] = await Promise.all([
      pool.query(`
        SELECT task_id, id, title, is_completed, created_at
        FROM subtasks WHERE task_id = ANY($1) ORDER BY task_id, created_at
      `, [taskIds]),
      pool.query(`
        SELECT c.task_id, c.id, u.name AS author, c.comment, c.created_at
        FROM comments c JOIN users u ON c.user_id = u.id
        WHERE c.task_id = ANY($1) ORDER BY c.task_id, c.created_at
      `, [taskIds]),
      pool.query(`
        SELECT a.task_id, a.id, a.original_name, a.file_type, a.file_size,
               u.name AS uploaded_by, a.uploaded_at
        FROM attachments a LEFT JOIN users u ON a.user_id = u.id
        WHERE a.task_id = ANY($1) ORDER BY a.task_id, a.uploaded_at
      `, [taskIds]),
    ]);

    const csv = buildMultiSectionCSV([
      {
        title: 'Tasks',
        headers: [
          { key: 'id',           label: 'Task ID' },
          { key: 'title',        label: 'Title' },
          { key: 'description',  label: 'Description' },
          { key: 'status',       label: 'Status' },
          { key: 'priority',     label: 'Priority' },
          { key: 'deadline',     label: 'Deadline' },
          { key: 'project_name', label: 'Project' },
          { key: 'created_at',   label: 'Created At' },
        ],
        rows: tasksResult.rows,
      },
      {
        title: 'Subtasks',
        headers: [
          { key: 'task_id',      label: 'Task ID' },
          { key: 'id',           label: 'Subtask ID' },
          { key: 'title',        label: 'Title' },
          { key: 'is_completed', label: 'Completed' },
          { key: 'created_at',   label: 'Created At' },
        ],
        rows: subtasksRes.rows.map(s => ({ ...s, is_completed: s.is_completed ? 'Yes' : 'No' })),
      },
      {
        title: 'Comments',
        headers: [
          { key: 'task_id',    label: 'Task ID' },
          { key: 'id',         label: 'Comment ID' },
          { key: 'author',     label: 'Author' },
          { key: 'comment',    label: 'Comment' },
          { key: 'created_at', label: 'Created At' },
        ],
        rows: commentsRes.rows,
      },
      {
        title: 'Attachments',
        headers: [
          { key: 'task_id',       label: 'Task ID' },
          { key: 'id',            label: 'Attachment ID' },
          { key: 'original_name', label: 'File Name' },
          { key: 'file_type',     label: 'File Type' },
          { key: 'file_size',     label: 'File Size (bytes)' },
          { key: 'uploaded_by',   label: 'Uploaded By' },
          { key: 'uploaded_at',   label: 'Uploaded At' },
        ],
        rows: attachmentsRes.rows,
      },
    ]);

    sendCSV(res, `my-tasks-full-${timestamp()}.csv`, csv);

  } catch (err) {
    console.error('exportMyTasksFull error:', err);
    res.status(500).json({ error: 'Failed to export full tasks.' });
  }
};


// All tasks in a project. Owner only.
// Query param: ?full=true adds subtasks/comments/attachments sections
const exportProjectTasks = async (req, res) => {
  const userId = req.user.id;
  const { projectId } = req.params;
  const full = req.query.full === 'true';

  try {
    if (!(await checkProjectOwner(projectId, userId))) {
      return res.status(403).json({ error: 'Only project owners can export project tasks.' });
    }

    const tasksResult = await pool.query(`
      SELECT
        t.id, t.title, t.description, t.status, t.priority,
        t.deadline, t.created_at, t.is_archived,
        u.name AS assigned_user_name,
        COUNT(DISTINCT c.id)::int AS comment_count,
        COUNT(DISTINCT a.id)::int AS attachment_count,
        COUNT(DISTINCT s.id)::int AS subtask_count,
        COUNT(DISTINCT s.id) FILTER (WHERE s.is_completed = true)::int AS completed_subtasks
      FROM tasks t
      LEFT JOIN users      u ON t.assigned_user_id = u.id
      LEFT JOIN comments   c ON c.task_id = t.id
      LEFT JOIN attachments a ON a.task_id = t.id
      LEFT JOIN subtasks   s ON s.task_id = t.id
      WHERE t.project_id = $1
      GROUP BY t.id, u.name
      ORDER BY t.deadline ASC NULLS LAST
    `, [projectId]);

    if (!full) {
      const csv = toCSV(tasksResult.rows, [
        { key: 'id',                 label: 'Task ID' },
        { key: 'title',              label: 'Title' },
        { key: 'description',        label: 'Description' },
        { key: 'status',             label: 'Status' },
        { key: 'priority',           label: 'Priority' },
        { key: 'deadline',           label: 'Deadline' },
        { key: 'assigned_user_name', label: 'Assigned To' },
        { key: 'comment_count',      label: 'Comments' },
        { key: 'attachment_count',   label: 'Attachments' },
        { key: 'subtask_count',      label: 'Subtasks Total' },
        { key: 'completed_subtasks', label: 'Subtasks Done' },
        { key: 'is_archived',        label: 'Archived' },
        { key: 'created_at',         label: 'Created At' },
      ]);
      return sendCSV(res, `project-${projectId}-tasks-${timestamp()}.csv`, csv);
    }

    const taskIds = tasksResult.rows.map(t => t.id);
    if (taskIds.length === 0) {
      return sendCSV(res, `project-${projectId}-tasks-full-${timestamp()}.csv`,
        '[Tasks]\nNo tasks found.'
      );
    }

    const [subtasksRes, commentsRes, attachmentsRes] = await Promise.all([
      pool.query(`SELECT task_id, id, title, is_completed, created_at FROM subtasks WHERE task_id = ANY($1) ORDER BY task_id`, [taskIds]),
      pool.query(`
        SELECT c.task_id, c.id, u.name AS author, c.comment, c.created_at
        FROM comments c JOIN users u ON c.user_id = u.id
        WHERE c.task_id = ANY($1) ORDER BY c.task_id, c.created_at
      `, [taskIds]),
      pool.query(`
        SELECT a.task_id, a.id, a.original_name, a.file_type, a.file_size,
               u.name AS uploaded_by, a.uploaded_at
        FROM attachments a LEFT JOIN users u ON a.user_id = u.id
        WHERE a.task_id = ANY($1) ORDER BY a.task_id
      `, [taskIds]),
    ]);

    const csv = buildMultiSectionCSV([
      {
        title: 'Project Tasks',
        headers: [
          { key: 'id',                 label: 'Task ID' },
          { key: 'title',              label: 'Title' },
          { key: 'description',        label: 'Description' },
          { key: 'status',             label: 'Status' },
          { key: 'priority',           label: 'Priority' },
          { key: 'deadline',           label: 'Deadline' },
          { key: 'assigned_user_name', label: 'Assigned To' },
          { key: 'created_at',         label: 'Created At' },
        ],
        rows: tasksResult.rows,
      },
      {
        title: 'Subtasks',
        headers: [
          { key: 'task_id',      label: 'Task ID' },
          { key: 'id',           label: 'Subtask ID' },
          { key: 'title',        label: 'Title' },
          { key: 'is_completed', label: 'Completed' },
        ],
        rows: subtasksRes.rows.map(s => ({ ...s, is_completed: s.is_completed ? 'Yes' : 'No' })),
      },
      {
        title: 'Comments',
        headers: [
          { key: 'task_id',    label: 'Task ID' },
          { key: 'id',         label: 'Comment ID' },
          { key: 'author',     label: 'Author' },
          { key: 'comment',    label: 'Comment' },
          { key: 'created_at', label: 'Created At' },
        ],
        rows: commentsRes.rows,
      },
      {
        title: 'Attachments',
        headers: [
          { key: 'task_id',       label: 'Task ID' },
          { key: 'id',            label: 'Attachment ID' },
          { key: 'original_name', label: 'File Name' },
          { key: 'file_type',     label: 'File Type' },
          { key: 'file_size',     label: 'File Size (bytes)' },
          { key: 'uploaded_by',   label: 'Uploaded By' },
          { key: 'uploaded_at',   label: 'Uploaded At' },
        ],
        rows: attachmentsRes.rows,
      },
    ]);

    sendCSV(res, `project-${projectId}-tasks-full-${timestamp()}.csv`, csv);

  } catch (err) {
    console.error('exportProjectTasks error:', err);
    res.status(500).json({ error: 'Failed to export project tasks.' });
  }
};

// Members with their task stats. Owner only.
const exportProjectMembers = async (req, res) => {
  const userId = req.user.id;
  const { projectId } = req.params;

  try {
    if (!(await checkProjectOwner(projectId, userId))) {
      return res.status(403).json({ error: 'Only project owners can export member data.' });
    }

    const membersResult = await pool.query(`
      SELECT
        u.id, u.name, u.email, pm.role_description,
        CASE WHEN p.owner_id = u.id THEN 'Owner' ELSE 'Member' END AS role,
        COUNT(DISTINCT t.id)::int                                           AS total_tasks,
        COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'Done')::int         AS completed_tasks,
        COUNT(DISTINCT t.id) FILTER (WHERE t.status != 'Done')::int        AS pending_tasks,
        COUNT(DISTINCT t.id) FILTER (WHERE t.priority = 'High' AND t.status != 'Done')::int AS high_priority_pending,
        COUNT(DISTINCT c.id)::int AS total_comments
      FROM project_members pm
      JOIN users    u ON pm.user_id    = u.id
      JOIN projects p ON pm.project_id = p.id
      LEFT JOIN tasks    t ON t.assigned_user_id = u.id AND t.project_id = $1
      LEFT JOIN comments c ON c.user_id = u.id AND c.task_id IN (
        SELECT id FROM tasks WHERE project_id = $1
      )
      WHERE pm.project_id = $1
      GROUP BY u.id, u.name, u.email, pm.role_description, p.owner_id
      ORDER BY role DESC, u.name ASC
    `, [projectId]);

    const csv = toCSV(membersResult.rows, [
      { key: 'id',                   label: 'User ID' },
      { key: 'name',                 label: 'Name' },
      { key: 'email',                label: 'Email' },
      { key: 'role',                 label: 'Role' },
      { key: 'role_description',     label: 'Role Description' },
      { key: 'total_tasks',          label: 'Total Tasks' },
      { key: 'completed_tasks',      label: 'Completed Tasks' },
      { key: 'pending_tasks',        label: 'Pending Tasks' },
      { key: 'high_priority_pending',label: 'High Priority Pending' },
      { key: 'total_comments',       label: 'Comments Made' },
    ]);

    sendCSV(res, `project-${projectId}-members-${timestamp()}.csv`, csv);

  } catch (err) {
    console.error('exportProjectMembers error:', err);
    res.status(500).json({ error: 'Failed to export project members.' });
  }
};

// Project announcements with acknowledgment stats. Owner only.
const exportProjectAnnouncements = async (req, res) => {
  const userId = req.user.id;
  const { projectId } = req.params;

  try {
    if (!(await checkProjectOwner(projectId, userId))) {
      return res.status(403).json({ error: 'Only project owners can export announcements.' });
    }

    const result = await pool.query(`
      SELECT
        pa.id, pa.title, pa.content, pa.type, pa.is_pinned,
        u.name  AS author_name,
        pa.created_at,
        COUNT(aa.user_id)::int AS acknowledgment_count,
        (SELECT COUNT(*) FROM project_members WHERE project_id = $1)::int AS total_members
      FROM project_announcements pa
      LEFT JOIN users u ON pa.author_id = u.id
      LEFT JOIN announcement_acknowledgments aa ON aa.announcement_id = pa.id
      WHERE pa.project_id = $1
      GROUP BY pa.id, u.name
      ORDER BY pa.is_pinned DESC, pa.created_at DESC
    `, [projectId]);

    const csv = toCSV(result.rows, [
      { key: 'id',                    label: 'ID' },
      { key: 'title',                 label: 'Title' },
      { key: 'content',               label: 'Content' },
      { key: 'type',                  label: 'Type' },
      { key: 'is_pinned',             label: 'Pinned' },
      { key: 'author_name',           label: 'Author' },
      { key: 'acknowledgment_count',  label: 'Acknowledged By' },
      { key: 'total_members',         label: 'Total Members' },
      { key: 'created_at',            label: 'Created At' },
    ]);

    sendCSV(res, `project-${projectId}-announcements-${timestamp()}.csv`, csv);

  } catch (err) {
    console.error('exportProjectAnnouncements error:', err);
    res.status(500).json({ error: 'Failed to export announcements.' });
  }
};

// Everything: project info, members, tasks, subtasks, comments, attachments, announcements. Owner only.
const exportProjectFull = async (req, res) => {
  const userId = req.user.id;
  const { projectId } = req.params;

  try {
    const projectCheck = await pool.query(
      'SELECT id, name, description, created_at FROM projects WHERE id = $1 AND owner_id = $2',
      [projectId, userId]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Only project owners can export the full report.' });
    }

    const project = projectCheck.rows[0];

    const [membersRes, tasksRes, announcementsRes] = await Promise.all([
      pool.query(`
        SELECT u.id, u.name, u.email, pm.role_description,
               CASE WHEN p.owner_id = u.id THEN 'Owner' ELSE 'Member' END AS role,
               COUNT(DISTINCT t.id)::int AS total_tasks,
               COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'Done')::int AS completed_tasks
        FROM project_members pm
        JOIN users    u ON pm.user_id    = u.id
        JOIN projects p ON pm.project_id = p.id
        LEFT JOIN tasks t ON t.assigned_user_id = u.id AND t.project_id = $1
        WHERE pm.project_id = $1
        GROUP BY u.id, u.name, u.email, pm.role_description, p.owner_id
        ORDER BY role DESC, u.name
      `, [projectId]),
      pool.query(`
        SELECT t.id, t.title, t.description, t.status, t.priority,
               t.deadline, t.created_at, t.is_archived,
               u.name AS assigned_user_name
        FROM tasks t
        LEFT JOIN users u ON t.assigned_user_id = u.id
        WHERE t.project_id = $1
        ORDER BY t.deadline ASC NULLS LAST
      `, [projectId]),
      pool.query(`
        SELECT pa.id, pa.title, pa.content, pa.type, pa.is_pinned,
               u.name AS author_name, pa.created_at,
               COUNT(aa.user_id)::int AS acknowledgment_count
        FROM project_announcements pa
        LEFT JOIN users u ON pa.author_id = u.id
        LEFT JOIN announcement_acknowledgments aa ON aa.announcement_id = pa.id
        WHERE pa.project_id = $1
        GROUP BY pa.id, u.name
        ORDER BY pa.created_at DESC
      `, [projectId]),
    ]);

    const taskIds = tasksRes.rows.map(t => t.id);
    let subtasksRows = [], commentsRows = [], attachmentsRows = [];

    if (taskIds.length > 0) {
      const [sr, cr, ar] = await Promise.all([
        pool.query(`SELECT task_id, id, title, is_completed, created_at FROM subtasks WHERE task_id = ANY($1) ORDER BY task_id`, [taskIds]),
        pool.query(`
          SELECT c.task_id, c.id, u.name AS author, c.comment, c.created_at
          FROM comments c JOIN users u ON c.user_id = u.id
          WHERE c.task_id = ANY($1) ORDER BY c.task_id, c.created_at
        `, [taskIds]),
        pool.query(`
          SELECT a.task_id, a.id, a.original_name, a.file_type, a.file_size,
                 u.name AS uploaded_by, a.uploaded_at
          FROM attachments a LEFT JOIN users u ON a.user_id = u.id
          WHERE a.task_id = ANY($1) ORDER BY a.task_id
        `, [taskIds]),
      ]);
      subtasksRows = sr.rows.map(s => ({ ...s, is_completed: s.is_completed ? 'Yes' : 'No' }));
      commentsRows = cr.rows;
      attachmentsRows = ar.rows;
    }

    const csv = buildMultiSectionCSV([
      {
        title: `Project: ${project.name}`,
        headers: [
          { key: 'id',          label: 'Project ID' },
          { key: 'name',        label: 'Name' },
          { key: 'description', label: 'Description' },
          { key: 'created_at',  label: 'Created At' },
        ],
        rows: [project],
      },
      {
        title: 'Members',
        headers: [
          { key: 'id',               label: 'User ID' },
          { key: 'name',             label: 'Name' },
          { key: 'email',            label: 'Email' },
          { key: 'role',             label: 'Role' },
          { key: 'role_description', label: 'Role Description' },
          { key: 'total_tasks',      label: 'Total Tasks' },
          { key: 'completed_tasks',  label: 'Completed Tasks' },
        ],
        rows: membersRes.rows,
      },
      {
        title: 'Tasks',
        headers: [
          { key: 'id',                 label: 'Task ID' },
          { key: 'title',              label: 'Title' },
          { key: 'description',        label: 'Description' },
          { key: 'status',             label: 'Status' },
          { key: 'priority',           label: 'Priority' },
          { key: 'deadline',           label: 'Deadline' },
          { key: 'assigned_user_name', label: 'Assigned To' },
          { key: 'is_archived',        label: 'Archived' },
          { key: 'created_at',         label: 'Created At' },
        ],
        rows: tasksRes.rows,
      },
      {
        title: 'Subtasks',
        headers: [
          { key: 'task_id',      label: 'Task ID' },
          { key: 'id',           label: 'Subtask ID' },
          { key: 'title',        label: 'Title' },
          { key: 'is_completed', label: 'Completed' },
          { key: 'created_at',   label: 'Created At' },
        ],
        rows: subtasksRows,
      },
      {
        title: 'Comments',
        headers: [
          { key: 'task_id',    label: 'Task ID' },
          { key: 'id',         label: 'Comment ID' },
          { key: 'author',     label: 'Author' },
          { key: 'comment',    label: 'Comment' },
          { key: 'created_at', label: 'Created At' },
        ],
        rows: commentsRows,
      },
      {
        title: 'Attachments',
        headers: [
          { key: 'task_id',       label: 'Task ID' },
          { key: 'id',            label: 'Attachment ID' },
          { key: 'original_name', label: 'File Name' },
          { key: 'file_type',     label: 'File Type' },
          { key: 'file_size',     label: 'File Size (bytes)' },
          { key: 'uploaded_by',   label: 'Uploaded By' },
          { key: 'uploaded_at',   label: 'Uploaded At' },
        ],
        rows: attachmentsRows,
      },
      {
        title: 'Announcements',
        headers: [
          { key: 'id',                   label: 'ID' },
          { key: 'title',                label: 'Title' },
          { key: 'content',              label: 'Content' },
          { key: 'type',                 label: 'Type' },
          { key: 'is_pinned',            label: 'Pinned' },
          { key: 'author_name',          label: 'Author' },
          { key: 'acknowledgment_count', label: 'Acknowledgments' },
          { key: 'created_at',           label: 'Created At' },
        ],
        rows: announcementsRes.rows.map(a => ({ ...a, is_pinned: a.is_pinned ? 'Yes' : 'No' })),
      },
    ]);

    sendCSV(res, `project-${projectId}-full-report-${timestamp()}.csv`, csv);

  } catch (err) {
    console.error('exportProjectFull error:', err);
    res.status(500).json({ error: 'Failed to export full project report.' });
  }
};

module.exports = {
  exportTask,
  exportMyTasks,
  exportMyTasksFull,
  exportProjectTasks,
  exportProjectMembers,
  exportProjectAnnouncements,
  exportProjectFull,
};