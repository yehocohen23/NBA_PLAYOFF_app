-- ═══════════════════════════════════════════════════════════════════════════
--  NBA Playoffs 2026 — Server-side per-game deadline enforcement
--
--  Goal: even if the UI is bypassed, Postgres will reject any write to
--  `users.pi` or `users.po` that would change a pick for a game whose
--  start time has already passed (now() >= start_time).
--
--  HOW IT WORKS
--    1. `game_schedule` stores (game_id, start_time) for every play-in and
--       playoff series. `game_id` matches the keys already used in
--       `users.pi` and `users.po` (e.g. 'pi_e78', 'r1_e1', 'r2_w2', 'finals').
--    2. A BEFORE UPDATE trigger on `users` walks the diff between OLD and NEW
--       `pi` / `po` JSONB. For every key that changed, it looks up the game's
--       start_time. If start_time <= now() the trigger raises an exception
--       and the update is rolled back.
--
--  ROLLOUT NOTES
--    * The current RLS setup on `users` is permissive (allow_all_users).
--      This trigger is an additional safety layer that works WITH or WITHOUT
--      RLS — it runs at the row level before any row is written.
--    * Admin score-entry (results table) is unaffected.
--    * Keep the schedule in sync with ESPN / your source of truth.
--    * If you want to bypass the trigger (e.g. manual correction), use a
--      Supabase SQL editor session with `SET LOCAL session_replication_role =
--      'replica';` before the UPDATE and reset afterwards.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. game_schedule table ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS game_schedule (
  game_id    TEXT        PRIMARY KEY,
  start_time TIMESTAMPTZ NOT NULL,
  label      TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  game_schedule            IS 'Per-game kickoff times used to enforce per-game prediction deadlines';
COMMENT ON COLUMN game_schedule.game_id    IS 'Matches the JSONB key in users.pi / users.po (e.g. pi_e78, r1_e1, finals)';
COMMENT ON COLUMN game_schedule.start_time IS 'UTC timestamp — once now() >= start_time, the pick for this game is locked';

-- Seed examples — fill these with real ESPN start times before relying on the trigger.
-- INSERT INTO game_schedule (game_id, start_time, label) VALUES
--   ('pi_e78',  '2026-04-14T23:00:00Z', 'East #7 vs #8'),
--   ('pi_e910', '2026-04-15T01:30:00Z', 'East #9 vs #10'),
--   ('pi_w78',  '2026-04-15T03:00:00Z', 'West #7 vs #8'),
--   ('pi_w910', '2026-04-15T05:30:00Z', 'West #9 vs #10'),
--   ('pi_elo',  '2026-04-17T23:00:00Z', 'East Loser Game'),
--   ('pi_wlo',  '2026-04-18T01:30:00Z', 'West Loser Game'),
--   ('r1_e1',   '2026-04-18T17:00:00Z', 'DET vs E8'),
--   -- …and so on for every series…
--   ('finals',  '2026-06-04T00:30:00Z', 'NBA Finals G1');

-- ─── 2. helper: is this pick locked? ────────────────────────────────────────
CREATE OR REPLACE FUNCTION game_is_locked(p_game_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (SELECT start_time <= now() FROM game_schedule WHERE game_id = p_game_id),
    FALSE  -- unknown games are treated as "not locked" so new rounds don't break writes
  );
$$;

-- ─── 3. BEFORE UPDATE trigger on users ──────────────────────────────────────
CREATE OR REPLACE FUNCTION reject_locked_pick_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  k        TEXT;
  old_val  JSONB;
  new_val  JSONB;
  st       TIMESTAMPTZ;
BEGIN
  -- Check playoff picks (po) ------------------------------------------------
  IF NEW.po IS DISTINCT FROM OLD.po THEN
    FOR k IN
      SELECT jsonb_object_keys(COALESCE(NEW.po, '{}'::jsonb) || COALESCE(OLD.po, '{}'::jsonb))
    LOOP
      old_val := OLD.po -> k;
      new_val := NEW.po -> k;
      IF old_val IS DISTINCT FROM new_val THEN
        SELECT start_time INTO st FROM game_schedule WHERE game_id = k;
        IF st IS NOT NULL AND st <= now() THEN
          RAISE EXCEPTION
            'Cannot update pick for game "%": game already started at % (now=%).',
            k, st, now()
            USING ERRCODE = 'check_violation';
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- Check play-in picks (pi) ------------------------------------------------
  IF NEW.pi IS DISTINCT FROM OLD.pi THEN
    FOR k IN
      SELECT jsonb_object_keys(COALESCE(NEW.pi, '{}'::jsonb) || COALESCE(OLD.pi, '{}'::jsonb))
    LOOP
      old_val := OLD.pi -> k;
      new_val := NEW.pi -> k;
      IF old_val IS DISTINCT FROM new_val THEN
        SELECT start_time INTO st FROM game_schedule WHERE game_id = k;
        IF st IS NOT NULL AND st <= now() THEN
          RAISE EXCEPTION
            'Cannot update play-in pick for game "%": game already started at % (now=%).',
            k, st, now()
            USING ERRCODE = 'check_violation';
        END IF;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reject_locked_pick_updates ON users;
CREATE TRIGGER trg_reject_locked_pick_updates
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION reject_locked_pick_updates();

-- ═══════════════════════════════════════════════════════════════════════════
-- OPTIONAL ALTERNATIVE — if you prefer not to add a schedule table:
--
-- You can store a JSONB map of start times inside app_config.data.deadlines
-- (keyed by game_id) and rewrite `reject_locked_pick_updates` to read from
-- there instead of `game_schedule`. The trigger body is almost identical; only
-- the `SELECT start_time INTO st ...` line changes to:
--
--   SELECT (data->'deadlines'->>k)::timestamptz INTO st FROM app_config WHERE id=1;
--
-- Either approach gives you server-side enforcement of the per-game deadline.
-- ═══════════════════════════════════════════════════════════════════════════
