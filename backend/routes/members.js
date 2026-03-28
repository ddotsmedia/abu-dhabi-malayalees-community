const router  = require('express').Router();
const { query } = require('../db');
const auth    = require('../middleware/auth');

// All member routes require auth
router.get('/', auth, async (req, res) => {
  try {
    const { search, status, type } = req.query;
    let sql    = 'SELECT * FROM members WHERE 1=1';
    const vals = [];
    if (search) {
      vals.push(`%${search}%`);
      sql += ` AND (first_name ILIKE $${vals.length} OR last_name ILIKE $${vals.length} OR email ILIKE $${vals.length})`;
    }
    if (status) { vals.push(status); sql += ` AND membership_status = $${vals.length}`; }
    if (type)   { vals.push(type);   sql += ` AND membership_type   = $${vals.length}`; }
    sql += ' ORDER BY created_at DESC';
    const { rows } = await query(sql, vals);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/stats', auth, async (req, res) => {
  try {
    const { rows: [stats] } = await query(`
      SELECT
        COUNT(*)                                     AS total,
        COUNT(*) FILTER (WHERE membership_status='active') AS active,
        COUNT(*) FILTER (WHERE membership_type='individual') AS individual,
        COUNT(*) FILTER (WHERE membership_type='family')     AS family,
        COUNT(*) FILTER (WHERE membership_type='life')       AS life
      FROM members
    `);
    res.json(stats);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  const { first_name, last_name, email, phone, membership_type, membership_status, joined_date } = req.body;
  if (!first_name || !last_name) return res.status(400).json({ error: 'first_name and last_name required' });
  try {
    const { rows } = await query(
      `INSERT INTO members (first_name, last_name, email, phone, membership_type, membership_status, joined_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [first_name, last_name, email, phone,
       membership_type || 'individual', membership_status || 'active',
       joined_date || new Date().toISOString().slice(0,10)]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  const { first_name, last_name, email, phone, membership_type, membership_status } = req.body;
  try {
    const { rows } = await query(
      `UPDATE members SET first_name=$1, last_name=$2, email=$3, phone=$4,
       membership_type=$5, membership_status=$6 WHERE id=$7 RETURNING *`,
      [first_name, last_name, email, phone, membership_type, membership_status, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await query('DELETE FROM members WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
