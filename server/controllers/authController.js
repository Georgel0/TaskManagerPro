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
    if (err.code === '23505') return res.status(400).json({ error: "This email is already registered." });
    res.status(500).json({ error: "Server error during registration." });
    console.error(err);
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
    console.error(err);
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const userResult = await pool.query('SELECT id, name FROM users WHERE email = $1', [email]);

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
      `
    });

    res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error while processing password reset.' });
    console.error(err);
  }
};

const resetPassword = async (req, res) => {
  const { token, userId, newPassword } = req.body;

  try {
    const userResult = await pool.query('SELECT reset_token, reset_token_expires FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset link.' });
    }

    const user = userResult.rows[0];
    if (!user.reset_token || new Date() > new Date(user.reset_token_expires)) {
      return res.status(400).json({ error: 'Reset link has expired.' });
    }

    const isMatch = await bcrypt.compare(token, user.reset_token);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid or expired reset link.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [hashedPassword, userId]
    );

    res.status(200).json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error while resetting password.' });
    console.error(err);
  }
};

module.exports = { registerUser, loginUser, forgotPassword, resetPassword };