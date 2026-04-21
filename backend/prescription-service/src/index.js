const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3006;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'UP', 
    service: 'prescription-service',
    timestamp: new Date().toISOString()
  });
});

// Get all prescriptions with optional filters
app.get('/api/prescriptions', async (req, res) => {
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
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
});

// Get single prescription by ID
app.get('/api/prescriptions/:id', async (req, res) => {
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
    console.error('Error fetching prescription:', error);
    res.status(500).json({ error: 'Failed to fetch prescription' });
  }
});

// Create new prescription
app.post('/api/prescriptions', async (req, res) => {
  try {
    const { patient_id, doctor_id, appointment_id, medications, instructions, follow_up_date } = req.body;

    // Validate required fields
    if (!patient_id || !doctor_id || !medications || !Array.isArray(medications)) {
      return res.status(400).json({ 
        error: 'Missing required fields: patient_id, doctor_id, medications (array)' 
      });
    }

    if (medications.length === 0) {
      return res.status(400).json({ 
        error: 'At least one medication is required' 
      });
    }

    const prescription_date = new Date().toISOString();

    const result = await pool.query(
      `INSERT INTO prescriptions (patient_id, doctor_id, appointment_id, prescription_date, medications, instructions, follow_up_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [patient_id, doctor_id, appointment_id || null, prescription_date, JSON.stringify(medications), instructions || null, follow_up_date || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating prescription:', error);
    res.status(500).json({ error: 'Failed to create prescription' });
  }
});

// Update prescription
app.put('/api/prescriptions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { medications, instructions, follow_up_date } = req.body;

    let updates = [];
    let params = [];
    let paramIndex = 1;

    if (medications) {
      updates.push('medications = $' + paramIndex);
      params.push(JSON.stringify(medications));
      paramIndex++;
    }

    if (instructions) {
      updates.push('instructions = $' + paramIndex);
      params.push(instructions);
      paramIndex++;
    }

    if (follow_up_date) {
      updates.push('follow_up_date = $' + paramIndex);
      params.push(follow_up_date);
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
    console.error('Error updating prescription:', error);
    res.status(500).json({ error: 'Failed to update prescription' });
  }
});

// Delete prescription
app.delete('/api/prescriptions/:id', async (req, res) => {
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
    console.error('Error deleting prescription:', error);
    res.status(500).json({ error: 'Failed to delete prescription' });
  }
});

// Get prescriptions by patient ID
app.get('/api/prescriptions/patient/:patient_id', async (req, res) => {
  try {
    const { patient_id } = req.params;
    const result = await pool.query(
      'SELECT * FROM prescriptions WHERE patient_id = $1 ORDER BY prescription_id DESC',
      [patient_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching patient prescriptions:', error);
    res.status(500).json({ error: 'Failed to fetch patient prescriptions' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Prescription Service running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`💊 Prescriptions API: http://localhost:${PORT}/api/prescriptions`);
});
