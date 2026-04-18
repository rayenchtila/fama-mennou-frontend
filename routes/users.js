const router = require('express').Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM users');
  res.json(rows);
});

router.patch('/:email', async (req, res) => {
  const { email } = req.params;
  const patch = req.body;
  const keys = Object.keys(patch);
  const values = Object.values(patch);
  const set = keys.map((k, i) => `${k}=$${i + 1}`).join(', ');
  await pool.query(`UPDATE users SET ${set} WHERE email=$${keys.length + 1}`, [...values, email.toLowerCase()]);
  res.json({ success: true });
});

router.delete('/:email', async (req, res) => {
  await pool.query('DELETE FROM users WHERE email=$1', [req.params.email.toLowerCase()]);
  res.json({ success: true });
});

module.exports = router;
