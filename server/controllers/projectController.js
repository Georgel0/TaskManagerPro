const pool = require('../database');
const { createNotification } = require('./notificationController');

const createProject = async (req, res) => {
  const { name, description } = req.body;
  const userId = req.user.id;

  try {
    const newProject = await pool.query(
      'INSERT INTO projects (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *',
      [name, description, userId]
    );

    res.status(201).json(newProject.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while creating project.' });
  }
};

const getProjects = async (req, res) => {
  const userId = req.user.id;

  try {
    const projects = await pool.query(
      `SELECT 
            p.*,
            COUNT(DISTINCT t.id)::int AS task_count,
            COUNT(DISTINCT CASE WHEN pm.user_id != p.owner_id THEN pm.user_id END)::int + 1 AS member_count,
            COUNT(DISTINCT pa.id)::int AS announcement_count
        FROM projects p
        LEFT JOIN project_members pm ON p.id = pm.project_id
        LEFT JOIN tasks t ON t.project_id = p.id
        LEFT JOIN project_announcements pa ON pa.project_id = p.id
        WHERE p.owner_id = $1 OR EXISTS (
            SELECT 1 FROM project_members pm_access 
            WHERE pm_access.project_id = p.id AND pm_access.user_id = $1
        )
        GROUP BY p.id
        ORDER BY p.created_at DESC;`,
      [userId]
    );

    res.status(200).json(projects.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while fetching projects.' });
  }
};

const updateProject = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  const userId = req.user.id;

  try {
    const project = await pool.query(
      'SELECT * FROM projects WHERE id = $1 AND owner_id = $2',
      [id, userId]
    );

    if (project.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to update this project or project not found.' });
    }

    const oldName = project.rows[0].name;

    const updatedProject = await pool.query(
      'UPDATE projects SET name = $1, description = $2 WHERE id = $3 RETURNING *',
      [name, description, id]
    );

    if (oldName !== name) {
      const membersResult = await pool.query(
        'SELECT user_id FROM project_members WHERE project_id = $1',
        [id]
      );

      await Promise.all(
        membersResult.rows.map((m) =>
          createNotification(m.user_id, `The project "${oldName}" has been renamed to "${name}".`)
        )
      );
    }

    res.status(200).json(updatedProject.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while updating project.' });
  }
};

const deleteProject = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const project = await pool.query(
      'SELECT * FROM projects WHERE id = $1 AND owner_id = $2',
      [id, userId]
    );

    if (project.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to delete this project or project not found.' });
    }

    const membersResult = await pool.query(
      'SELECT user_id FROM project_members WHERE project_id = $1',
      [id]
    );

    await Promise.all(
      membersResult.rows.map((m) =>
        createNotification(m.user_id, `The project "${project.rows[0].name}" has been deleted by the owner.`)
      )
    );

    await pool.query('DELETE FROM projects WHERE id = $1', [id]);
    res.status(200).json({ message: 'Project deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while deleting project.' });
  }
};

const getProjectMembers = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const access = await pool.query(
      `SELECT 1 FROM projects p
       LEFT JOIN project_members pm ON p.id = pm.project_id
       WHERE p.id = $1 AND (p.owner_id = $2 OR pm.user_id = $2)`,
      [id, userId]
    );

    if (access.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    const result = await pool.query(
      `SELECT
        u.id, u.name, u.email, u.avatar,
        'owner' AS role,
        pm_owner.role_description,
        COUNT(t.id) FILTER (WHERE t.status = 'To Do')::int       AS todo_count,
        COUNT(t.id) FILTER (WHERE t.status = 'In Progress')::int  AS in_progress_count,
        COUNT(t.id) FILTER (WHERE t.status = 'Done')::int         AS done_count
      FROM projects p
      JOIN users u ON u.id = p.owner_id
      LEFT JOIN project_members pm_owner ON pm_owner.project_id = p.id AND pm_owner.user_id = p.owner_id
      LEFT JOIN tasks t ON t.assigned_user_id = u.id AND t.project_id = $1
      WHERE p.id = $1
      GROUP BY u.id, u.name, u.email, u.avatar, pm_owner.role_description

      UNION

      SELECT
        u.id, u.name, u.email, u.avatar,
        'member' AS role,
        pm.role_description,
        COUNT(t.id) FILTER (WHERE t.status = 'To Do')::int       AS todo_count,
        COUNT(t.id) FILTER (WHERE t.status = 'In Progress')::int  AS in_progress_count,
        COUNT(t.id) FILTER (WHERE t.status = 'Done')::int         AS done_count
      FROM project_members pm
      JOIN users u ON u.id = pm.user_id
      LEFT JOIN tasks t ON t.assigned_user_id = u.id AND t.project_id = $1
      WHERE pm.project_id = $1
      AND pm.user_id != (SELECT owner_id FROM projects WHERE id = $1)
      GROUP BY u.id, u.name, u.email, u.avatar, pm.role_description`,
      [id]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while fetching members.' });
  }
};

