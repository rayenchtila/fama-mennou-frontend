const router = require('express').Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');

router.post('/register', async (req, res) => {
  const { email, password, name, plan, role, dob, region, gender, skills, bio, cin, cinFront, cinBack } = req.body;
  const hash = await bcrypt.hash(password, 10);
  try {
    await pool.query(
      `INSERT INTO users (email,password,name,plan,role,dob,region,gender,skills,bio,cin,cin_front,cin_back)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       ON CONFLICT (email) DO NOTHING`,
      [email.toLowerCase(), hash, name, plan, role, dob, region, gender, skills, bio, cin, cinFront, cinBack]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [email.toLowerCase()]);
  if (!rows[0]) return res.json({ error: 'noAccount' });
  const match = await bcrypt.compare(password, rows[0].password);
  if (!match) return res.json({ error: 'wrongPassword' });
  res.json({ success: true, user: rows[0] });
});

module.exports = router;
