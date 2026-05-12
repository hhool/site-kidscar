-- Neon DB schema for site-kidscar
-- Run once against your Neon project:
--   psql $DATABASE_URL -f db/schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS reviews (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT        NOT NULL UNIQUE,
  title_zh      TEXT        NOT NULL,
  title_en      TEXT        NOT NULL,
  summary_zh    TEXT        NOT NULL,
  summary_en    TEXT        NOT NULL,
  brand         TEXT,
  category      TEXT,
  age_range     TEXT,
  weight_range  TEXT,
  source_url    TEXT        NOT NULL,
  source_note   TEXT,
  needs_verification BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at   DATE,
  -- scores (0-10 integers)
  score_safety      SMALLINT CHECK (score_safety      BETWEEN 0 AND 10),
  score_handling    SMALLINT CHECK (score_handling    BETWEEN 0 AND 10),
  score_portability SMALLINT CHECK (score_portability BETWEEN 0 AND 10),
  score_value       SMALLINT CHECK (score_value       BETWEEN 0 AND 10),

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reviews_updated_at ON reviews;
CREATE TRIGGER reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Seed from existing static data (idempotent upsert)
INSERT INTO reviews (
  slug, title_zh, title_en, summary_zh, summary_en,
  brand, category, age_range, weight_range,
  source_url, needs_verification, verified_at,
  score_safety, score_handling, score_portability, score_value
) VALUES
  ('trail-pro-x-2026',
   'Trail Pro X 全地形童车评测', 'Trail Pro X All-Terrain Stroller Review',
   'Trail Pro X 在碎石和草地路段表现稳定，避震能力突出，但车身更重。',
   'Trail Pro X stays stable on gravel and grass with strong suspension, but it is heavier to carry.',
   'TrailGear', 'all-terrain', '0 - 4 years', '0-25kg',
   'https://example.com/trail-pro-x-spec', FALSE, '2026-05-12',
   9, 8, 6, 7),
  ('sample-compact-stroller-2026',
   'Sample 轻便折叠童车 2026 评测', 'Sample Compact Stroller 2026 Review',
   '该车型在轻便与收纳方面表现良好，适合城市通勤和短途出行。',
   'This model performs well in portability and folding convenience, suitable for city commuting and short trips.',
   'BabyComfort', 'lightweight', '6 months - 4 years', '0-22kg',
   'https://example.com/sample-compact-stroller-spec', TRUE, '2026-05-12',
   7, 7, 9, 8),
  ('urban-lite-360-2026',
   'Urban Lite 360 城市轻便童车评测', 'Urban Lite 360 City Stroller Review',
   'Urban Lite 360 在城市路面推行顺滑，折叠后体积小，适合高频通勤家庭。',
   'Urban Lite 360 is smooth on city roads and folds into a compact size, ideal for frequent commuting families.',
   'UrbanKids', 'lightweight', '6 months - 4 years', '0-22kg',
   'https://example.com/urban-lite-360-spec', TRUE, '2026-05-12',
   8, 8, 9, 8),
  ('city-cruiser-pro-2026',
   'City Cruiser Pro 城市旗舰童车评测', 'City Cruiser Pro Urban Flagship Stroller Review',
   'City Cruiser Pro 采用铝合金车架与三挡避震，城市路面操控一流，自立折叠不占空间。',
   'City Cruiser Pro features an aluminium frame with three-stage suspension for top-tier city handling and self-standing fold.',
   'CityStar', 'urban', '0 - 4 years', '0-22kg',
   'https://example.com/city-cruiser-pro-spec', FALSE, '2026-05-12',
   9, 9, 7, 7),
  ('nano-fold-ultra-2026',
   'Nano Fold Ultra 超轻登机童车评测', 'Nano Fold Ultra Cabin-Carry Stroller Review',
   '仅 5.8 kg，一秒折叠，符合主流航空随身标准，远途旅行家庭首选。',
   'Weighing only 5.8 kg with a one-second fold that meets major airline carry-on specs, a top pick for travelling families.',
   'NanoGo', 'travel', '6 months - 3 years', '0-18kg',
   'https://example.com/nano-fold-ultra-spec', FALSE, '2026-05-12',
   7, 7, 10, 8),
  ('twin-cruiser-duo-2026',
   'Twin Cruiser Duo 双胞胎并排童车评测', 'Twin Cruiser Duo Side-by-Side Twin Stroller Review',
   '并排双座设计，独立靠背角度调节，门宽适配性好，双宝出行神器。',
   'Side-by-side twin seats with independent recline angles and wide doorway clearance — the go-to for families with two young children.',
   'DuoRide', 'twin', '0 - 4 years', '0-2×20kg',
   'https://example.com/twin-cruiser-duo-spec', TRUE, '2026-05-12',
   9, 7, 5, 7),
  ('eco-rider-bamboo-2026',
   'Eco Rider Bamboo 环保竹纤维童车评测', 'Eco Rider Bamboo Sustainable Stroller Review',
   '车架采用再生铝合金，座布由有机竹纤维制成，通过 OEKO-TEX 认证，绿色家庭首选。',
   'Recycled aluminium frame with organic bamboo-fibre seat fabric certified by OEKO-TEX — the sustainable choice for eco-conscious families.',
   'EcoRider', 'eco', '3 months - 4 years', '0-22kg',
   'https://example.com/eco-rider-bamboo-spec', FALSE, '2026-05-12',
   8, 7, 7, 9)
ON CONFLICT (slug) DO NOTHING;
