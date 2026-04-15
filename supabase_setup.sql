-- ═══════════════════════════════════════════════════════════
--  NBA Playoffs 2026 — Supabase Database Setup
--  הרץ את הקוד הזה ב-SQL Editor בפרויקט Supabase שלך
-- ═══════════════════════════════════════════════════════════

-- ─── 1. טבלת משתמשים ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,
  photo_url   TEXT,
  po          JSONB DEFAULT '{}',
  pi          JSONB DEFAULT '{}',
  champ       TEXT,
  mvp         TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ─── 2. טבלת תוצאות (שורה אחת) ──────────────────────────
CREATE TABLE IF NOT EXISTS results (
  id    INT PRIMARY KEY DEFAULT 1,
  data  JSONB NOT NULL DEFAULT '{"po":{},"pi":{},"champ":null,"mvp":null}'
);

-- הכנסת שורת ברירת מחדל
INSERT INTO results (id, data)
VALUES (1, '{"po":{},"pi":{},"champ":null,"mvp":null}')
ON CONFLICT (id) DO NOTHING;

-- ─── 3. טבלת הגדרות אדמין (שורה אחת) ────────────────────
CREATE TABLE IF NOT EXISTS app_config (
  id    INT PRIMARY KEY DEFAULT 1,
  data  JSONB NOT NULL
);

-- הכנסת ערכי ברירת מחדל
INSERT INTO app_config (id, data)
VALUES (1, '{
  "rPi": false,
  "rPo": false,
  "openR": "r1",
  "deadline": null,
  "adminPw": null,
  "prizes": {"p1": "TBD by admin", "p2": "TBD by admin", "p3": "TBD by admin"},
  "leagueName": "NBA Playoffs 2026"
}')
ON CONFLICT (id) DO NOTHING;

-- ─── 4. Row Level Security (RLS) ─────────────────────────
-- הפעלת RLS על כל הטבלאות
ALTER TABLE users      ENABLE ROW LEVEL SECURITY;
ALTER TABLE results    ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- אפשר לכולם לקרוא ולכתוב (האפליקציה מנהלת הרשאות בעצמה)
CREATE POLICY "allow_all_users"      ON users      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_results"    ON results    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_app_config" ON app_config FOR ALL USING (true) WITH CHECK (true);

-- ─── 5. Realtime ─────────────────────────────────────────
-- הפעלת Realtime על כל הטבלאות
-- (עשה זאת דרך Dashboard: Database → Replication → הפעל על כל הטבלאות)
-- או הרץ:
ALTER PUBLICATION supabase_realtime ADD TABLE results;
ALTER PUBLICATION supabase_realtime ADD TABLE app_config;
ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- ═══════════════════════════════════════════════════════════
--  אחרי הרצת הSQL, צריך לעדכן ב-App.jsx:
--  const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co'
--  const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE'
--  הערכים נמצאים ב: Project Settings → API
-- ═══════════════════════════════════════════════════════════
