const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');
const logger = require('./middleware/logger');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Attach correlation ID to every request
app.use((req, _res, next) => {
  const { randomUUID } = require('crypto');
  req.correlationId = req.headers['x-correlation-id'] || randomUUID();
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'UP', 
    service: 'patient-service',
    timestamp: new Date().toISOString()
  });
});

// Get all patients
app.get('/v1/patients', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM patients ORDER BY patient_id ASC'
    );
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// Get single patient by ID
app.get('/v1/patients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM patients WHERE patient_id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error fetching patient:', error);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

// Create new patient
app.post('/v1/patients', async (req, res) => {
  try {
    const { name, email, phone, dob, gender, address } = req.body;

    // Validate required fields
    if (!name || !email || !phone) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, email, phone' 
      });
    }

    const created_at = new Date().toISOString();

    const result = await pool.query(
      `INSERT INTO patients (name, email, phone, dob, gender, address, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, email, phone, dob || null, gender || null, address || null, created_at]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error creating patient:', error);
    res.status(500).json({ error: 'Failed to create patient' });
  }
});

// Update patient
app.put('/v1/patients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, dob, gender, address } = req.body;

    let updates = [];
    let params = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push('name = $' + paramIndex);
      params.push(name);
      paramIndex++;
    }

    if (email !== undefined) {
      updates.push('email = $' + paramIndex);
      params.push(email);
      paramIndex++;
    }

    if (phone !== undefined) {
      updates.push('phone = $' + paramIndex);
      params.push(phone);
      paramIndex++;
    }

    if (dob !== undefined) {
      updates.push('dob = $' + paramIndex);
      params.push(dob);
      paramIndex++;
    }

    if (gender !== undefined) {
      updates.push('gender = $' + paramIndex);
      params.push(gender);
      paramIndex++;
    }

    if (address !== undefined) {
      updates.push('address = $' + paramIndex);
      params.push(address);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    let updateQuery = 'UPDATE patients SET ' + updates.join(', ') + ' WHERE patient_id = $' + paramIndex + ' RETURNING *';
    params.push(id);

    const result = await pool.query(updateQuery, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error updating patient:', error);
    res.status(500).json({ error: 'Failed to update patient' });
  }
});

// Delete patient
app.delete('/v1/patients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM patients WHERE patient_id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json({ message: 'Patient deleted successfully', patient: result.rows[0] });
  } catch (error) {
    logger.error('Error deleting patient:', error);
    res.status(500).json({ error: 'Failed to delete patient' });
  }
});

// Error handler (must be last middleware)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`ðŸš€ Patient Service running on http://localhost:${PORT}`);
  logger.info(`ðŸ“Š Health check: http://localhost:${PORT}/health`);
  logger.info(`ðŸ‘¥ Patients API: http://localhost:${PORT}/api/patients`);
});

