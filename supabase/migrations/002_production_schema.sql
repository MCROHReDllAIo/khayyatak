-- Smart Tailor AI — Production schema extension
-- Run after 001_initial_schema.sql

-- Extended order statuses
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'confirmed';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'cancelled';

CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected', 'info_requested');
CREATE TYPE ai_call_status AS ENUM ('success', 'error', 'fallback');

-- Profile trigger on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Extend tailors
ALTER TABLE tailors ADD COLUMN IF NOT EXISTS verification_status verification_status DEFAULT 'pending';
ALTER TABLE tailors ADD COLUMN IF NOT EXISTS owner_name TEXT;
ALTER TABLE tailors ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE tailors ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE tailors ADD COLUMN IF NOT EXISTS working_hours JSONB;
ALTER TABLE tailors ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb;

-- Favorites
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tailor_id UUID NOT NULL REFERENCES tailors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tailor_id)
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tailor_id UUID NOT NULL REFERENCES tailors(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  description_ar TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  price DECIMAL,
  fabric TEXT,
  style TEXT,
  occasion TEXT,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Style DNA events
CREATE TABLE IF NOT EXISTS style_dna_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS style_dna (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  computed JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Measurement sessions
CREATE TABLE IF NOT EXISTS measurement_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'manual',
  is_ai_estimate BOOLEAN DEFAULT FALSE,
  raw_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE measurements ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES measurement_sessions(id);

-- Order extensions
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status payment_status DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS specification JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_date DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name TEXT;

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  description TEXT,
  quantity INT DEFAULT 1,
  unit_price DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory movements
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  tailor_id UUID NOT NULL REFERENCES tailors(id) ON DELETE CASCADE,
  delta DECIMAL NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE inventory ADD COLUMN IF NOT EXISTS cost_per_unit DECIMAL;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS threshold DECIMAL DEFAULT 15;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS supplier TEXT;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS location TEXT;

-- AI conversations
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_call_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  feature TEXT NOT NULL,
  provider TEXT,
  model TEXT,
  status ai_call_status NOT NULL,
  latency_ms INT,
  tokens INT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketing & quality
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tailor_id UUID NOT NULL REFERENCES tailors(id) ON DELETE CASCADE,
  title_ar TEXT NOT NULL,
  body_ar TEXT,
  channel TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quality_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  tailor_id UUID NOT NULL REFERENCES tailors(id),
  score DECIMAL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tailor_id UUID REFERENCES tailors(id),
  task_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  input JSONB,
  output JSONB,
  requires_confirmation BOOLEAN DEFAULT TRUE,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tailor_verification_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tailor_id UUID NOT NULL REFERENCES tailors(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES profiles(id),
  action verification_status NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  segment TEXT,
  reorder_probability DECIMAL,
  lifetime_value DECIMAL,
  computed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_tailor ON orders(tailor_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_tailors_city ON tailors(city_id);
CREATE INDEX IF NOT EXISTS idx_tailors_verified ON tailors(verified);
CREATE INDEX IF NOT EXISTS idx_reviews_tailor ON reviews(tailor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_feature ON ai_call_logs(feature, created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_tailor ON inventory(tailor_id);

-- Helper: is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_tailor_owner(tid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM tailors t
    JOIN profiles p ON p.id = t.profile_id
    WHERE t.id = tid AND p.id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- RLS extensions
ALTER TABLE tailors ENABLE ROW LEVEL SECURITY;
ALTER TABLE designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read cities" ON cities FOR SELECT USING (true);
CREATE POLICY "Public read verified tailors" ON tailors FOR SELECT USING (verified = true OR public.is_admin() OR profile_id = auth.uid());
CREATE POLICY "Tailor update own business" ON tailors FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "Tailor insert own business" ON tailors FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Admin all tailors" ON tailors FOR ALL USING (public.is_admin());

CREATE POLICY "Users own designs select" ON designs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users own designs insert" ON designs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users own designs update" ON designs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users own designs delete" ON designs FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Customers insert orders" ON orders FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers update own pending orders" ON orders FOR UPDATE USING (auth.uid() = customer_id);
CREATE POLICY "Tailors view their orders" ON orders FOR SELECT USING (
  auth.uid() = customer_id OR public.is_tailor_owner(tailor_id) OR public.is_admin()
);
CREATE POLICY "Tailors update their orders" ON orders FOR UPDATE USING (public.is_tailor_owner(tailor_id) OR public.is_admin());

CREATE POLICY "Users own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own favorites" ON favorites FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public read reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Customers insert reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Tailor inventory all" ON inventory FOR ALL USING (public.is_tailor_owner(tailor_id) OR public.is_admin());
CREATE POLICY "Tailor products all" ON products FOR ALL USING (public.is_tailor_owner(tailor_id) OR public.is_admin());
CREATE POLICY "Public read published products" ON products FOR SELECT USING (published = true OR public.is_tailor_owner(tailor_id) OR public.is_admin());

CREATE POLICY "Users own ai conversations" ON ai_conversations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own ai messages" ON ai_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM ai_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid())
);

CREATE POLICY "Admin read profiles" ON profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Admin read all orders" ON orders FOR SELECT USING (public.is_admin());

-- Realtime city tailor counts (maintained by trigger)
CREATE OR REPLACE FUNCTION refresh_city_tailor_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE cities SET tailor_count = (
    SELECT COUNT(*) FROM tailors WHERE city_id = COALESCE(NEW.city_id, OLD.city_id) AND verified = true
  ), updated_at = NOW()
  WHERE id = COALESCE(NEW.city_id, OLD.city_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tailor_city_count ON tailors;
CREATE TRIGGER trg_tailor_city_count
  AFTER INSERT OR UPDATE OR DELETE ON tailors
  FOR EACH ROW EXECUTE FUNCTION refresh_city_tailor_count();