const addProjectMember = async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;
  const userId = req.user.id;

  try {
    const project = await pool.query(
      'SELECT * FROM projects WHERE id = $1 AND owner_id = $2',
      [id, userId]
    );

    if (project.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    const userResult = await pool.query(
      'SELECT id, name, email, avatar FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'No user found with that email.' });
    }

    const member = userResult.rows[0];

    if (member.id === userId) {
      return res.status(400).json({ error: 'You are already the project owner.' });
    }

    const isAlreadyMember = await pool.query(
      'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
      [id, member.id]
    );

    if (isAlreadyMember.rows.length > 0) {
      return res.status(400).json({ error: 'User is already a member of this project.' });
    }

    await pool.query(
      'INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [id, member.id]
    );

    await createNotification(
      member.id,
      `You have been added to the project: ${project.rows[0].name}`
    );

    res.status(200).json({ ...member, role: 'member' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while adding member.' });
  }
};

const removeProjectMember = async (req, res) => {
  const { id, memberId } = req.params;
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
      'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2',
      [id, memberId]
    );

    await createNotification(
      memberId,
      `You have been removed from the project: ${project.rows[0].name}`
    );

    res.status(200).json({ message: 'Member removed.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while removing member.' });
  }
};

const transferOwnership = async (req, res) => {
  const { id, memberId } = req.params;
  const userId = req.user.id;

  try {
    const project = await pool.query(
      'SELECT * FROM projects WHERE id = $1 AND owner_id = $2',
      [id, userId]
    );

    if (project.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    // Verify the target is actually a member of the project
    const memberCheck = await pool.query(
      'SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2',
      [id, memberId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(400).json({ error: 'That user is not a member of this project.' });
    }

    // Transfer ownership in a transaction — atomic, all or nothing
    await pool.query('BEGIN');

    // Set new owner
    await pool.query('UPDATE projects SET owner_id = $1 WHERE id = $2', [memberId, id]);

    // Remove new owner from members table (they're now owner)
    await pool.query('DELETE FROM project_members WHERE project_id = $1 AND user_id = $2', [id, memberId]);

    // Add old owner as a member
    await pool.query(
      'INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [id, userId]
    );

    await pool.query('COMMIT');

    await createNotification(
      Number(memberId),
      `You are now the owner of project: ${project.rows[0].name}`
    );

    await createNotification(
      userId,
      `You transferred ownership of "${project.rows[0].name}" and are now a member.`
    );

    res.status(200).json({ message: 'Ownership transferred successfully.' });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error while transferring ownership.' });
  }
};

const updateRoleDescription = async (req, res) => {
  const { id: projectId, memberId } = req.params;
  const { role_description } = req.body;
  const userId = req.user.id;

  try {

    const projectResult = await pool.query(
      'SELECT owner_id, name FROM projects WHERE id = $1',
      [projectId]
    );

    const { owner_id, name: projectName } = projectResult.rows[0];

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    if (projectResult.rows[0].owner_id !== userId && userId !== parseInt(memberId)) {
      return res.status(403).json({ error: 'Not authorized to edit this role.' });
    }

    await pool.query(
      `INSERT INTO project_members (project_id, user_id, role_description)
       VALUES ($1, $2, $3)
       ON CONFLICT (project_id, user_id)
       DO UPDATE SET role_description = EXCLUDED.role_description`,
      [projectId, memberId, role_description]
    );

    if (owner_id === userId && userId !== parseInt(memberId)) {
      await createNotification(parseInt(memberId),
        `Your role in "${projectName}" has been updated.`
      );
    }

    res.status(200).json({ message: 'Role description updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while updating role description.' });
  }
};

const leaveProject = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const project = await pool.query(
      'SELECT * FROM projects WHERE id = $1',
      [id]
    );

    if (project.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    if (project.rows[0].owner_id === userId) {
      return res.status(400).json({ error: 'Owner cannot leave. Transfer ownership first.' });
    }

    await pool.query(
      'UPDATE tasks SET assigned_user_id = NULL WHERE project_id = $1 AND assigned_user_id = $2',
      [id, userId]
    );

    await pool.query(
      'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2',
      [id, userId]
    );

    // Get the leaving user's name for the notification message
    const userResult = await pool.query(
      'SELECT name FROM users WHERE id = $1',
      [userId]
    );
    const userName = userResult.rows[0]?.name || 'A member';

    // Get all remaining members + owner
    const membersResult = await pool.query(
      `SELECT user_id AS id FROM project_members WHERE project_id = $1
       UNION
       SELECT owner_id AS id FROM projects WHERE id = $1`,
      [id]
    );

    await Promise.all(
      membersResult.rows
        .filter((m) => m.id !== userId)
        .map((m) =>
          createNotification(m.id, `${userName} left the project "${project.rows[0].name}".`)
        )
    );

    await createNotification(userId, `You left the project "${project.rows[0].name}".`);

    res.status(200).json({ message: 'You have left the project.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while leaving project.' });
  }
};

const getAnnouncements = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // Check access
    const access = await pool.query(
      `SELECT 1 FROM projects p
       LEFT JOIN project_members pm ON p.id = pm.project_id
       WHERE p.id = $1 AND (p.owner_id = $2 OR pm.user_id = $2)`,
      [id, userId]
    );

    if (access.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to view announcements.' });
    }

    const result = await pool.query(
      `SELECT a.*, 
              u.name as author_name, u.avatar as author_avatar,
              EXISTS(SELECT 1 FROM announcement_acknowledgments ack WHERE ack.announcement_id = a.id AND ack.user_id = $2) as is_acknowledged,
              (SELECT COUNT(*)::int FROM announcement_acknowledgments ack WHERE ack.announcement_id = a.id) as ack_count,
              (SELECT COUNT(DISTINCT user_id)::int FROM project_members pm WHERE pm.project_id = $1) as total_members
       FROM project_announcements a
       LEFT JOIN users u ON u.id = a.author_id
       WHERE a.project_id = $1
       ORDER BY a.is_pinned DESC, a.created_at DESC`,
      [id, userId]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while fetching announcements.' });
  }
};

