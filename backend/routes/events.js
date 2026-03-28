const router  = require('express').Router();
const { query } = require('../db');
const auth    = require('../middleware/auth');

// GET /api/events — public
router.get('/', async (req, res) => {
  try {
    const admin = req.headers['authorization'];
    const where = admin ? '' : "WHERE is_published = TRUE";
    const { rows } = await query(
      `SELECT * FROM events ${where} ORDER BY event_date ASC`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/events/:id — public
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM events WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/events — admin
router.post('/', auth, async (req, res) => {
  const { title, description, event_date, event_time, venue, category, is_featured, is_published } = req.body;
  if (!title || !event_date) return res.status(400).json({ error: 'title and event_date required' });
  try {
    const { rows } = await query(
      `INSERT INTO events (title, description, event_date, event_time, venue, category, is_featured, is_published)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [title, description, event_date, event_time, venue, category || 'cultural',
       is_featured || false, is_published !== false]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/events/:id — admin
router.put('/:id', auth, async (req, res) => {
  const { title, description, event_date, event_time, venue, category, is_featured, is_published } = req.body;
  try {
    const { rows } = await query(
      `UPDATE events SET title=$1, description=$2, event_date=$3, event_time=$4, venue=$5,
       category=$6, is_featured=$7, is_published=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [title, description, event_date, event_time, venue, category, is_featured, is_published, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/events/:id — admin
router.delete('/:id', auth, async (req, res) => {
  try {
    await query('DELETE FROM events WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
