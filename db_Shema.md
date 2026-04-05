-- ── 1. WORKSPACES ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspaces (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id                UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name                    TEXT NOT NULL DEFAULT '',
  plan_tier               TEXT NOT NULL DEFAULT 'core'
                          CHECK (plan_tier IN ('core','pro','enterprise')),
  bandwidth_limit_bytes   BIGINT NOT NULL DEFAULT 1099511627776,
  bandwidth_used_bytes    BIGINT NOT NULL DEFAULT 0,
  bandwidth_addon_tb      INT NOT NULL DEFAULT 0,
  bandwidth_reset_date    TIMESTAMPTZ,
  bandwidth_warning_sent  BOOLEAN NOT NULL DEFAULT false,
  bandwidth_degraded      BOOLEAN NOT NULL DEFAULT false,
  bandwidth_gated         BOOLEAN NOT NULL DEFAULT false,
  cf_contact_id           TEXT,
  meta_pixel_id           TEXT,
  tiktok_pixel_id         TEXT,
  google_ads_id           TEXT,
  linkedin_partner_id     TEXT,
  meta_capi_dataset_id    TEXT,
  meta_capi_token         TEXT,
  cv_watch25              NUMERIC DEFAULT 1,
  cv_watch50              NUMERIC DEFAULT 5,
  cv_watch75              NUMERIC DEFAULT 15,
  cv_watch95              NUMERIC DEFAULT 25,
  cv_lead                 NUMERIC DEFAULT 20,
  cv_lead_high            NUMERIC DEFAULT 50,
  sms_enabled             BOOLEAN NOT NULL DEFAULT false,
  sms_phone               TEXT,
  sms_used_count          INT NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. PROFILES ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name      TEXT NOT NULL DEFAULT '',
  last_name       TEXT NOT NULL DEFAULT '',
  company         TEXT NOT NULL DEFAULT '',
  phone           TEXT NOT NULL DEFAULT '',
  timezone        TEXT NOT NULL DEFAULT 'UTC',
  avatar_url      TEXT,
  two_fa          BOOLEAN NOT NULL DEFAULT false,
  email_verified  BOOLEAN NOT NULL DEFAULT false,
  password_hash   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 3. FOLDERS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS folders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  color         TEXT NOT NULL DEFAULT '#4F6EF7',
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 4. VIDEOS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS videos (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id       UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  folder_id          UUID REFERENCES folders(id) ON DELETE SET NULL,
  stream_uid         TEXT,
  title              TEXT NOT NULL DEFAULT 'Untitled Video',
  status             TEXT NOT NULL DEFAULT 'uploading'
                     CHECK (status IN ('uploading','processing','ready','error')),
  duration_seconds   INT,
  resolution         TEXT,
  aspect_ratio       TEXT DEFAULT '16:9',
  file_size_bytes    BIGINT,
  format             TEXT,
  fps                TEXT,
  audio              TEXT,
  uploaded_by        TEXT,
  upload_date        TEXT,
  thumbnail_url      TEXT,
  transcript_url     TEXT,
  privacy            TEXT NOT NULL DEFAULT 'draft'
                     CHECK (privacy IN ('draft','published','password')),
  password           TEXT,
  password_headline  TEXT,
  password_hint      TEXT,
  comments_enabled   BOOLEAN NOT NULL DEFAULT false,
  branding           JSONB NOT NULL DEFAULT '{}',
  landing_page       JSONB NOT NULL DEFAULT '{}',
  views              INT NOT NULL DEFAULT 0,
  plays              INT NOT NULL DEFAULT 0,
  eng                INT NOT NULL DEFAULT 0,
  color              TEXT NOT NULL DEFAULT '#4F6EF7',
  replacement_count  INT NOT NULL DEFAULT 0,
  history            JSONB NOT NULL DEFAULT '[]',
  published_at       TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 5. ELEMENTS (all types) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS elements (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id      UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,
  x             INT NOT NULL DEFAULT 0,
  y             INT NOT NULL DEFAULT 0,
  w             INT NOT NULL DEFAULT 200,
  h             INT NOT NULL DEFAULT 50,
  z_index       INT NOT NULL DEFAULT 1,
  opacity       FLOAT NOT NULL DEFAULT 1.0,
  props         JSONB NOT NULL DEFAULT '{}',
  timing        JSONB NOT NULL DEFAULT '{"in":0,"duration":0,"animIn":"fadeIn","animOut":"fadeOut","animSpeed":0.4}',
  trigger_at    REAL GENERATED ALWAYS AS ((timing->>'in')::real) STORED,
  conditions    JSONB NOT NULL DEFAULT '[]',
  gate          JSONB,
  lead_routing  JSONB NOT NULL DEFAULT '{}',
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 6. ROUTES ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS routes (
  id             TEXT PRIMARY KEY,
  workspace_id   UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  video_id       UUID REFERENCES videos(id) ON DELETE SET NULL,
  title          TEXT NOT NULL,
  color          TEXT NOT NULL DEFAULT '#4F6EF7',
  is_root        BOOLEAN NOT NULL DEFAULT false,
  x              INT NOT NULL DEFAULT 300,
  y              INT NOT NULL DEFAULT 180,
  duration       INT,
  choice_points  JSONB NOT NULL DEFAULT '[]',
  cta_points     JSONB NOT NULL DEFAULT '[]',
  landing_page   JSONB NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 7. LEADS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id         UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  video_id             UUID REFERENCES videos(id) ON DELETE SET NULL,
  element_id           UUID REFERENCES elements(id) ON DELETE SET NULL,
  email                TEXT NOT NULL,
  name                 TEXT,                
  first_name           TEXT,
  last_name            TEXT,
  source_url           TEXT,
  ip_address           TEXT,
  phone                TEXT,
  status               TEXT NOT NULL DEFAULT 'New'
                       CHECK (status IN ('New','Contacted','Qualified','Closed')),
  score                INT NOT NULL DEFAULT 0,
  source               TEXT,
  campaign             TEXT,
  utm_source           TEXT,
  utm_medium           TEXT,
  utm_campaign         TEXT,
  device               TEXT,
  watch_depth_pct      INT,
  branch_path          TEXT,
  tags                 TEXT[] NOT NULL DEFAULT '{}',
  notes                TEXT,
  follow_up_date       DATE,
  rewatched            BOOLEAN NOT NULL DEFAULT false,
  rewatch_count        INT NOT NULL DEFAULT 0,
  visitor_fingerprint  TEXT,
  lead_magnet_sent     BOOLEAN NOT NULL DEFAULT false,
  responses            JSONB NOT NULL DEFAULT '[]',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 8. LEAD EVENTS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lead_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  video_id    UUID REFERENCES videos(id) ON DELETE SET NULL,
  event_type  TEXT NOT NULL,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 9. CAPTIONS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS captions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id         UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  start_sec        FLOAT NOT NULL,
  end_sec          FLOAT NOT NULL,
  text             TEXT NOT NULL,
  style            TEXT NOT NULL DEFAULT 'hormozi',
  highlight_color  TEXT NOT NULL DEFAULT '#FFCC00',
  bar_color        TEXT NOT NULL DEFAULT '#000000',
  bar_opacity      INT NOT NULL DEFAULT 80,
  sort_order       INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 10. CHAPTERS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chapters (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id    UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  start_sec   INT NOT NULL,
  title       TEXT NOT NULL,
  summary     TEXT,
  emoji       TEXT NOT NULL DEFAULT '📌',
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 11. VIDEO EVENTS (raw) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS video_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id    UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  element_id  UUID REFERENCES elements(id) ON DELETE SET NULL,
  session_id  TEXT,
  event_type  TEXT NOT NULL,
  event_data  JSONB NOT NULL DEFAULT '{}',
  value       TEXT,
  device      TEXT,
  referrer    TEXT,
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 12. VIDEO ANALYTICS (daily aggregates) ───────────────────────────
CREATE TABLE IF NOT EXISTS video_analytics (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id             UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  date                 DATE NOT NULL,
  views                INT NOT NULL DEFAULT 0,
  plays                INT NOT NULL DEFAULT 0,
  avg_watch_pct        INT NOT NULL DEFAULT 0,
  completions          INT NOT NULL DEFAULT 0,
  gate_impressions     INT NOT NULL DEFAULT 0,
  gate_conversions     INT NOT NULL DEFAULT 0,
  choice_interactions  INT NOT NULL DEFAULT 0,
  shares               INT NOT NULL DEFAULT 0,
  UNIQUE(video_id, date)
);

-- ── 13. WEBHOOK ENDPOINTS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  url           TEXT NOT NULL,
  events        TEXT[] NOT NULL DEFAULT '{}',
  active        BOOLEAN NOT NULL DEFAULT true,
  secret        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 14. INTEGRATION TOKENS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS integration_tokens (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  provider       TEXT NOT NULL,
  auth_type      TEXT NOT NULL,
  access_token   TEXT,
  refresh_token  TEXT,
  api_key        TEXT,
  expires_at     TIMESTAMPTZ,
  scopes         TEXT,
  metadata       JSONB NOT NULL DEFAULT '{}',
  connected      BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, provider)
);

-- ── 15. COMMENTS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id          UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  lead_id           UUID REFERENCES leads(id) ON DELETE SET NULL,
  parent_id         UUID REFERENCES comments(id) ON DELETE CASCADE,
  author_type       TEXT NOT NULL DEFAULT 'lead'
                    CHECK (author_type IN ('lead','owner')),
  body              TEXT NOT NULL,
  timestamp_seconds INT,
  approved          BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 16. LANDING PAGES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS landing_pages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  route_id      TEXT REFERENCES routes(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE,
  url           TEXT,
  color         TEXT DEFAULT '#4F6EF7',
  status        TEXT DEFAULT 'draft' CHECK (status IN ('draft','published')),
  views         INT NOT NULL DEFAULT 0,
  config        JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 17. GOALS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS goals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,
  label         TEXT NOT NULL,
  target        INT NOT NULL,
  current       INT NOT NULL DEFAULT 0,
  period        TEXT DEFAULT 'month',
  icon          TEXT,
  color         TEXT,
  unit          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 18. EMAIL VERIFICATIONS (auth OTP) ───────────────────────────────
CREATE TABLE IF NOT EXISTS email_verifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  code_hash   TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN NOT NULL DEFAULT false,
  attempts    INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ════════════════════════════════════════════════════════════════════
-- INDEXES
-- ════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_videos_workspace       ON videos(workspace_id);
CREATE INDEX IF NOT EXISTS idx_videos_status          ON videos(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_videos_folder          ON videos(workspace_id, folder_id);
CREATE INDEX IF NOT EXISTS idx_videos_created         ON videos(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_elements_video         ON elements(video_id);
CREATE INDEX IF NOT EXISTS idx_routes_workspace       ON routes(workspace_id);
CREATE INDEX IF NOT EXISTS idx_routes_root            ON routes(workspace_id, is_root);
CREATE INDEX IF NOT EXISTS idx_leads_workspace        ON leads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_leads_email            ON leads(workspace_id, email);
CREATE INDEX IF NOT EXISTS idx_leads_fingerprint      ON leads(workspace_id, visitor_fingerprint);
CREATE INDEX IF NOT EXISTS idx_leads_status           ON leads(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_created          ON leads(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_events_lead       ON lead_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_captions_video         ON captions(video_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_chapters_video         ON chapters(video_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_video_events_video     ON video_events(video_id);
CREATE INDEX IF NOT EXISTS idx_video_events_session   ON video_events(session_id);
CREATE INDEX IF NOT EXISTS idx_routes_video          ON routes(video_id) WHERE video_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_video           ON leads(workspace_id, video_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_magnet          ON leads(id, lead_magnet_sent) WHERE lead_magnet_sent = false;
CREATE INDEX IF NOT EXISTS idx_video_events_element  ON video_events(element_id) WHERE element_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_video_events_value    ON video_events(video_id, event_type, value) WHERE value IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_elements_trigger      ON elements(video_id, trigger_at ASC);
-- ── password_resets ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS password_resets (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_video_events_type      ON video_events(video_id, event_type);
CREATE INDEX IF NOT EXISTS idx_video_events_time      ON video_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_video_date   ON video_analytics(video_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_comments_video         ON comments(video_id, approved);
CREATE INDEX IF NOT EXISTS idx_profiles_email_verified ON profiles(id, email_verified);
CREATE INDEX IF NOT EXISTS idx_ev_email               ON email_verifications(email, used, expires_at);
CREATE INDEX IF NOT EXISTS idx_password_resets_token  ON password_resets(token_hash);
CREATE INDEX IF NOT EXISTS idx_password_resets_email  ON password_resets(email);


-- ════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════════════
ALTER TABLE workspaces          ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE elements            ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads               ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_events         ENABLE ROW LEVEL SECURITY;
ALTER TABLE captions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters            ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_analytics     ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_endpoints   ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_tokens  ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_pages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals               ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_resets     ENABLE ROW LEVEL SECURITY;
-- Note: no policies on password_resets or email_verifications —
-- service_role bypasses RLS; all access is via admin API routes only.

-- Workspaces
CREATE POLICY ws_all_owner ON workspaces FOR ALL
  USING (owner_id = auth.uid());

-- Profiles
CREATE POLICY prof_select ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY prof_insert ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY prof_update ON profiles FOR UPDATE USING (id = auth.uid());

-- Folders
CREATE POLICY folders_all ON folders FOR ALL
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid()));

-- Videos
CREATE POLICY vid_owner ON videos FOR ALL
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid()));
CREATE POLICY vid_public ON videos FOR SELECT
  USING (privacy IN ('published','password'));

-- Elements
CREATE POLICY el_owner ON elements FOR ALL
  USING (video_id IN (SELECT id FROM videos WHERE workspace_id IN
    (SELECT id FROM workspaces WHERE owner_id = auth.uid())));
CREATE POLICY el_public ON elements FOR SELECT
  USING (video_id IN (SELECT id FROM videos WHERE privacy IN ('published','password')));

-- Routes
CREATE POLICY routes_owner ON routes FOR ALL
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid()));
CREATE POLICY routes_public ON routes FOR SELECT
  USING (
    video_id IN (
      SELECT id FROM videos WHERE privacy IN ('published', 'password')
    )
  );

-- Leads
CREATE POLICY leads_owner ON leads FOR ALL
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid()));
CREATE POLICY leads_public_insert ON leads FOR INSERT
  WITH CHECK (
    video_id IN (
      SELECT id FROM videos WHERE privacy IN ('published', 'password')
    )
    AND
    workspace_id IN (
      SELECT id FROM workspaces
    )
  );

-- Lead events
CREATE POLICY le_owner ON lead_events FOR ALL
  USING (lead_id IN (SELECT id FROM leads WHERE workspace_id IN
    (SELECT id FROM workspaces WHERE owner_id = auth.uid())));
CREATE POLICY le_public_insert ON lead_events FOR INSERT
  WITH CHECK (
    lead_id IN (
      SELECT id FROM leads
    )
  );

-- Captions
CREATE POLICY cap_owner ON captions FOR ALL
  USING (video_id IN (SELECT id FROM videos WHERE workspace_id IN
    (SELECT id FROM workspaces WHERE owner_id = auth.uid())));
CREATE POLICY cap_public ON captions FOR SELECT
  USING (video_id IN (SELECT id FROM videos WHERE privacy IN ('published','password')));

-- Chapters
CREATE POLICY chap_owner ON chapters FOR ALL
  USING (video_id IN (SELECT id FROM videos WHERE workspace_id IN
    (SELECT id FROM workspaces WHERE owner_id = auth.uid())));
CREATE POLICY chap_public ON chapters FOR SELECT
  USING (video_id IN (SELECT id FROM videos WHERE privacy IN ('published','password')));

-- Video events
CREATE POLICY ve_owner ON video_events FOR SELECT
  USING (video_id IN (SELECT id FROM videos WHERE workspace_id IN
    (SELECT id FROM workspaces WHERE owner_id = auth.uid())));
CREATE POLICY ve_public_insert ON video_events FOR INSERT WITH CHECK (true);

-- Video analytics
CREATE POLICY va_owner ON video_analytics FOR ALL
  USING (video_id IN (SELECT id FROM videos WHERE workspace_id IN
    (SELECT id FROM workspaces WHERE owner_id = auth.uid())));

-- Webhooks
CREATE POLICY wh_owner ON webhook_endpoints FOR ALL
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid()));

-- Integration tokens
CREATE POLICY it_owner ON integration_tokens FOR ALL
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid()));

-- Comments
CREATE POLICY com_owner ON comments FOR ALL
  USING (video_id IN (SELECT id FROM videos WHERE workspace_id IN
    (SELECT id FROM workspaces WHERE owner_id = auth.uid())));
CREATE POLICY com_public_read ON comments FOR SELECT
  USING (video_id IN (SELECT id FROM videos WHERE privacy IN ('published','password'))
    AND approved = true);
CREATE POLICY com_public_insert ON comments FOR INSERT
  WITH CHECK (video_id IN (SELECT id FROM videos
    WHERE privacy IN ('published','password') AND comments_enabled = true));

-- Landing pages
CREATE POLICY lp_owner ON landing_pages FOR ALL
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid()));

-- Goals
CREATE POLICY goals_owner ON goals FOR ALL
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid()));

-- Email verifications: no policies = service_role only (locked from all client access)


-- ════════════════════════════════════════════════════════════════════
-- TRIGGERS
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_ws_updated
  BEFORE UPDATE ON workspaces FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_vid_updated
  BEFORE UPDATE ON videos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_el_updated
  BEFORE UPDATE ON elements FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_routes_updated
  BEFORE UPDATE ON routes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_leads_updated
  BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_it_updated
  BEFORE UPDATE ON integration_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create workspace + profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.workspaces (owner_id, name, plan_tier, bandwidth_limit_bytes)
  VALUES (NEW.id, '', 'core', 1099511627776);

  INSERT INTO public.profiles (id, first_name, last_name, email_verified)
  VALUES (NEW.id, '', '', false);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
