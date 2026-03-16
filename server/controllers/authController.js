const pool = require('../database');
const bcrypt = require('bcrypt');

const registerUser = async (req, res) => {
  const { name, email, password }=  req.body;

  try {
    // This will scramble the password for secuirty 
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // This inserts in to the database, in the users table
    const newUser = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
      [name, email, hashedPassword]
    );

    res.status(101).json({ message: "User created!", user: newUser.rows[0] });
  } catch (err) {
    res.status(500).jsom({ error: "Email might already exist or DB error." });
  }
};

module.exports = { registerUser };