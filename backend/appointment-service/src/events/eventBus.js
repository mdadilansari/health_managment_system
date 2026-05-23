/**
 * EventBus — async messaging via RabbitMQ (topic exchange).
 *
 * Exchange : hms.events  (topic, durable)
 * Routing keys:
 *   appointment.booked | appointment.cancelled | appointment.completed
 *   appointment.rescheduled | appointment.no_show
 *
 * Consumers:
 *   notification-service  → queue 'notifications' bound to 'appointment.*'
 *   billing-service       → queue 'billing'        bound to 'appointment.completed'
 *                                                            'appointment.no_show'
 *
 * Fallback: if RabbitMQ is unreachable, falls back to direct HTTP so that
 * local dev (npm start without RabbitMQ running) keeps working.
 */

const axios = require('axios');

const RABBITMQ_URL             = process.env.RABBITMQ_URL             || 'amqp://localhost:5672';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3007/v1';
const BILLING_SERVICE_URL      = process.env.BILLING_SERVICE_URL      || 'http://localhost:3004/v1';

const EXCHANGE = 'hms.events';

// ── RabbitMQ connection state ─────────────────────────────────────────────────

let _channel = null;
let _connecting = false;

async function getChannel() {
  if (_channel) return _channel;
  if (_connecting) return null;

  _connecting = true;
  try {
    const amqp = require('amqplib');
    const conn = await amqp.connect(RABBITMQ_URL);
    conn.on('error', (err) => {
      console.error('[EventBus] RabbitMQ connection error:', err.message);
      _channel = null;
    });
    conn.on('close', () => {
      console.warn('[EventBus] RabbitMQ connection closed — will retry on next publish');
      _channel = null;
    });
    const ch = await conn.createChannel();
    await ch.assertExchange(EXCHANGE, 'topic', { durable: true });
    _channel = ch;
    _connecting = false;
    console.log('[EventBus] Connected to RabbitMQ — exchange:', EXCHANGE);
    return _channel;
  } catch (err) {
    _connecting = false;
    console.warn('[EventBus] RabbitMQ unavailable, HTTP fallback active:', err.message);
    return null;
  }
}

// Eager connect on startup (non-blocking)
getChannel().catch(() => {});

// ── Notification templates (used only for HTTP fallback) ─────────────────────

function formatSlot(isoString) {
  if (!isoString) return 'N/A';
  return new Date(isoString).toLocaleString('en-IN', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata'
  });
}

const NOTIFICATION_TEMPLATES = {
  'appointment.booked': (p) => ({
    type:    'APPOINTMENT_CONFIRMED',
    title:   'Appointment Confirmed',
    message: `Appointment #${p.appointment_id} scheduled for ${formatSlot(p.slot_start)}`,
    metadata: { appointment_id: p.appointment_id, doctor_id: p.doctor_id }
  }),
  'appointment.cancelled': (p) => ({
    type:    'APPOINTMENT_CANCELLED',
    title:   'Appointment Cancelled',
    message: `Appointment #${p.appointment_id} has been cancelled. Policy: ${p.cancellationPolicy || 'N/A'}`,
    metadata: { appointment_id: p.appointment_id, cancellationPolicy: p.cancellationPolicy }
  }),
  'appointment.completed': (p) => ({
    type:    'APPOINTMENT_COMPLETED',
    title:   'Appointment Completed',
    message: `Appointment #${p.appointment_id} completed. A bill has been generated.`,
    metadata: { appointment_id: p.appointment_id }
  }),
  'appointment.rescheduled': (p) => ({
    type:    'APPOINTMENT_RESCHEDULED',
    title:   'Appointment Rescheduled',
    message: `Appointment #${p.appointment_id} rescheduled to ${formatSlot(p.slot_start)}`,
    metadata: { appointment_id: p.appointment_id }
  }),
  'appointment.no_show': (p) => ({
    type:    'APPOINTMENT_NO_SHOW',
    title:   'Missed Appointment',
    message: `Patient did not attend appointment #${p.appointment_id}. A no-show fee may apply.`,
    metadata: { appointment_id: p.appointment_id }
  }),
};

// ── HTTP fallback handlers ────────────────────────────────────────────────────

async function httpNotify(event, payload) {
  const template = NOTIFICATION_TEMPLATES[event];
  if (!template) return;
  const body = { ...template(payload), recipient_id: payload.patient_id };
  await axios.post(`${NOTIFICATION_SERVICE_URL}/notifications`, body, { timeout: 3000 });
  console.log(`[EventBus][HTTP-fallback] Notification sent for ${event}`);
}

async function httpBill(payload) {
  await axios.post(`${BILLING_SERVICE_URL}/bills/internal`, {
    appointment_id: payload.appointment_id,
    patient_id:     payload.patient_id,
    doctor_id:      payload.doctor_id,
    bill_type:      payload.billType || 'CONSULTATION',
  }, { timeout: 3000 });
  console.log(`[EventBus][HTTP-fallback] Bill triggered for appointment ${payload.appointment_id}`);
}

const HTTP_HANDLERS = {
  'appointment.booked':      [(e, p) => httpNotify(e, p)],
  'appointment.cancelled':   [(e, p) => httpNotify(e, p)],
  'appointment.completed':   [(e, p) => httpNotify(e, p), (e, p) => httpBill(p)],
  'appointment.rescheduled': [(e, p) => httpNotify(e, p)],
  'appointment.no_show':     [(e, p) => httpNotify(e, p), (e, p) => httpBill(p)],
};

// ── Core publish ──────────────────────────────────────────────────────────────

/**
 * Publish an event asynchronously via RabbitMQ.
 * Falls back to direct HTTP if RabbitMQ is unreachable.
 *
 * @param {string} event   - routing key, e.g. 'appointment.completed'
 * @param {object} payload - event data
 */
async function publish(event, payload) {
  const envelope = {
    event,
    payload,
    meta: {
      correlationId: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      source: 'appointment-service',
    },
  };

  try {
    const ch = await getChannel();
    if (ch) {
      ch.publish(
        EXCHANGE,
        event,
        Buffer.from(JSON.stringify(envelope)),
        { persistent: true, contentType: 'application/json' }
      );
      console.log(`[EventBus] Published to RabbitMQ: ${event} (${envelope.meta.correlationId})`);
      return;
    }
  } catch (err) {
    _channel = null;
    console.warn('[EventBus] RabbitMQ publish failed, falling back to HTTP:', err.message);
  }

  // HTTP fallback (local dev without RabbitMQ)
  const handlers = HTTP_HANDLERS[event] || [];
  await Promise.allSettled(handlers.map(h => h(event, payload)));
}

module.exports = { publish };
