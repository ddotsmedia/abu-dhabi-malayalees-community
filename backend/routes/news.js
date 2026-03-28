const router  = require('express').Router();
const { query } = require('../db');
const auth    = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const admin = req.headers['authorization'];
    const where = admin ? '' : 'WHERE is_published = TRUE';
    const { rows } = await query(`SELECT * FROM news ${where} ORDER BY published_date DESC`);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM news WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  const { title, excerpt, content, category, is_featured, is_published, published_date } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  try {
    const { rows } = await query(
      `INSERT INTO news (title, excerpt, content, category, is_featured, is_published, published_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [title, excerpt, content, category || 'community', is_featured || false,
       is_published !== false, published_date || new Date().toISOString().slice(0,10)]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  const { title, excerpt, content, category, is_featured, is_published, published_date } = req.body;
  try {
    const { rows } = await query(
      `UPDATE news SET title=$1, excerpt=$2, content=$3, category=$4,
       is_featured=$5, is_published=$6, published_date=$7, updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [title, excerpt, content, category, is_featured, is_published, published_date, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await query('DELETE FROM news WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
