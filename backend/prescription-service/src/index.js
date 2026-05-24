const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');
const logger = require('./middleware/logger');
const { errorHandler } = require('./middleware/errorHandler');
const { register, metricsMiddleware } = require('./middleware/metrics');

const app = express();
const PORT = process.env.PORT || 3006;

// Middleware
app.use(cors());
app.use(express.json());

// Attach correlation ID to every request
app.use((req, _res, next) => {
  const { randomUUID } = require('crypto');
  req.correlationId = req.headers['x-correlation-id'] || randomUUID();
  next();
});

// Prometheus metrics middleware
app.use(metricsMiddleware('prescription-service'));

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'UP', 
    service: 'prescription-service',
    timestamp: new Date().toISOString()
  });
});

// Get all prescriptions with optional filters
app.get('/v1/prescriptions', async (req, res) => {
  try {
    const { patient_id, doctor_id, appointment_id } = req.query;
    
    let query = 'SELECT * FROM prescriptions';
    let params = [];
    let conditions = [];

    if (patient_id) {
      conditions.push('patient_id = $' + (conditions.length + 1));
      params.push(patient_id);
    }

    if (doctor_id) {
      conditions.push('doctor_id = $' + (conditions.length + 1));
      params.push(doctor_id);
    }

    if (appointment_id) {
      conditions.push('appointment_id = $' + (conditions.length + 1));
      params.push(appointment_id);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY prescription_id DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching prescriptions:', error);
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
});

// Get single prescription by ID
app.get('/v1/prescriptions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM prescriptions WHERE prescription_id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prescription not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error fetching prescription:', error);
    res.status(500).json({ error: 'Failed to fetch prescription' });
  }
});

// Create new prescription
app.post('/v1/prescriptions', async (req, res) => {
  try {
    const { patient_id, doctor_id, appointment_id, medication, dosage, days } = req.body;

    // Validate required fields
    if (!patient_id || !doctor_id || !appointment_id || !medication || !dosage || !days) {
      return res.status(400).json({ 
        error: 'Missing required fields: patient_id, doctor_id, appointment_id, medication, dosage, days' 
      });
    }

    const result = await pool.query(
      `INSERT INTO prescriptions (appointment_id, patient_id, doctor_id, medication, dosage, days, issued_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [appointment_id, patient_id, doctor_id, medication, dosage, days]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error creating prescription:', error);
    res.status(500).json({ error: 'Failed to create prescription' });
  }
});

// Update prescription
app.put('/v1/prescriptions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { medication, dosage, days } = req.body;

    let updates = [];
    let params = [];
    let paramIndex = 1;

    if (medication) {
      updates.push('medication = $' + paramIndex);
      params.push(medication);
      paramIndex++;
    }

    if (dosage) {
      updates.push('dosage = $' + paramIndex);
      params.push(dosage);
      paramIndex++;
    }

    if (days) {
      updates.push('days = $' + paramIndex);
      params.push(days);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    let updateQuery = 'UPDATE prescriptions SET ' + updates.join(', ') + ' WHERE prescription_id = $' + paramIndex + ' RETURNING *';
    params.push(id);

    const result = await pool.query(updateQuery, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error updating prescription:', error);
    res.status(500).json({ error: 'Failed to update prescription' });
  }
});

// Delete prescription
app.delete('/v1/prescriptions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM prescriptions WHERE prescription_id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    res.json({ message: 'Prescription deleted successfully', prescription: result.rows[0] });
  } catch (error) {
    logger.error('Error deleting prescription:', error);
    res.status(500).json({ error: 'Failed to delete prescription' });
  }
});

// Get prescriptions by patient ID
app.get('/v1/prescriptions/patient/:patient_id', async (req, res) => {
  try {
    const { patient_id } = req.params;
    const result = await pool.query(
      'SELECT * FROM prescriptions WHERE patient_id = $1 ORDER BY prescription_id DESC',
      [patient_id]
    );
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching patient prescriptions:', error);
    res.status(500).json({ error: 'Failed to fetch patient prescriptions' });
  }
});

// Error handler (must be last middleware)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`ðŸš€ Prescription Service running on http://localhost:${PORT}`);
  logger.info(`ðŸ“Š Health check: http://localhost:${PORT}/health`);
  logger.info(`ðŸ’Š Prescriptions API: http://localhost:${PORT}/api/prescriptions`);
});


