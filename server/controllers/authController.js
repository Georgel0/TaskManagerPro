const pool = require('../database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
      [name, email, hashedPassword]
    );

    const user = newUser.rows[0];
    const token = generateToken(user.id);

    res.status(201).json({ 
      user: { id: user.id, name: user.name, email: user.email }, 
      token 
    });
  } catch (err) {
    res.status(500).json({ error: "Email already exists or DB error." });
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
      user: { id: user.id, name: user.name, email: user.email }, 
      token 
    });
  } catch (err) {
    res.status(500).json({ error: "Server error during login." });
  }
};

module.exports = { registerUser, loginUser };