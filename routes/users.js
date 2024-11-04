const express = require('express');
const pool = require('../db'); 

const router = express.Router();

router.post('/', async (req, res) => {
  const { name, email, firebase_uid } = req.body; 
  try {
    const newUser = await pool.query(
      'INSERT INTO users (name, email, firebase_uid) VALUES ($1, $2, $3) RETURNING *',
      [name, email, firebase_uid]
    );
    res.json(newUser.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/', async (req, res) => {
  try {
    const users = await pool.query('SELECT * FROM users');
    res.json(users.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
