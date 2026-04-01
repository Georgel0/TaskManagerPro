const pool = require('../database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const registerUser = async (req, res) => {
  const { name, email, password, avatar } = req.body;

  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await pool.query(
      'INSERT INTO users (name, email, password, avatar) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, hashedPassword, avatar]
    );

    const user = newUser.rows[0];
    const token = generateToken(user.id);

    res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar },
      token
    });
  } catch (err) {
    // 23505 is the PostgreSQL error code for "Unique Violation"
    if (err.code === '23505') {
      return res.status(400).json({ error: "This email is already registered." });
    }
    res.status(500).json({ error: "Server error during registration." });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const token = generateToken(user.id);
    res.status(200).json({
      user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar },
      token
    });
  } catch (err) {
    res.status(500).json({ error: "Server error during login." });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const userResult = await pool.query(
      'SELECT id, name, email, avatar, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    // Send the user data back to the frontend
    res.status(200).json(userResult.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error while fetching profile." });
  }
};

const changeUsername = async (req, res) => {
  const { newUsername } = req.body;
  const userId = req.user.id;

  try {
    // Check if the new username is already taken by another user
    const existingUser = await pool.query('SELECT id FROM users WHERE name = $1', [newUsername]);

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "That username is already taken. Please choose another one." });
    }

    // Update the DB since it's unique
    await pool.query('UPDATE users SET name = $1 WHERE id = $2', [newUsername, userId]);

    res.status(200).json({ message: "Username updated successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error while updating username." });
  }
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  try {
    // Get the current user's password
    const userResult = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    // Check if the provided current password matches
    const isMatch = await bcrypt.compare(currentPassword, userResult.rows[0].password);
    if (!isMatch) {
      return res.status(400).json({ error: "Incorrect current password." });
    }

    // Hash the new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the DB
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedNewPassword, userId]);

    res.status(200).json({ message: "Password updated successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error while updating password." });
  }
};

const deleteAccount = async (req, res) => {
  const userId = req.user.id;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: "Password is required to delete your account." });
  }

  try {
    const userResult = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const isMatch = await bcrypt.compare(password, userResult.rows[0].password);
    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect password. Account deletion cancelled." });
    }

    // Delete the account if the password matches
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    res.status(200).json({ message: "Account deleted successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error while deleting account." });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const userResult = await pool.query(
      'SELECT id, name FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const user = userResult.rows[0];

    const plainToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(plainToken, 10);
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [hashedToken, expires, user.id]
    );

    const resetLink = `${process.env.CLIENT_URL}/?token=${plainToken}&id=${user.id}`;

    await resend.emails.send({
      from: 'Task Manager <onboarding@resend.dev>',
      to: email,
      subject: 'Reset your password.',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Reset your password</h2>
          <p>Hi ${user.name},</p>
          <p>We received a request to reset your password. Click the button below to choose a new one.</p>
          <a href="${resetLink}"
            style="display: inline-block; padding: 12px 24px; background-color: #0984e3;
              color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
            Reset Password
          </a>
          <p style="color: #666; font-size: 0.85rem;">
            This link expires in 15 minutes. If you didn't request this, you can safely ignore this email.
          </p>
          <p style="color: #666; font-size: 0.85rem;">
            Or copy this link: ${resetLink}
          </p>
        </div>
      `,
    });

    res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while processing password reset.' });
  }
};

const resetPassword = async (req, res) => {
  const { token, userId, newPassword } = req.body;

  try {
    const userResult = await pool.query(
      'SELECT reset_token, reset_token_expires FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset link.' });
    }

    const user = userResult.rows[0];

    // Check if token is expired
    if (!user.reset_token || new Date() > new Date(user.reset_token_expires)) {
      return res.status(400).json({ error: 'Reset link has expired. Please request a new one.' });
    }

    // Verify the token matches
    const isMatch = await bcrypt.compare(token, user.reset_token);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid or expired reset link.' });
    }

    // Hash new password and clear the reset token
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [hashedPassword, userId]
    );

    res.status(200).json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while resetting password.' });
  }
};

module.exports = { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  changeUsername, 
  changePassword, 
  deleteAccount,
  forgotPassword,
  resetPassword 
};