const createAnnouncement = async (req, res) => {
  const { id: projectId } = req.params;
  const { title, content, type, isPinned } = req.body;
  const userId = req.user.id;

  try {
    const project = await pool.query('SELECT owner_id, name FROM projects WHERE id = $1', [projectId]);

    if (project.rows.length === 0 || project.rows[0].owner_id !== userId) {
      return res.status(403).json({ error: 'Only the project owner can make announcements.' });
    }

    // If this is pinned, unpin others to maintain a single pinned post
    if (isPinned) {
      await pool.query('UPDATE project_announcements SET is_pinned = false WHERE project_id = $1', [projectId]);
    }

    const result = await pool.query(
      `INSERT INTO project_announcements (project_id, author_id, title, content, type, is_pinned)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [projectId, userId, title, content, type, isPinned]
    );

    const membersResult = await pool.query(
      'SELECT user_id FROM project_members WHERE project_id = $1', [projectId]
    );

    await Promise.all(
      membersResult.rows
        .filter(m => m.user_id !== userId)
        .map((m) =>
          createNotification(m.user_id, `New announcement in "${project.rows[0].name}": ${title}`)
        )
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while creating announcement.' });
  }
};

const toggleAcknowledgment = async (req, res) => {
  const { id: projectId, announcementId } = req.params;
  const userId = req.user.id;

  try {
    const isAcknowledged = await pool.query(
      'SELECT 1 FROM announcement_acknowledgments WHERE announcement_id = $1 AND user_id = $2',
      [announcementId, userId]
    );

    if (isAcknowledged.rows.length > 0) {
      await pool.query(
        'DELETE FROM announcement_acknowledgments WHERE announcement_id = $1 AND user_id = $2',
        [announcementId, userId]
      );
      return res.status(200).json({ acknowledged: false });
    } else {
      await pool.query(
        'INSERT INTO announcement_acknowledgments (announcement_id, user_id) VALUES ($1, $2)',
        [announcementId, userId]
      );
      return res.status(200).json({ acknowledged: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while toggling acknowledgment.' });
  }
};

const deleteAnnouncement = async (req, res) => {
  const { announcementId } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM project_announcements WHERE id = $1',
      [announcementId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Announcement not found.' });
    }

    res.status(200).json({ message: 'Announcement deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete announcement.' });
  }
};

module.exports = {
  createProject,
  getProjects,
  updateProject,
  deleteProject,
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
  transferOwnership,
  updateRoleDescription,
  leaveProject,
  getAnnouncements,
  createAnnouncement,
  toggleAcknowledgment,
  deleteAnnouncement
};