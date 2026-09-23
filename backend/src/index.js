import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import 'dotenv/config';
import { pool } from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

app.get('/health', (req, res) => res.json({ ok: true }));

app.get('/api/pilots', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM pilots ORDER BY created_at DESC');
    res.json(rows);
  } catch (e) { next(e); }
});

app.get('/api/pilots/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.*, ps.total_races, ps.wins, ps.podiums, ps.best_lap_ms,
              ps.avg_speed_overall, ps.points, ps.current_rating
         FROM pilots p
         LEFT JOIN pilot_stats ps ON ps.pilot_id = p.id
          AND ps.season_id = (SELECT id FROM seasons WHERE is_current LIMIT 1)
        WHERE p.id = $1`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
    res.json(rows[0]);
  } catch (e) { next(e); }
});

app.get('/api/pilots/:id/races', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.id, r.title, r.track, r.conditions, r.scheduled_at,
              r.status, r.video_archive_url, rp.finish_position, rp.best_lap_ms
         FROM race_participants rp
         JOIN races r ON r.id = rp.race_id
        WHERE rp.pilot_id = $1
        ORDER BY r.scheduled_at DESC NULLS LAST`, [req.params.id]);
    res.json(rows);
  } catch (e) { next(e); }
});

app.get('/api/races', async (req, res, next) => {
  try {
    const { status } = req.query;
    let q = 'SELECT * FROM races';
    const params = [];
    if (status) { q += ' WHERE status = $1'; params.push(status); }
    q += ' ORDER BY scheduled_at DESC NULLS LAST';
    const { rows } = await pool.query(q, params);
    res.json(rows);
  } catch (e) { next(e); }
});

app.get('/api/races/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM races WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
    res.json(rows[0]);
  } catch (e) { next(e); }
});

app.get('/api/races/:id/participants', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT rp.*, p.name, p.team, p.avatar_url
         FROM race_participants rp
         JOIN pilots p ON p.id = rp.pilot_id
        WHERE rp.race_id = $1
        ORDER BY rp.finish_position ASC NULLS LAST, rp.start_position ASC`, [req.params.id]);
    res.json(rows);
  } catch (e) { next(e); }
});

app.get('/api/leaderboard/season/current', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM season_leaderboard
        WHERE season_id = (SELECT id FROM seasons WHERE is_current LIMIT 1)
        ORDER BY position ASC`);
    res.json(rows);
  } catch (e) { next(e); }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL', message: err.message } });
});

const chatRateLimit = new Map();

io.on('connection', (socket) => {
  socket.on('join:race', (raceId) => socket.join(`race:${raceId}`));

  socket.on('chat:message', async ({ raceId, userName, message }) => {
    try {
      userName = String(userName || 'anon').slice(0, 50);
      message = String(message || '').trim().slice(0, 500);
      if (!message) return;

      const now = Date.now();
      const last = chatRateLimit.get(socket.id) || 0;
      if (now - last < 2000) return;
      chatRateLimit.set(socket.id, now);

      const { rows } = await pool.query(
        `INSERT INTO chat_messages (race_id, user_name, message)
         VALUES ($1,$2,$3) RETURNING id, race_id, user_name, message, created_at`,
        [raceId, userName, message]);

      io.to(`race:${raceId}`).emit('chat:message', rows[0]);
    } catch (e) { console.error(e); }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`Backend listening on :${PORT}`));
