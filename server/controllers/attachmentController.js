const pool = require('../database');
const cloudinary = require('../config/cloudinary');
const { createNotification, isNotificationAllowed } = require('./notificationController');

const getResourceType = (mimeType) => {
  if (!mimeType) return 'raw';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'raw';
};

const getAttachments = async (req, res) => {
  const { taskId } = req.params;
  const userId = req.user.id;

  try {
    // Verify user has access to this task's project
    const access = await pool.query(
      `SELECT 1 FROM tasks t
       JOIN projects p ON p.id = t.project_id
       LEFT JOIN project_members pm ON pm.project_id = p.id
       WHERE t.id = $1 AND (p.owner_id = $2 OR pm.user_id = $2)`,
      [taskId, userId]
    );

    if (access.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    const result = await pool.query(
      `SELECT a.*, u.name AS uploader_name
       FROM attachments a
       LEFT JOIN users u ON u.id = a.user_id
       WHERE a.task_id = $1
       ORDER BY a.uploaded_at DESC`,
      [taskId]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while fetching attachments.' });
  }
};

const uploadAttachment = async (req, res) => {
  const { taskId } = req.params;
  const userId = req.user.id;

  if (!req.file) {
    return res.status(400).json({ error: 'No file provided.' });
  }

  const safeOriginalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');

  try {
    // Verify user has access
    const taskResult = await pool.query(
      `SELECT t.*, p.owner_id, p.name AS project_name
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       LEFT JOIN project_members pm ON pm.project_id = p.id
       WHERE t.id = $1 AND (p.owner_id = $2 OR pm.user_id = $2)`,
      [taskId, userId]
    );

    if (taskResult.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    const task = taskResult.rows[0];

    // Upload to Cloudinary from buffer
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `taskmanager/tasks/${taskId}`,
          resource_type: 'auto',
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary error:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      stream.end(req.file.buffer);
    });

    // Save to DB
    const attachment = await pool.query(
      `INSERT INTO attachments (task_id, user_id, file_path, public_id, original_name, file_type, file_size)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        taskId,
        userId,
        uploadResult.secure_url,
        uploadResult.public_id,
        safeOriginalName,
        req.file.mimetype,
        req.file.size,
      ]
    );

    // Notify task assignee if someone else uploaded
    if (task.assigned_user_id && task.assigned_user_id !== userId) {
      const allowed = await isNotificationAllowed(task.assigned_user_id, 'task_updated');
      if (allowed) {
        await createNotification(
          task.assigned_user_id,
          `A file was attached to your task: "${task.title}"`
        );
      }
    }

    res.status(201).json({
      ...attachment.rows[0],
      uploader_name: null, // will be fetched with getAttachments
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while uploading attachment.' });
  }
};

const deleteAttachment = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const attachmentResult = await pool.query(
      `SELECT a.*, p.owner_id FROM attachments a
       JOIN tasks t ON t.id = a.task_id
       JOIN projects p ON p.id = t.project_id
       WHERE a.id = $1`,
      [id]
    );

    if (attachmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Attachment not found.' });
    }

    const attachment = attachmentResult.rows[0];

    // Owner can delete any attachment, members can only delete their own
    if (attachment.owner_id !== userId && attachment.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this attachment.' });
    }

    const resourceType = getResourceType(attachment.file_type);

    await cloudinary.uploader.destroy(attachment.public_id, {
      resource_type: resourceType,
    });

    await pool.query('DELETE FROM attachments WHERE id = $1', [id]);

    res.status(200).json({ message: 'Attachment deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while deleting attachment.' });
  }
};

module.exports = { getAttachments, uploadAttachment, deleteAttachment };