/**
 * RabbitMQ Consumer — Billing Service
 *
 * Listens to the 'hms.events' topic exchange.
 * Bound to 'appointment.completed' and 'appointment.no_show' events.
 * Creates bills autonomously, replacing the previous /v1/bills/internal HTTP call.
 *
 * Idempotent: skips bill creation if a non-VOID bill already exists for the appointment.
 *
 * Graceful degradation: if RabbitMQ is unreachable, the /v1/bills/internal REST
 * endpoint (HTTP fallback) still accepts calls from the appointment-service.
 */

require('dotenv').config();
const pool   = require('./db');
const logger = require('./middleware/logger');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const EXCHANGE     = 'hms.events';
const QUEUE        = 'billing-service.queue';

const BASE_AMOUNTS = { CONSULTATION: 500, NO_SHOW_FEE: 200 };
const TAX_RATE     = 0.05;

// ── Bill creation logic (shared with /v1/bills/internal) ─────────────────────

async function createBill({ appointment_id, patient_id, bill_type = 'CONSULTATION', correlationId }) {
  // Idempotency check
  const existing = await pool.query(
    `SELECT bill_id FROM bills WHERE appointment_id = $1 AND status != 'VOID'`,
    [appointment_id]
  );
  if (existing.rows.length > 0) {
    logger.info(`[Consumer] Bill already exists for appointment #${appointment_id} — skipping`);
    return;
  }

  const base   = BASE_AMOUNTS[bill_type] || BASE_AMOUNTS.CONSULTATION;
  const tax    = parseFloat((base * TAX_RATE).toFixed(2));
  const amount = parseFloat((base + tax).toFixed(2));

  const result = await pool.query(
    `INSERT INTO bills (appointment_id, patient_id, amount, status, created_at)
     VALUES ($1, $2, $3, 'OPEN', NOW()) RETURNING *`,
    [appointment_id, patient_id, amount]
  );
  logger.info(`[Consumer] Bill #${result.rows[0].bill_id} created for appointment #${appointment_id} (${bill_type}, ₹${amount}) [${correlationId}]`);
}

// ── Message handler ───────────────────────────────────────────────────────────

async function handleMessage(envelope) {
  const { event, payload, meta } = envelope;

  if (event === 'appointment.completed') {
    await createBill({
      appointment_id: payload.appointment_id,
      patient_id:     payload.patient_id,
      bill_type:      'CONSULTATION',
      correlationId:  meta?.correlationId,
    });
  } else if (event === 'appointment.no_show') {
    await createBill({
      appointment_id: payload.appointment_id,
      patient_id:     payload.patient_id,
      bill_type:      'NO_SHOW_FEE',
      correlationId:  meta?.correlationId,
    });
  }
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
    ch.prefetch(5);

    await ch.assertExchange(EXCHANGE, 'topic', { durable: true });
    const q = await ch.assertQueue(QUEUE, { durable: true });

    // Bind only to billing-relevant events
    await ch.bindQueue(q.queue, EXCHANGE, 'appointment.completed');
    await ch.bindQueue(q.queue, EXCHANGE, 'appointment.no_show');

    logger.info(`[Consumer] Listening on queue '${QUEUE}' (appointment.completed, appointment.no_show)`);

    ch.consume(q.queue, async (msg) => {
      if (!msg) return;
      try {
        const envelope = JSON.parse(msg.content.toString());
        await handleMessage(envelope);
        ch.ack(msg);
      } catch (err) {
        logger.error('[Consumer] Failed to process message:', err.message);
        ch.nack(msg, false, false);
      }
    });
  } catch (err) {
    logger.warn(`[Consumer] RabbitMQ not available (${err.message}) — retrying in 10s`);
    setTimeout(startConsumer, 10000);
  }
}

module.exports = { startConsumer };
