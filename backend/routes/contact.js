const router  = require('express').Router();
const { query } = require('../db');
const auth    = require('../middleware/auth');

// POST /api/contact — public
router.post('/', async (req, res) => {
  const { first_name, last_name, email, phone, subject, message } = req.body;
  if (!first_name || !email || !message)
    return res.status(400).json({ error: 'first_name, email, and message are required' });
  try {
    await query(
      `INSERT INTO contact_submissions (first_name, last_name, email, phone, subject, message)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [first_name, last_name, email, phone, subject, message]
    );
    res.status(201).json({ success: true, message: 'Your message has been received. We will get back to you soon.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/contact — admin only
router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT * FROM contact_submissions ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/contact/:id/read — admin
router.patch('/:id/read', auth, async (req, res) => {
  try {
    await query('UPDATE contact_submissions SET is_read = TRUE WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/contact/:id — admin
router.delete('/:id', auth, async (req, res) => {
  try {
    await query('DELETE FROM contact_submissions WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
