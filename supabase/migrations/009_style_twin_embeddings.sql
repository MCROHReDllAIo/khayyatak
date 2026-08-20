-- Style Twin ML — product embedding catalog (cosine in app; no pgvector required)

CREATE TABLE IF NOT EXISTS product_embeddings (
  product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  dna_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  embedding JSONB NOT NULL DEFAULT '[]'::jsonb,
  model TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'catalog',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_embeddings_updated ON product_embeddings(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_embeddings_model ON product_embeddings(model);
