const pool = require('../database');
const cloudinary = require('../config/cloudinary');

const getResourceType = (mimeType) => {
  if (!mimeType) return 'raw';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'raw';
};

const checkAccess = async (projectId, userId) => {
  const result = await pool.query(
    `SELECT p.owner_id FROM projects p
     LEFT JOIN project_members pm ON p.id = pm.project_id
     WHERE p.id = $1 AND (p.owner_id = $2 OR pm.user_id = $2)`,
    [projectId, userId]
  );
  return result.rows[0] ?? null;
};

const getReadme = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const access = await checkAccess(id, userId);
    if (!access) return res.status(403).json({ error: 'Not authorized.' });

    const readme = await pool.query(
      `SELECT r.*, u.name AS updated_by_name
       FROM project_readme r
       LEFT JOIN users u ON u.id = r.updated_by
       WHERE r.project_id = $1`,
      [id]
    );

    const files = await pool.query(
      `SELECT f.*, u.name AS uploader_name
       FROM project_readme_files f
       LEFT JOIN users u ON u.id = f.user_id
       WHERE f.project_id = $1
       ORDER BY f.uploaded_at DESC`,
      [id]
    );

    res.status(200).json({
      content: readme.rows[0]?.content ?? '',
      updated_at: readme.rows[0]?.updated_at ?? null,
      updated_by_name: readme.rows[0]?.updated_by_name ?? null,
      files: files.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching readme.' });
  }
};

const saveReadme = async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  try {
    const project = await pool.query(
      'SELECT owner_id FROM projects WHERE id = $1', [id]
    );
    if (!project.rows[0] || project.rows[0].owner_id !== userId) {
      return res.status(403).json({ error: 'Only the owner can edit the README.' });
    }

    await pool.query(
      `INSERT INTO project_readme (project_id, content, updated_at, updated_by)
       VALUES ($1, $2, NOW(), $3)
       ON CONFLICT (project_id)
       DO UPDATE SET content = EXCLUDED.content, updated_at = NOW(), updated_by = EXCLUDED.updated_by`,
      [id, content, userId]
    );

    res.status(200).json({ message: 'README saved.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error saving readme.' });
  }
};

const uploadReadmeFile = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (!req.file) return res.status(400).json({ error: 'No file provided.' });

  try {
    const project = await pool.query(
      'SELECT owner_id FROM projects WHERE id = $1', [id]
    );
    if (!project.rows[0] || project.rows[0].owner_id !== userId) {
      return res.status(403).json({ error: 'Only the owner can upload files.' });
    }

    const safeOriginalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `taskmanager/projects/${id}/readme`, resource_type: 'auto', use_filename: true, unique_filename: true },
        (error, result) => error ? reject(error) : resolve(result)
      );
      stream.end(req.file.buffer);
    });

    const inserted = await pool.query(
      `INSERT INTO project_readme_files (project_id, user_id, file_path, public_id, original_name, file_type, file_size)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [id, userId, uploadResult.secure_url, uploadResult.public_id, safeOriginalName, req.file.mimetype, req.file.size]
    );

    res.status(201).json({ ...inserted.rows[0], uploader_name: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error uploading file.' });
  }
};

const deleteReadmeFile = async (req, res) => {
  const { id, fileId } = req.params;
  const userId = req.user.id;

  try {
    const project = await pool.query('SELECT owner_id FROM projects WHERE id = $1', [id]);
    if (!project.rows[0] || project.rows[0].owner_id !== userId) {
      return res.status(403).json({ error: 'Only the owner can delete files.' });
    }

    const file = await pool.query('SELECT * FROM project_readme_files WHERE id = $1 AND project_id = $2', [fileId, id]);
    if (!file.rows[0]) return res.status(404).json({ error: 'File not found.' });

    const resourceType = getResourceType(file.rows[0].file_type);
    await cloudinary.uploader.destroy(file.rows[0].public_id, { resource_type: resourceType });
    await pool.query('DELETE FROM project_readme_files WHERE id = $1', [fileId]);

    res.status(200).json({ message: 'File deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error deleting file.' });
  }
};

module.exports = { getReadme, saveReadme, uploadReadmeFile, deleteReadmeFile };