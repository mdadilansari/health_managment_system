const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');
const logger = require('./middleware/logger');
const { errorHandler } = require('./middleware/errorHandler');
const { register, metricsMiddleware, appointmentsCreatedTotal, appointmentsCancelledTotal } = require('./middleware/metrics');
const eventBus = require('./events/eventBus');

const app = express();
const PORT = process.env.PORT || 3003;

const DOCTOR_DAILY_CAP = parseInt(process.env.DOCTOR_DAILY_CAP || '16');
const LEAD_TIME_HOURS = parseInt(process.env.LEAD_TIME_HOURS || '2');
const MAX_RESCHEDULES = parseInt(process.env.MAX_RESCHEDULES || '2');

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function parseSlotDateTime(date, timeStr) {
  const [time, meridiem] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (meridiem === 'PM' && hours !== 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  return new Date(`${date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
}

/**
 * Check if a doctor already has an active appointment overlapping [slotStart, slotEnd)
 * Optionally exclude a specific appointment_id (for reschedule).
 */
async function hasSlotConflict(doctor_id, slotStart, slotEnd, excludeId = null) {
  const params = [doctor_id, slotStart.toISOString(), slotEnd.toISOString()];
  let query = `
    SELECT 1 FROM appointments
    WHERE doctor_id = $1
      AND status NOT IN ('CANCELLED')
      AND slot_start < $3
      AND slot_end > $2
  `;
  if (excludeId) {
    query += ` AND appointment_id != $4`;
    params.push(excludeId);
  }
  const result = await pool.query(query, params);
  return result.rows.length > 0;
}

/**
 * Count active (non-cancelled) appointments for a doctor on a given date.
 */
async function getDoctorDailyCount(doctor_id, date) {
  const result = await pool.query(
    `SELECT COUNT(*) FROM appointments
     WHERE doctor_id = $1
       AND DATE(slot_start) = $2
       AND status NOT IN ('CANCELLED')`,
    [doctor_id, date]
  );
  return parseInt(result.rows[0].count, 10);
}

// â”€â”€ Middleware â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

app.use(cors());
app.use(express.json());

// Attach correlation ID to every request
app.use((req, _res, next) => {
  const { randomUUID } = require('crypto');
  req.correlationId = req.headers['x-correlation-id'] || randomUUID();
  next();
});

// Prometheus metrics middleware
app.use(metricsMiddleware('appointment-service'));

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// â”€â”€ Health â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'appointment-service', timestamp: new Date().toISOString() });
});

// â”€â”€ GET all appointments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

app.get('/v1/appointments', async (req, res) => {
  try {
    const { status, doctor_id, patient_id, date } = req.query;
    let query = 'SELECT * FROM appointments';
    let params = [];
    let conditions = [];

    if (status) { conditions.push(`status = $${conditions.length + 1}`); params.push(status); }
    if (doctor_id) { conditions.push(`doctor_id = $${conditions.length + 1}`); params.push(doctor_id); }
    if (patient_id) { conditions.push(`patient_id = $${conditions.length + 1}`); params.push(patient_id); }
    if (date) { conditions.push(`DATE(slot_start) = $${conditions.length + 1}`); params.push(date); }
    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY appointment_id DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// â”€â”€ GET single appointment â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

app.get('/v1/appointments/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM appointments WHERE appointment_id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Appointment not found' });
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error fetching appointment:', error);
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
});

// â”€â”€ GET available slots â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

app.get('/v1/appointments/slots/available', async (req, res) => {
  try {
    const { doctor_id, date } = req.query;
    if (!doctor_id || !date) {
      return res.status(400).json({ error: 'Missing required query parameters: doctor_id, date' });
    }

    const allSlots = [
      '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
      '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
      '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
    ];

    const result = await pool.query(
      `SELECT slot_start FROM appointments
       WHERE doctor_id = $1 AND DATE(slot_start) = $2 AND status != 'CANCELLED'`,
      [doctor_id, date]
    );

    const bookedTimes = result.rows.map(r => {
      const d = new Date(r.slot_start);
      let h = d.getUTCHours(), m = d.getUTCMinutes();
      const meridiem = h >= 12 ? 'PM' : 'AM';
      if (h > 12) h -= 12;
      if (h === 0) h = 12;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${meridiem}`;
    });

    const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));
    res.json(availableSlots);
  } catch (error) {
    logger.error('Error fetching available slots:', error);
    res.status(500).json({ error: 'Failed to fetch available slots' });
  }
});

// â”€â”€ POST create appointment â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

