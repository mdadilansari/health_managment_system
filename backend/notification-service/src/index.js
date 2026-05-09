const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3007;

app.use(cors());
app.use(express.json());

// ── Auto-create table on startup ──────────────────────────────────────────────

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id            SERIAL PRIMARY KEY,
      type          VARCHAR(100) NOT NULL,
      title         VARCHAR(255) NOT NULL,
      message       TEXT NOT NULL,
      recipient_id  INTEGER,
      recipient_role VARCHAR(50),
      metadata      JSONB DEFAULT '{}',
      read          BOOLEAN DEFAULT FALSE,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  console.log('✓ notifications table ready');
}

initDb().catch(err => console.error('DB init error:', err));

// ── Health ────────────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'notification-service', timestamp: new Date().toISOString() });
});

// ── GET all notifications ─────────────────────────────────────────────────────

app.get('/api/notifications', async (req, res) => {
  try {
    const { recipient_id, recipient_role, read } = req.query;
    let query = 'SELECT * FROM notifications';
    const params = [];
    const conditions = [];

    if (recipient_id) {
      conditions.push(`recipient_id = $${conditions.length + 1}`);
      params.push(recipient_id);
    }
    if (recipient_role) {
      conditions.push(`recipient_role = $${conditions.length + 1}`);
      params.push(recipient_role);
    }
    if (read !== undefined) {
      conditions.push(`read = $${conditions.length + 1}`);
      params.push(read === 'true');
    }

    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY created_at DESC LIMIT 100';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// ── GET unread count ──────────────────────────────────────────────────────────

app.get('/api/notifications/unread-count', async (req, res) => {
  try {
    const result = await pool.query(`SELECT COUNT(*) FROM notifications WHERE read = FALSE`);
    res.json({ count: parseInt(result.rows[0].count, 10) });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// ── POST create notification ──────────────────────────────────────────────────

app.post('/api/notifications', async (req, res) => {
  try {
    const { type, title, message, recipient_id, recipient_role, metadata } = req.body;

    if (!type || !message) {
      return res.status(400).json({ error: 'Missing required fields: type, message' });
    }

    const result = await pool.query(
      `INSERT INTO notifications (type, title, message, recipient_id, recipient_role, metadata, read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, FALSE, NOW())
       RETURNING *`,
      [
        type,
        title || type,
        message,
        recipient_id || null,
        recipient_role || null,
        JSON.stringify(metadata || {})
      ]
    );

    console.log(`[NOTIFICATION] ${type}: ${message}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// ── PATCH mark single as read ─────────────────────────────────────────────────

app.patch('/api/notifications/:id/read', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE notifications SET read = TRUE WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Notification not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// ── PATCH mark all as read ────────────────────────────────────────────────────

app.patch('/api/notifications/read-all', async (req, res) => {
  try {
    await pool.query(`UPDATE notifications SET read = TRUE WHERE read = FALSE`);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// ── DELETE notification ───────────────────────────────────────────────────────

app.delete('/api/notifications/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM notifications WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Notification not found' });
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// ── Start server ──────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🚀 Notification Service running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔔 Notifications API: http://localhost:${PORT}/api/notifications`);
});
