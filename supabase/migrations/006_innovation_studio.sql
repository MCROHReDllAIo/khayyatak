-- Khayyak — Innovation Studio (ابتكار)

CREATE TABLE IF NOT EXISTS innovation_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'تصميم جديد',
  status TEXT NOT NULL DEFAULT 'active',
  current_version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS custom_designs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES innovation_sessions(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'تصميم مخصص',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS custom_design_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  design_id UUID NOT NULL REFERENCES custom_designs(id) ON DELETE CASCADE,
  version_number INT NOT NULL DEFAULT 1,
  spec JSONB NOT NULL DEFAULT '{}'::jsonb,
  design_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  change_summary_ar TEXT,
  change_summary_en TEXT,
  reference_images JSONB DEFAULT '[]'::jsonb,
  ai_visualization_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(design_id, version_number)
);

CREATE TABLE IF NOT EXISTS custom_design_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version_id UUID NOT NULL REFERENCES custom_design_versions(id) ON DELETE CASCADE,
  tailor_id UUID REFERENCES tailors(id) ON DELETE SET NULL,
  material_type TEXT NOT NULL DEFAULT 'fabric',
  material_name TEXT,
  color_hex TEXT,
  color_family TEXT,
  availability_status TEXT NOT NULL DEFAULT 'unknown',
  quantity_available DECIMAL,
  inventory_id UUID REFERENCES inventory(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS custom_design_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES tailors(id) ON DELETE CASCADE,
  design_id UUID NOT NULL REFERENCES custom_designs(id) ON DELETE CASCADE,
  design_version_id UUID NOT NULL REFERENCES custom_design_versions(id) ON DELETE CASCADE,
  measurement_id UUID REFERENCES measurements(id) ON DELETE SET NULL,
  specification JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'SUBMITTED',
  complexity_estimate TEXT,
  ai_tailor_summary TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS custom_design_request_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES custom_design_requests(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  message_ar TEXT NOT NULL,
  message_en TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS design_feasibility_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES custom_design_requests(id) ON DELETE CASCADE UNIQUE,
  tailor_id UUID NOT NULL REFERENCES tailors(id) ON DELETE CASCADE,
  decision TEXT NOT NULL,
  estimated_price DECIMAL,
  estimated_delivery_days INT,
  tailor_notes_ar TEXT,
  tailor_notes_en TEXT,
  suggested_changes JSONB DEFAULT '[]'::jsonb,
  reviewed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS design_feasibility_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES design_feasibility_reviews(id) ON DELETE CASCADE,
  request_id UUID NOT NULL REFERENCES custom_design_requests(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ai_explanation_ar TEXT,
  ai_explanation_en TEXT,
  customer_action TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS custom_design_revisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES custom_design_requests(id) ON DELETE CASCADE,
  from_version_id UUID REFERENCES custom_design_versions(id) ON DELETE SET NULL,
  to_version_id UUID REFERENCES custom_design_versions(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE inventory ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS color_hex TEXT;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS fabric_type TEXT;

CREATE INDEX IF NOT EXISTS idx_innovation_sessions_customer ON innovation_sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_custom_design_requests_store ON custom_design_requests(store_id, status);
CREATE INDEX IF NOT EXISTS idx_custom_design_requests_customer ON custom_design_requests(customer_id);
