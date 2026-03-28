require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const bcrypt   = require('bcryptjs');
const { query, pool } = require('./db');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/events',     require('./routes/events'));
app.use('/api/news',       require('./routes/news'));
app.use('/api/members',    require('./routes/members'));
app.use('/api/leadership', require('./routes/leadership'));
app.use('/api/contact',    require('./routes/contact'));

// Dashboard stats — admin
app.get('/api/stats', require('./middleware/auth'), async (req, res) => {
  try {
    const [events, news, members, contacts] = await Promise.all([
      query('SELECT COUNT(*) AS count FROM events'),
      query('SELECT COUNT(*) AS count FROM news'),
      query('SELECT COUNT(*) AS count FROM members WHERE membership_status = \'active\''),
      query('SELECT COUNT(*) AS count FROM contact_submissions WHERE is_read = FALSE'),
    ]);
    res.json({
      events:           parseInt(events.rows[0].count),
      news:             parseInt(news.rows[0].count),
      active_members:   parseInt(members.rows[0].count),
      unread_contacts:  parseInt(contacts.rows[0].count),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date() }));

// 404
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

/* ---- Startup ---- */
async function start() {
  const PORT = process.env.PORT || 3000;
  let retries = 10;

  while (retries > 0) {
    try {
      await pool.query('SELECT 1');
      console.log('✅ Database connected');
      break;
    } catch {
      retries--;
      console.log(`⏳ Waiting for database… (${retries} retries left)`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  if (retries === 0) {
    console.error('❌ Could not connect to database. Exiting.');
    process.exit(1);
  }

  // Create default admin user if not exists
  try {
    const user  = process.env.ADMIN_USER || 'admin';
    const pass  = process.env.ADMIN_PASS || 'Admin@1234';
    const hash  = await bcrypt.hash(pass, 12);
    await query(
      `INSERT INTO users (username, password_hash, role)
       VALUES ($1, $2, 'admin')
       ON CONFLICT (username) DO NOTHING`,
      [user, hash]
    );
    console.log(`✅ Admin user ready: ${user}`);
  } catch (err) {
    console.error('Admin user setup error:', err.message);
  }

  app.listen(PORT, () => console.log(`🚀 API running on port ${PORT}`));
}

start();
