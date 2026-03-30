const pool = require('../database');

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
      `SELECT p.*,
       COUNT(DISTINCT t.id)::int AS task_count,
       COUNT(DISTINCT pm.user_id)::int + 1 AS member_count
       FROM projects p
       LEFT JOIN project_members pm ON p.id = pm.project_id
       LEFT JOIN tasks t ON t.project_id = p.id
       WHERE p.owner_id = $1 OR pm.user_id = $1
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
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

    const updatedProject = await pool.query(
      'UPDATE projects SET name = $1, description = $2 WHERE id = $3 RETURNING *',
      [name, description, id]
    );

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
         COUNT(t.id) FILTER (WHERE t.status = 'To Do')::int       AS todo_count,
         COUNT(t.id) FILTER (WHERE t.status = 'In Progress')::int  AS in_progress_count,
         COUNT(t.id) FILTER (WHERE t.status = 'Done')::int         AS done_count
       FROM projects p
       JOIN users u ON u.id = p.owner_id
       LEFT JOIN tasks t ON t.assigned_user_id = u.id AND t.project_id = $1
       WHERE p.id = $1
       GROUP BY u.id, u.name, u.email, u.avatar

       UNION

       SELECT
         u.id, u.name, u.email, u.avatar,
         'member' AS role,
         COUNT(t.id) FILTER (WHERE t.status = 'To Do')::int       AS todo_count,
         COUNT(t.id) FILTER (WHERE t.status = 'In Progress')::int  AS in_progress_count,
         COUNT(t.id) FILTER (WHERE t.status = 'Done')::int         AS done_count
       FROM project_members pm
       JOIN users u ON u.id = pm.user_id
       LEFT JOIN tasks t ON t.assigned_user_id = u.id AND t.project_id = $1
       WHERE pm.project_id = $1
       GROUP BY u.id, u.name, u.email, u.avatar

       ORDER BY role DESC, name ASC`,
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

    await pool.query(
      'INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [id, member.id]
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

    res.status(200).json({ message: 'Member removed.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while removing member.' });
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
};