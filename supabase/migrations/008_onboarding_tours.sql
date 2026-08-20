-- Onboarding tour progress (authenticated users)

CREATE TABLE IF NOT EXISTS user_onboarding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tour_id TEXT NOT NULL DEFAULT 'main',
  tour_version TEXT NOT NULL DEFAULT '2026.1',
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  skipped BOOLEAN NOT NULL DEFAULT FALSE,
  current_step INT NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  skipped_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, tour_id, tour_version)
);

CREATE INDEX IF NOT EXISTS idx_user_onboarding_user ON user_onboarding(user_id);

CREATE TABLE IF NOT EXISTS onboarding_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  tour_id TEXT NOT NULL,
  tour_version TEXT NOT NULL,
  event_type TEXT NOT NULL,
  step_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_events_tour ON onboarding_events(tour_id, created_at DESC);
