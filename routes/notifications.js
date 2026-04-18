const router = require('express').Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM notifications ORDER BY created_at DESC');
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { type, kind, title, message, email, name } = req.body;
  await pool.query(
    'INSERT INTO notifications (type,kind,title,message,email,name) VALUES ($1,$2,$3,$4,$5,$6)',
    [type, kind, title, message, email, name]
  );
  res.json({ success: true });
});

router.patch('/:id/read', async (req, res) => {
  await pool.query('UPDATE notifications SET read=true WHERE id=$1', [req.params.id]);
  res.json({ success: true });
});

router.delete('/', async (req, res) => {
  const { type, email } = req.query;
  if (type === 'admin') await pool.query("DELETE FROM notifications WHERE type='admin'");
  else await pool.query("DELETE FROM notifications WHERE type='user' AND email=$1", [email]);
  res.json({ success: true });
});

module.exports = router;
