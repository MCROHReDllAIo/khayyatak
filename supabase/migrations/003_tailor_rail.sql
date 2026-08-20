-- Tailor rail: availability, portfolio, services

DO $$ BEGIN
  CREATE TYPE tailor_availability_status AS ENUM (
    'available_now',
    'accepting_orders',
    'busy',
    'paused'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE tailors
  ADD COLUMN IF NOT EXISTS availability_status tailor_availability_status DEFAULT 'accepting_orders';

CREATE TABLE IF NOT EXISTS tailor_portfolio (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tailor_id UUID NOT NULL REFERENCES tailors(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  caption_ar TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tailor_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tailor_id UUID NOT NULL REFERENCES tailors(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  category TEXT,
  starting_price DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tailor_portfolio_tailor ON tailor_portfolio(tailor_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_tailor_services_tailor ON tailor_services(tailor_id);

ALTER TABLE tailor_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE tailor_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read tailor portfolio" ON tailor_portfolio FOR SELECT USING (true);
CREATE POLICY "Tailor manage own portfolio" ON tailor_portfolio FOR ALL USING (
  public.is_tailor_owner(tailor_id) OR public.is_admin()
);

CREATE POLICY "Public read tailor services" ON tailor_services FOR SELECT USING (true);
CREATE POLICY "Tailor manage own services" ON tailor_services FOR ALL USING (
  public.is_tailor_owner(tailor_id) OR public.is_admin()
);
