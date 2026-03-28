-- Abu Dhabi Malayalees Community — Database Schema

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(50)  UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email         VARCHAR(100),
  role          VARCHAR(20)  NOT NULL DEFAULT 'admin',
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
  id           SERIAL PRIMARY KEY,
  title        VARCHAR(200) NOT NULL,
  description  TEXT,
  event_date   DATE         NOT NULL,
  event_time   VARCHAR(50),
  venue        VARCHAR(200),
  category     VARCHAR(50)  DEFAULT 'cultural',
  is_featured  BOOLEAN      DEFAULT FALSE,
  is_published BOOLEAN      DEFAULT TRUE,
  created_at   TIMESTAMPTZ  DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS news (
  id             SERIAL PRIMARY KEY,
  title          VARCHAR(200) NOT NULL,
  excerpt        TEXT,
  content        TEXT,
  category       VARCHAR(50)  DEFAULT 'community',
  is_featured    BOOLEAN      DEFAULT FALSE,
  is_published   BOOLEAN      DEFAULT TRUE,
  published_date DATE         DEFAULT CURRENT_DATE,
  created_at     TIMESTAMPTZ  DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  DEFAULT NOW()
);

CREATE SEQUENCE IF NOT EXISTS member_seq START 1;

CREATE TABLE IF NOT EXISTS members (
  id                VARCHAR(30) PRIMARY KEY DEFAULT ('MBR-' || to_char(NOW(),'YYYY') || '-' || LPAD(nextval('member_seq')::TEXT, 4, '0')),
  first_name        VARCHAR(100) NOT NULL,
  last_name         VARCHAR(100) NOT NULL,
  email             VARCHAR(150) UNIQUE,
  phone             VARCHAR(30),
  membership_type   VARCHAR(20)  DEFAULT 'individual',
  membership_status VARCHAR(20)  DEFAULT 'active',
  joined_date       DATE         DEFAULT CURRENT_DATE,
  created_at        TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leadership (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(150) NOT NULL,
  role          VARCHAR(100) NOT NULL,
  bio           TEXT,
  initials      VARCHAR(5),
  display_order INTEGER     DEFAULT 0,
  is_active     BOOLEAN     DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gallery (
  id            SERIAL PRIMARY KEY,
  title         VARCHAR(200) NOT NULL,
  caption       TEXT,
  image_url     VARCHAR(500),
  is_published  BOOLEAN     DEFAULT TRUE,
  display_order INTEGER     DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contact_submissions (
  id         SERIAL PRIMARY KEY,
  first_name VARCHAR(100),
  last_name  VARCHAR(100),
  email      VARCHAR(150),
  phone      VARCHAR(30),
  subject    VARCHAR(50),
  message    TEXT,
  is_read    BOOLEAN     DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed: default admin user (password set from env on first startup via app)
-- Seed: sample leadership
INSERT INTO leadership (name, role, initials, display_order) VALUES
  ('Suresh Kumar M.',  'President',          'SK', 1),
  ('Priya Rajan',      'Vice President',     'PR', 2),
  ('Arun Joseph',      'General Secretary',  'AJ', 3),
  ('Liji Mathew',      'Joint Secretary',    'LM', 4),
  ('Thomas George',    'Treasurer',          'TG', 5),
  ('Asha Nair',        'Cultural Secretary', 'AN', 6),
  ('Rajesh Varghese',  'Welfare Secretary',  'RV', 7),
  ('Sreeja Mohan',     'Women''s Wing Chair','SM', 8)
ON CONFLICT DO NOTHING;

-- Seed: sample events
INSERT INTO events (title, description, event_date, event_time, venue, category, is_featured) VALUES
  ('Vishu Celebrations 2026',
   'Join us for the joyful Malayalam New Year with traditional Kani, Sadya feast, cultural performances, and grand raffle draws.',
   '2026-04-14', '6:00 PM – 11:00 PM', 'Abu Dhabi Officers Club', 'cultural', TRUE),
  ('Annual Scholarship Awards',
   'Honouring outstanding students from our community with merit scholarships.',
   '2026-05-01', '4:00 PM', 'ADMC Community Hall', 'welfare', FALSE),
  ('Independence Day Celebration',
   'A grand celebration of India''s Independence Day featuring flag hoisting and cultural programs.',
   '2026-08-15', '7:00 AM', 'Indian Community Club, Abu Dhabi', 'national', FALSE),
  ('Kerala Piravi Day 2026',
   'Commemorating the formation of Kerala state with a grand cultural evening.',
   '2026-11-01', '5:00 PM', 'Abu Dhabi National Exhibition Centre', 'cultural', FALSE)
ON CONFLICT DO NOTHING;

-- Seed: sample news
INSERT INTO news (title, excerpt, category, is_featured, published_date) VALUES
  ('ADMC Receives UAE Community Excellence Award 2025',
   'We are proud to announce that Abu Dhabi Malayalees Community has been honoured with the UAE Community Excellence Award.',
   'award', TRUE, '2026-03-15'),
  ('New Executive Committee Elected for 2026–2028',
   'Members elected a dynamic new executive committee at the Annual General Body Meeting.',
   'community', FALSE, '2026-02-28'),
  ('Blood Donation Camp Organised in Collaboration with Ministry of Health',
   'Over 150 community members donated blood at our annual Blood Donation Camp.',
   'welfare', FALSE, '2026-01-20')
ON CONFLICT DO NOTHING;
