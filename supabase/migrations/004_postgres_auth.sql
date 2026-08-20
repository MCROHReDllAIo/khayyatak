-- Email/password accounts for Railway PostgreSQL auth (when Supabase Auth is not used)
CREATE TABLE IF NOT EXISTS auth_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_accounts_email ON auth_accounts (lower(email));

-- Seed Oman cities if empty
INSERT INTO cities (name_ar, name_en, tailor_count, lat, lng)
SELECT 'مسقط', 'Muscat', 0, 23.5880, 58.3829
WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name_ar = 'مسقط');

INSERT INTO cities (name_ar, name_en, tailor_count, lat, lng)
SELECT 'صلالة', 'Salalah', 0, 17.0151, 54.0924
WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name_ar = 'صلالة');

INSERT INTO cities (name_ar, name_en, tailor_count, lat, lng)
SELECT 'نزوى', 'Nizwa', 0, 22.9333, 57.5333
WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name_ar = 'نزوى');
