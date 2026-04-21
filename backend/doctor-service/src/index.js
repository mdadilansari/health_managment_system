const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'UP', 
    service: 'doctor-service',
    timestamp: new Date().toISOString()
  });
});

// Get all doctors (with optional department filter)
app.get('/api/doctors', async (req, res) => {
  try {
    const { department } = req.query;
    
    let query = 'SELECT * FROM doctors';
    let params = [];
    
    if (department) {
      query += ' WHERE department = $1';
      params.push(department);
    }
    
    query += ' ORDER BY doctor_id ASC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});

// Get unique departments
app.get('/api/doctors/departments', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT department FROM doctors ORDER BY department ASC'
    );
    res.json(result.rows.map(row => row.department));
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// Get single doctor by ID
app.get('/api/doctors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM doctors WHERE doctor_id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching doctor:', error);
    res.status(500).json({ error: 'Failed to fetch doctor' });
  }
});

// Create new doctor
app.post('/api/doctors', async (req, res) => {
  try {
    const { name, email, phone, department, specialization, qualification, experience_years, consultation_fee } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !department) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, email, phone, department' 
      });
    }

    const result = await pool.query(
      `INSERT INTO doctors (name, email, phone, department, specialization, qualification, experience_years, consultation_fee)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, email, phone, department, specialization || null, qualification || null, experience_years || 0, consultation_fee || 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating doctor:', error);
    res.status(500).json({ error: 'Failed to create doctor' });
  }
});

// Update doctor
app.put('/api/doctors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, department, specialization, qualification, experience_years, consultation_fee } = req.body;

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

    if (department !== undefined) {
      updates.push('department = $' + paramIndex);
      params.push(department);
      paramIndex++;
    }

    if (specialization !== undefined) {
      updates.push('specialization = $' + paramIndex);
      params.push(specialization);
      paramIndex++;
    }

    if (qualification !== undefined) {
      updates.push('qualification = $' + paramIndex);
      params.push(qualification);
      paramIndex++;
    }

    if (experience_years !== undefined) {
      updates.push('experience_years = $' + paramIndex);
      params.push(experience_years);
      paramIndex++;
    }

    if (consultation_fee !== undefined) {
      updates.push('consultation_fee = $' + paramIndex);
      params.push(consultation_fee);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    let updateQuery = 'UPDATE doctors SET ' + updates.join(', ') + ' WHERE doctor_id = $' + paramIndex + ' RETURNING *';
    params.push(id);

    const result = await pool.query(updateQuery, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating doctor:', error);
    res.status(500).json({ error: 'Failed to update doctor' });
  }
});

// Delete doctor
app.delete('/api/doctors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM doctors WHERE doctor_id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    res.json({ message: 'Doctor deleted successfully', doctor: result.rows[0] });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    res.status(500).json({ error: 'Failed to delete doctor' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Doctor Service running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`👨‍⚕️ Doctors API: http://localhost:${PORT}/api/doctors`);
});
