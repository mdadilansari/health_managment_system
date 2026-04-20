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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Doctor Service running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`👨‍⚕️ Doctors API: http://localhost:${PORT}/api/doctors`);
});
