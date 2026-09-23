-- =====================================================
--  SCHEMA: AI RACING PLATFORM (PostgreSQL 16)
--  gen_random_uuid() is built into PG16 core.
-- =====================================================

CREATE TABLE seasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_seasons_current ON seasons ((is_current)) WHERE is_current;

CREATE TABLE pilots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    version TEXT NOT NULL DEFAULT '1.0.0',
    team TEXT,
    model_type TEXT,
    description TEXT,
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE races (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    track TEXT,
    conditions TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled'
        CHECK (status IN ('scheduled','live','finished','archived','cancelled')),
    scheduled_at TIMESTAMPTZ,
    stream_key TEXT UNIQUE NOT NULL,
    stream_url_hls TEXT,
    video_archive_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE race_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    race_id UUID NOT NULL REFERENCES races(id) ON DELETE CASCADE,
    pilot_id UUID NOT NULL REFERENCES pilots(id) ON DELETE CASCADE,
    start_position INT,
    finish_position INT,
    best_lap_ms BIGINT,
    avg_speed NUMERIC(6,2),
    final_reward NUMERIC(12,4),
    status TEXT NOT NULL DEFAULT 'entered'
        CHECK (status IN ('entered','finished','dnf','dsq')),
    UNIQUE (race_id, pilot_id)
);

CREATE TABLE pilot_stats (
    pilot_id UUID NOT NULL REFERENCES pilots(id) ON DELETE CASCADE,
    season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    total_races INT NOT NULL DEFAULT 0,
    wins INT NOT NULL DEFAULT 0,
    podiums INT NOT NULL DEFAULT 0,
    dnf_count INT NOT NULL DEFAULT 0,
    best_lap_ms BIGINT,
    avg_speed_overall NUMERIC(6,2),
    points INT NOT NULL DEFAULT 0,
    current_rating INT NOT NULL DEFAULT 1200,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (pilot_id, season_id)
);

CREATE TABLE race_events (
    id BIGSERIAL PRIMARY KEY,
    race_id UUID NOT NULL REFERENCES races(id) ON DELETE CASCADE,
    pilot_id UUID REFERENCES pilots(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    event_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    lap_number INT,
    position INT,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX idx_race_events_race ON race_events(race_id, event_time);

CREATE TABLE chat_messages (
    id BIGSERIAL PRIMARY KEY,
    race_id UUID NOT NULL REFERENCES races(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_chat_race ON chat_messages(race_id, created_at);

CREATE INDEX idx_races_status ON races(status);
CREATE INDEX idx_races_schedule ON races(scheduled_at);
CREATE INDEX idx_pilots_active ON pilots(is_active);
CREATE INDEX idx_participants_pilot ON race_participants(pilot_id);

CREATE OR REPLACE VIEW season_leaderboard AS
SELECT
    s.id AS season_id, p.id AS pilot_id, p.name, p.team,
    ps.points, ps.wins, ps.podiums, ps.best_lap_ms, ps.current_rating,
    RANK() OVER (PARTITION BY s.id ORDER BY ps.points DESC, ps.wins DESC, ps.best_lap_ms ASC NULLS LAST) AS position
FROM pilot_stats ps
JOIN pilots p ON p.id = ps.pilot_id
JOIN seasons s ON s.id = ps.season_id;

CREATE OR REPLACE FUNCTION refresh_pilot_stats() RETURNS TRIGGER AS $$
DECLARE s_id UUID;
BEGIN
    SELECT season_id INTO s_id FROM races WHERE id = NEW.race_id;
    IF s_id IS NULL THEN RETURN NEW; END IF;
    INSERT INTO pilot_stats (pilot_id, season_id, total_races, wins, podiums,
                             dnf_count, best_lap_ms, avg_speed_overall, points)
    SELECT rp.pilot_id, r.season_id,
        COUNT(*) FILTER (WHERE rp.status IN ('finished','dnf','dsq')),
        COUNT(*) FILTER (WHERE rp.finish_position = 1),
        COUNT(*) FILTER (WHERE rp.finish_position BETWEEN 1 AND 3),
        COUNT(*) FILTER (WHERE rp.status = 'dnf'),
        MIN(rp.best_lap_ms) FILTER (WHERE rp.best_lap_ms IS NOT NULL),
        ROUND(AVG(rp.avg_speed) FILTER (WHERE rp.avg_speed IS NOT NULL), 2),
        COALESCE(SUM(CASE rp.finish_position
            WHEN 1 THEN 25 WHEN 2 THEN 18 WHEN 3 THEN 15
            ELSE GREATEST(0, 11 - COALESCE(rp.finish_position, 11)) END), 0)
    FROM race_participants rp
    JOIN races r ON r.id = rp.race_id
    WHERE rp.pilot_id = NEW.pilot_id AND r.season_id = s_id
    GROUP BY rp.pilot_id, r.season_id
    ON CONFLICT (pilot_id, season_id) DO UPDATE SET
        total_races = EXCLUDED.total_races, wins = EXCLUDED.wins,
        podiums = EXCLUDED.podiums, dnf_count = EXCLUDED.dnf_count,
        best_lap_ms = EXCLUDED.best_lap_ms,
        avg_speed_overall = EXCLUDED.avg_speed_overall,
        points = EXCLUDED.points, updated_at = now();
    RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_refresh_pilot_stats
AFTER INSERT OR UPDATE OF finish_position, status ON race_participants
FOR EACH ROW EXECUTE FUNCTION refresh_pilot_stats();

INSERT INTO seasons (name, start_date, end_date, is_current)
VALUES ('Сезон 2026', '2026-01-01', '2026-12-31', TRUE);

INSERT INTO pilots (name, version, team, model_type, description) VALUES
('AlphaRacer', '3.2.1', 'Team Red', 'PPO', 'Обучена на городских трассах'),
('NeuralDrive', '2.0.4', 'Team Blue', 'SAC', 'Специализация: ночные заезды'),
('SkyPilot', '1.8.0', 'Team Green', 'Imitation Learning', 'Базовое поведение с эксперта');
