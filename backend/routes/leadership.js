const router  = require('express').Router();
const { query } = require('../db');
const auth    = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT * FROM leadership WHERE is_active = TRUE ORDER BY display_order ASC'
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  const { name, role, bio, initials, display_order } = req.body;
  if (!name || !role) return res.status(400).json({ error: 'name and role required' });
  try {
    const { rows } = await query(
      `INSERT INTO leadership (name, role, bio, initials, display_order)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, role, bio, initials || name.split(' ').map(w => w[0]).join('').slice(0,3).toUpperCase(), display_order || 99]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  const { name, role, bio, initials, display_order, is_active } = req.body;
  try {
    const { rows } = await query(
      `UPDATE leadership SET name=$1, role=$2, bio=$3, initials=$4, display_order=$5, is_active=$6
       WHERE id=$7 RETURNING *`,
      [name, role, bio, initials, display_order, is_active !== false, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await query('DELETE FROM leadership WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