app.post('/v1/appointments', async (req, res) => {
  try {
    const { patient_id, doctor_id, department, appointment_date, start_time, slot_start, slot_end } = req.body;

    if (!patient_id || !doctor_id) {
      return res.status(400).json({ error: 'Missing required fields: patient_id, doctor_id' });
    }

    let slotStart, slotEnd;

    if (slot_start && slot_end) {
      slotStart = new Date(slot_start);
      slotEnd = new Date(slot_end);
    } else if (appointment_date && start_time) {
      slotStart = parseSlotDateTime(appointment_date, start_time);
      slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000);
    } else {
      return res.status(400).json({ error: 'Provide either slot_start+slot_end or appointment_date+start_time' });
    }

    // 1. Lead time validation â€” must book at least LEAD_TIME_HOURS before slot
    const now = new Date();
    const leadTimeMs = LEAD_TIME_HOURS * 60 * 60 * 1000;
    if (slotStart.getTime() - now.getTime() < leadTimeMs) {
      return res.status(400).json({
        error: `Appointments must be booked at least ${LEAD_TIME_HOURS} hours in advance`
      });
    }

    // 2. Slot collision â€” doctor can't have overlapping active appointments
    const conflict = await hasSlotConflict(doctor_id, slotStart, slotEnd);
    if (conflict) {
      return res.status(409).json({ error: 'This time slot is already booked for the selected doctor' });
    }

    // 3. Doctor daily cap
    const dateStr = slotStart.toISOString().split('T')[0];
    const dailyCount = await getDoctorDailyCount(doctor_id, dateStr);
    if (dailyCount >= DOCTOR_DAILY_CAP) {
      return res.status(409).json({
        error: `Doctor has reached the maximum of ${DOCTOR_DAILY_CAP} appointments for this day`
      });
    }

    const result = await pool.query(
      `INSERT INTO appointments (patient_id, doctor_id, department, slot_start, slot_end, status, reschedule_count, created_at)
       VALUES ($1, $2, $3, $4, $5, 'SCHEDULED', 0, NOW())
       RETURNING *`,
      [patient_id, doctor_id, department || null, slotStart.toISOString(), slotEnd.toISOString()]
    );

    const created = result.rows[0];

    // Publish event (fire-and-forget)
    eventBus.publish('appointment.booked', created);

    appointmentsCreatedTotal.inc();
    res.status(201).json(created);
  } catch (error) {
    logger.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// â”€â”€ PATCH cancel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

app.patch('/v1/appointments/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query(
      'SELECT * FROM appointments WHERE appointment_id = $1', [id]
    );
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Appointment not found' });

    const appt = existing.rows[0];
    if (['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(appt.status)) {
      return res.status(400).json({ error: `Cannot cancel an appointment with status: ${appt.status}` });
    }

    const now = new Date();
    const slotStart = new Date(appt.slot_start);
    const hoursUntilSlot = (slotStart - now) / (1000 * 60 * 60);
    const cancellationPolicy = hoursUntilSlot > 2 ? 'FULL_REFUND' : 'PARTIAL_REFUND_50_PERCENT';

    const result = await pool.query(
      `UPDATE appointments SET status = 'CANCELLED' WHERE appointment_id = $1 RETURNING *`,
      [id]
    );

    const cancelled = { ...result.rows[0], cancellationPolicy };

    // Publish event (fire-and-forget)
    eventBus.publish('appointment.cancelled', cancelled);

    appointmentsCancelledTotal.inc();
    res.json(cancelled);
  } catch (error) {
    logger.error('Error cancelling appointment:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

// â”€â”€ PATCH complete â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

app.patch('/v1/appointments/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query(
      'SELECT * FROM appointments WHERE appointment_id = $1', [id]
    );
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Appointment not found' });

    const appt = existing.rows[0];
    if (appt.status !== 'SCHEDULED') {
      return res.status(400).json({ error: `Cannot complete an appointment with status: ${appt.status}` });
    }

    const result = await pool.query(
      `UPDATE appointments SET status = 'COMPLETED' WHERE appointment_id = $1 RETURNING *`,
      [id]
    );

    const completed = result.rows[0];

    // Publish event â€” triggers both sendNotification AND createBill
    eventBus.publish('appointment.completed', completed);

    res.json(completed);
  } catch (error) {
    logger.error('Error completing appointment:', error);
    res.status(500).json({ error: 'Failed to complete appointment' });
  }
});

// â”€â”€ PATCH no-show â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

app.patch('/v1/appointments/:id/no-show', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query(
      'SELECT * FROM appointments WHERE appointment_id = $1', [id]
    );
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Appointment not found' });

    const appt = existing.rows[0];
    if (appt.status !== 'SCHEDULED') {
      return res.status(400).json({ error: `Cannot mark no-show for appointment with status: ${appt.status}` });
    }

    const result = await pool.query(
      `UPDATE appointments SET status = 'NO_SHOW' WHERE appointment_id = $1 RETURNING *`,
      [id]
    );

    const noShow = { ...result.rows[0], billType: 'NO_SHOW_FEE' };

    // Publish event â€” triggers notification + no-show fee bill
    eventBus.publish('appointment.no_show', noShow);

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error marking no-show:', error);
    res.status(500).json({ error: 'Failed to mark appointment as no-show' });
  }
});

