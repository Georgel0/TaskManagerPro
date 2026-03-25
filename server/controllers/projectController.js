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
    res.status(500).json({ error: "Server error while creating project." });
  }
};

const getProjects = async (req, res) => {
  const userId = req.user.id;

  try {
    // This query fetches projects the user created OR projects they are a member of
    const projects = await pool.query(
      `SELECT p.*, COUNT(t.id)::int AS task_count
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
    res.status(500).json({ error: "Server error while fetching projects." });
  }
};

const updateProject = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  const userId = req.user.id;

  try {
    // Verify the user actually owns this project
    const project = await pool.query('SELECT * FROM projects WHERE id = $1 AND owner_id = $2', [id, userId]);

    if (project.rows.length === 0) {
      return res.status(403).json({ error: "Not authorized to update this project or project not found." });
    }

    const updatedProject = await pool.query(
      'UPDATE projects SET name = $1, description = $2 WHERE id = $3 RETURNING *',
      [name, description, id]
    );

    res.status(200).json(updatedProject.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error while updating project." });
  }
};

const deleteProject = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // Only the owner is be allowed to delete the project
    const project = await pool.query('SELECT * FROM projects WHERE id = $1 AND owner_id = $2', [id, userId]);

    if (project.rows.length === 0) {
      return res.status(403).json({ error: "Not authorized to delete this project or project not found." });
    }

    // Deleting the project will also automatically delete its tasks and project_members
    await pool.query('DELETE FROM projects WHERE id = $1', [id]);

    res.status(200).json({ message: "Project deleted successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error while deleting project." });
  }
};

module.exports = { createProject, getProjects, updateProject, deleteProject };