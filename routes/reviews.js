const router = require('express').Router();
const pool = require('../db');

router.get('/:email', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM reviews WHERE freelancer_email=$1 ORDER BY created_at DESC',
    [req.params.email]
  );
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { freelancerEmail, clientEmail, clientName, rating, comment } = req.body;
  await pool.query(
    'INSERT INTO reviews (freelancer_email,client_email,client_name,rating,comment) VALUES ($1,$2,$3,$4,$5)',
    [freelancerEmail, clientEmail, clientName, rating, comment]
  );
  res.json({ success: true });
});

module.exports = router;
