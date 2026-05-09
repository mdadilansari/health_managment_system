/**
 * EventBus - Abstraction layer for inter-service communication.
 *
 * Currently implemented with HTTP (axios).
 * To migrate to RabbitMQ:
 *   1. Replace the `publish` function body with amqplib channel.publish()
 *   2. Each downstream service gets a consumer that calls the same handler logic
 *   3. No changes needed in the callers (appointmentController, etc.)
 *
 * Event contract (same shape whether HTTP or RabbitMQ):
 * {
 *   event:   string,        // e.g. 'appointment.completed'
 *   payload: object,        // event-specific data
 *   meta: {
 *     correlationId: string,
 *     timestamp:     string (ISO),
 *     source:        'appointment-service'
 *   }
 * }
 */

const axios = require('axios');

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3007/api';
const BILLING_SERVICE_URL      = process.env.BILLING_SERVICE_URL      || 'http://localhost:3004/api';

// ── Notification templates ────────────────────────────────────────────────────

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

function formatSlot(isoString) {
  if (!isoString) return 'N/A';
  return new Date(isoString).toLocaleString('en-IN', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata'
  });
}

// ── Core publish function — SWAP THIS for RabbitMQ ───────────────────────────

/**
 * Publish an event to downstream services.
 * @param {string} event   - dot-notation event name e.g. 'appointment.completed'
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

  console.log(`[EventBus] Publishing: ${event}`, envelope.meta.correlationId);

  // Fire-and-forget to all handlers (failures don't block the caller)
  const handlers = HANDLERS[event] || [];
  await Promise.allSettled(handlers.map(h => h(envelope)));
}

// ── HTTP handlers — replace these bodies with amqplib publish for RabbitMQ ──

async function sendNotification(envelope) {
  const { event, payload } = envelope;
  const template = NOTIFICATION_TEMPLATES[event];
  if (!template) return;

  const body = { ...template(payload), recipient_id: payload.patient_id };
  await axios.post(`${NOTIFICATION_SERVICE_URL}/notifications`, body, { timeout: 3000 });
  console.log(`[EventBus] Notification sent for ${event}`);
}

async function createBill(envelope) {
  const { payload } = envelope;
  await axios.post(`${BILLING_SERVICE_URL}/bills/internal`, {
    appointment_id: payload.appointment_id,
    patient_id:     payload.patient_id,
    doctor_id:      payload.doctor_id,
    bill_type:      payload.billType || 'CONSULTATION',
  }, { timeout: 3000 });
  console.log(`[EventBus] Bill creation triggered for appointment ${payload.appointment_id}`);
}

// ── Event → Handler routing ──────────────────────────────────────────────────
// To add RabbitMQ: keep this map, but replace sendNotification/createBill
// with functions that publish to an exchange instead of calling HTTP.

const HANDLERS = {
  'appointment.booked':      [sendNotification],
  'appointment.cancelled':   [sendNotification],
  'appointment.completed':   [sendNotification, createBill],
  'appointment.rescheduled': [sendNotification],
  'appointment.no_show':     [sendNotification, createBill],
};

module.exports = { publish };