// â”€â”€ PATCH reschedule â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

app.patch('/v1/appointments/:id/reschedule', async (req, res) => {
  try {
    const { id } = req.params;
    const { appointment_date, start_time, slot_start, slot_end } = req.body;

    const existing = await pool.query(
      'SELECT * FROM appointments WHERE appointment_id = $1', [id]
    );
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Appointment not found' });

    const appt = existing.rows[0];

    // 1. Must be SCHEDULED
    if (appt.status !== 'SCHEDULED') {
      return res.status(400).json({ error: `Cannot reschedule an appointment with status: ${appt.status}` });
    }

    // 2. Max reschedule limit
    if (appt.reschedule_count >= MAX_RESCHEDULES) {
      return res.status(400).json({
        error: `Maximum reschedules (${MAX_RESCHEDULES}) reached for this appointment`
      });
    }

    // 3. Cannot reschedule within 1 hour of current slot
    const now = new Date();
    const currentSlotStart = new Date(appt.slot_start);
    const hoursUntilCurrent = (currentSlotStart - now) / (1000 * 60 * 60);
    if (hoursUntilCurrent < 1) {
      return res.status(400).json({
        error: 'Cannot reschedule within 1 hour of the appointment slot'
      });
    }

    // 4. Parse new slot
    let newSlotStart, newSlotEnd;
    if (slot_start && slot_end) {
      newSlotStart = new Date(slot_start);
      newSlotEnd = new Date(slot_end);
    } else if (appointment_date && start_time) {
      newSlotStart = parseSlotDateTime(appointment_date, start_time);
      newSlotEnd = new Date(newSlotStart.getTime() + 30 * 60 * 1000);
    } else {
      return res.status(400).json({ error: 'Provide either slot_start+slot_end or appointment_date+start_time' });
    }

    // 5. Lead time on new slot
    const leadTimeMs = LEAD_TIME_HOURS * 60 * 60 * 1000;
    if (newSlotStart.getTime() - now.getTime() < leadTimeMs) {
      return res.status(400).json({
        error: `New slot must be at least ${LEAD_TIME_HOURS} hours from now`
      });
    }

    // 6. Slot collision on new slot (excluding this appointment)
    const conflict = await hasSlotConflict(appt.doctor_id, newSlotStart, newSlotEnd, id);
    if (conflict) {
      return res.status(409).json({ error: 'The new time slot is already booked for this doctor' });
    }

    // 7. Doctor daily cap on new date (excluding this appointment)
    const newDateStr = newSlotStart.toISOString().split('T')[0];
    const dailyCount = await getDoctorDailyCount(appt.doctor_id, newDateStr);
    if (dailyCount >= DOCTOR_DAILY_CAP) {
      return res.status(409).json({
        error: `Doctor has reached the maximum of ${DOCTOR_DAILY_CAP} appointments on the new date`
      });
    }

    const result = await pool.query(
      `UPDATE appointments
       SET slot_start = $1, slot_end = $2, reschedule_count = reschedule_count + 1
       WHERE appointment_id = $3
       RETURNING *`,
      [newSlotStart.toISOString(), newSlotEnd.toISOString(), id]
    );

    const rescheduled = result.rows[0];

    // Publish event (fire-and-forget)
    eventBus.publish('appointment.rescheduled', rescheduled);

    res.json(rescheduled);
  } catch (error) {
    logger.error('Error rescheduling appointment:', error);
    res.status(500).json({ error: 'Failed to reschedule appointment' });
  }
});

// â”€â”€ DELETE appointment â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

app.delete('/v1/appointments/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM appointments WHERE appointment_id = $1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Appointment not found' });
    res.json({ message: 'Appointment deleted successfully', appointment: result.rows[0] });
  } catch (error) {
    logger.error('Error deleting appointment:', error);
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

// â”€â”€ Start server â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

app.listen(PORT, () => {
  logger.info(`ðŸš€ Appointment Service running on http://localhost:${PORT}`);
  logger.info(`ðŸ“Š Health check: http://localhost:${PORT}/health`);
  logger.info(`ðŸ“… Appointments API: http://localhost:${PORT}/api/appointments`);
});


