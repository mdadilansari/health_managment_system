/**
 * RabbitMQ Consumer — Notification Service
 *
 * Listens to the 'hms.events' topic exchange.
 * Binding key 'appointment.*' captures all appointment lifecycle events.
 * Each message is persisted to the notifications table.
 *
 * Graceful degradation: if RabbitMQ is unreachable, consumer silently skips
 * and the service still works as a REST API (HTTP fallback from appointment-service).
 */

require('dotenv').config();
const pool   = require('./db');
const logger = require('./middleware/logger');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const EXCHANGE     = 'hms.events';
const QUEUE        = 'notification-service.queue';
const BINDING_KEY  = 'appointment.*';

// ── Template: convert payload → notification row fields ──────────────────────

function formatSlot(isoString) {
  if (!isoString) return 'N/A';
  return new Date(isoString).toLocaleString('en-IN', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata'
  });
}

const TEMPLATES = {
  'appointment.booked': (p) => ({
    type:    'APPOINTMENT_CONFIRMED',
    title:   'Appointment Confirmed',
    message: `Appointment #${p.appointment_id} scheduled for ${formatSlot(p.slot_start)}`,
  }),
  'appointment.cancelled': (p) => ({
    type:    'APPOINTMENT_CANCELLED',
    title:   'Appointment Cancelled',
    message: `Appointment #${p.appointment_id} has been cancelled. Policy: ${p.cancellationPolicy || 'N/A'}`,
  }),
  'appointment.completed': (p) => ({
    type:    'APPOINTMENT_COMPLETED',
    title:   'Appointment Completed',
    message: `Appointment #${p.appointment_id} completed. A bill has been generated.`,
  }),
  'appointment.rescheduled': (p) => ({
    type:    'APPOINTMENT_RESCHEDULED',
    title:   'Appointment Rescheduled',
    message: `Appointment #${p.appointment_id} rescheduled to ${formatSlot(p.slot_start)}`,
  }),
  'appointment.no_show': (p) => ({
    type:    'APPOINTMENT_NO_SHOW',
    title:   'Missed Appointment',
    message: `Patient did not attend appointment #${p.appointment_id}. A no-show fee may apply.`,
  }),
};

// ── Message handler ───────────────────────────────────────────────────────────

async function handleMessage(envelope) {
  const { event, payload, meta } = envelope;
  const tpl = TEMPLATES[event];
  if (!tpl) {
    logger.warn(`[Consumer] No template for event: ${event}`);
    return;
  }

  const { type, title, message } = tpl(payload);
  await pool.query(
    `INSERT INTO notifications (type, title, message, recipient_id, metadata, read, created_at)
     VALUES ($1, $2, $3, $4, $5, FALSE, NOW())`,
    [
      type,
      title,
      message,
      payload.patient_id || null,
      JSON.stringify({ ...payload, correlationId: meta?.correlationId }),
    ]
  );
  logger.info(`[Consumer] Notification stored: ${type} for appointment #${payload.appointment_id} (${meta?.correlationId})`);
}

// ── RabbitMQ setup ────────────────────────────────────────────────────────────

async function startConsumer() {
  try {
    const amqp = require('amqplib');
    const conn = await amqp.connect(RABBITMQ_URL);

    conn.on('error', (err) => logger.error('[Consumer] RabbitMQ connection error:', err.message));
    conn.on('close', () => {
      logger.warn('[Consumer] RabbitMQ connection closed — retrying in 10s');
      setTimeout(startConsumer, 10000);
    });

    const ch = await conn.createChannel();
    ch.prefetch(10); // process up to 10 messages concurrently

    await ch.assertExchange(EXCHANGE, 'topic', { durable: true });
    const q = await ch.assertQueue(QUEUE, { durable: true });
    await ch.bindQueue(q.queue, EXCHANGE, BINDING_KEY);

    logger.info(`[Consumer] Listening on queue '${QUEUE}' (binding: ${BINDING_KEY})`);

    ch.consume(q.queue, async (msg) => {
      if (!msg) return;
      try {
        const envelope = JSON.parse(msg.content.toString());
        await handleMessage(envelope);
        ch.ack(msg);
      } catch (err) {
        logger.error('[Consumer] Failed to process message:', err.message);
        // nack without requeue to avoid poison-pill loops
        ch.nack(msg, false, false);
      }
    });
  } catch (err) {
    logger.warn(`[Consumer] RabbitMQ not available (${err.message}) — retrying in 10s`);
    setTimeout(startConsumer, 10000);
  }
}

module.exports = { startConsumer };
