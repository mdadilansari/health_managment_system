const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'UP', 
    service: 'appointment-service',
    timestamp: new Date().toISOString()
  });
});

// Get all appointments with optional filters
app.get('/api/appointments', async (req, res) => {
  try {
    const { status, doctor_id, patient_id, date } = req.query;
    
    let query = 'SELECT * FROM appointments';
    let params = [];
    let conditions = [];

    if (status) {
      conditions.push('status = $' + (conditions.length + 1));
      params.push(status);
    }

    if (doctor_id) {
      conditions.push('doctor_id = $' + (conditions.length + 1));
      params.push(doctor_id);
    }

    if (patient_id) {
      conditions.push('patient_id = $' + (conditions.length + 1));
      params.push(patient_id);
    }

    if (date) {
      conditions.push('DATE(appointment_date) = $' + (conditions.length + 1));
      params.push(date);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY appointment_id DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Get single appointment by ID
app.get('/api/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM appointments WHERE appointment_id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
});

// Create new appointment
app.post('/api/appointments', async (req, res) => {
  try {
    const { patient_id, doctor_id, appointment_date, time_slot, reason, notes } = req.body;

    // Validate required fields
    if (!patient_id || !doctor_id || !appointment_date || !time_slot) {
      return res.status(400).json({ 
        error: 'Missing required fields: patient_id, doctor_id, appointment_date, time_slot' 
      });
    }

    const status = 'SCHEDULED';
    const reschedule_count = 0;
    const created_at = new Date().toISOString();

    const result = await pool.query(
      `INSERT INTO appointments (patient_id, doctor_id, appointment_date, time_slot, status, reason, notes, reschedule_count, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [patient_id, doctor_id, appointment_date, time_slot, status, reason || null, notes || null, reschedule_count, created_at]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// Update appointment
app.put('/api/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { appointment_date, time_slot, status, reschedule_count } = req.body;

    let updateQuery = 'UPDATE appointments SET ';
    let updates = [];
    let params = [];
    let paramIndex = 1;

    if (appointment_date) {
      updates.push('appointment_date = $' + paramIndex);
      params.push(appointment_date);
      paramIndex++;
    }

    if (time_slot) {
      updates.push('time_slot = $' + paramIndex);
      params.push(time_slot);
      paramIndex++;
    }

    if (status) {
      updates.push('status = $' + paramIndex);
      params.push(status);
      paramIndex++;
    }

    if (reschedule_count !== undefined) {
      updates.push('reschedule_count = $' + paramIndex);
      params.push(reschedule_count);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateQuery += updates.join(', ') + ' WHERE appointment_id = $' + paramIndex + ' RETURNING *';
    params.push(id);

    const result = await pool.query(updateQuery, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// Cancel appointment
app.patch('/api/appointments/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellation_reason } = req.body;

    const result = await pool.query(
      `UPDATE appointments 
       SET status = $1, notes = $2
       WHERE appointment_id = $3
       RETURNING *`,
      ['CANCELLED', cancellation_reason || 'Cancelled by system', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

// Delete appointment
app.delete('/api/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM appointments WHERE appointment_id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({ message: 'Appointment deleted successfully', appointment: result.rows[0] });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

// Get available time slots for a doctor on a specific date
app.get('/api/appointments/slots/available', async (req, res) => {
  try {
    const { doctor_id, date } = req.query;

    if (!doctor_id || !date) {
      return res.status(400).json({ 
        error: 'Missing required query parameters: doctor_id, date' 
      });
    }

    // Standard time slots (every 30 minutes from 9 AM to 5 PM)
    const allSlots = [
      '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
      '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
      '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
    ];

    // Get booked slots for the doctor on that date
    const result = await pool.query(
      'SELECT DISTINCT time_slot FROM appointments WHERE doctor_id = $1 AND DATE(appointment_date) = $2 AND status != $3',
      [doctor_id, date, 'CANCELLED']
    );

    const bookedSlots = result.rows.map(row => row.time_slot);
    const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

    res.json(availableSlots);
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({ error: 'Failed to fetch available slots' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Appointment Service running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📅 Appointments API: http://localhost:${PORT}/api/appointments`);
});
