const pool = require('../database');
const bcrypt = require('bcrypt');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const getUserProfile = async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT id, name, email, avatar, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(200).json(userResult.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Server error while fetching profile." });
    console.error(err);
  }
};

const changeUsername = async (req, res) => {
  const { newUsername } = req.body;

  try {
    const existingUser = await pool.query('SELECT id FROM users WHERE name = $1', [newUsername]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "That username is already taken." });
    }

    await pool.query('UPDATE users SET name = $1 WHERE id = $2', [newUsername, req.user.id]);

    res.status(200).json({ message: "Username updated successfully." });
  } catch (err) {
    res.status(500).json({ error: "Server error while updating username." });
    console.error(err);
  }
};

const changeEmail = async (req, res) => {
  const { newEmail } = req.body;
  try {
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [newEmail]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "That email is already registered." });
    }

    await pool.query('UPDATE users SET email = $1 WHERE id = $2', [newEmail, req.user.id]);
    await resend.emails.send({
      from: 'Task Manager <onboarding@resend.dev>',
      to: newEmail,
      subject: 'Email Address Updated',
      html: `<p>Your account email has been successfully changed to <strong>${newEmail}</strong>.</p>`
    });

    res.status(200).json({ message: "Email updated successfully." });
  } catch (err) {
    res.status(500).json({ error: "Server error while updating email." });
    console.error(err);
  }
};

const changeAvatar = async (req, res) => {
  const { newAvatarUrl } = req.body;
  try {
    const response = await fetch(newAvatarUrl, { method: 'HEAD' });
    if (!response.ok) {
      return res.status(400).json({ error: "Unable to access the provided image URL." });
    }

    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');

    if (!contentType || !contentType.startsWith('image/')) {
      return res.status(400).json({ error: "The URL must point directly to an image file." });
    }

    if (contentLength && parseInt(contentLength, 10) > 5 * 1024 * 1024) {
      return res.status(400).json({ error: "The image size exceeds the 5MB limit." });
    }

    await pool.query('UPDATE users SET avatar = $1 WHERE id = $2', [newAvatarUrl, req.user.id]);
    res.status(200).json({ message: "Avatar updated successfully." });
  } catch (err) {
    res.status(400).json({ error: "Could not validate the image URL. Ensure it is public." });
    console.error(err);
  }
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const userResult = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const isMatch = await bcrypt.compare(currentPassword, userResult.rows[0].password);
    if (!isMatch) {
    return res.status(400).json({ error: "Incorrect current password." });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedNewPassword, req.user.id]);
    
    res.status(200).json({ message: "Password updated successfully." });
  } catch (err) {
    res.status(500).json({ error: "Server error while updating password." });
    console.error(err);
  }
};

const deleteAccount = async (req, res) => {
  const { password } = req.body;

  try {
    const userResult = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const isMatch = await bcrypt.compare(password, userResult.rows[0].password);
    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect password. Deletion cancelled." });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [req.user.id]);
    res.status(200).json({ message: "Account deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: "Server error while deleting account." });
  console.error(err);
  }
};

const searchUsers = async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length < 2) return res.status(200).json([]);

  try {
    const result = await pool.query(
      `SELECT id, name, email, avatar FROM users WHERE (name ILIKE $1 OR email ILIKE $1) AND id != $2 LIMIT 8`,
      [`%${q.trim()}%`, req.user.id]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error while searching users.' });
    console.error(err);
  }
};

module.exports = {
  getUserProfile,
  changeUsername,
  changeEmail,
  changeAvatar,
  changePassword,
  deleteAccount,
  searchUsers
};