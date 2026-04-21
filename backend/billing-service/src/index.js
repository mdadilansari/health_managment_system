const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'UP', 
    service: 'billing-service',
    timestamp: new Date().toISOString()
  });
});

// Get all bills with optional status filter
app.get('/api/bills', async (req, res) => {
  try {
    const { status, patient_id } = req.query;
    
    let query = 'SELECT * FROM bills';
    let params = [];
    let conditions = [];

    if (status) {
      conditions.push('status = $' + (conditions.length + 1));
      params.push(status);
    }

    if (patient_id) {
      conditions.push('patient_id = $' + (conditions.length + 1));
      params.push(patient_id);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY bill_id DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({ error: 'Failed to fetch bills' });
  }
});

// Get single bill by ID
app.get('/api/bills/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM bills WHERE bill_id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching bill:', error);
    res.status(500).json({ error: 'Failed to fetch bill' });
  }
});

// Create new bill
app.post('/api/bills', async (req, res) => {
  try {
    const { patient_id, appointment_id, line_items, paid_amount = 0 } = req.body;

    // Validate required fields
    if (!patient_id || !line_items || !Array.isArray(line_items)) {
      return res.status(400).json({ 
        error: 'Missing required fields: patient_id, line_items (array)' 
      });
    }

    if (line_items.length === 0) {
      return res.status(400).json({ 
        error: 'At least one line item is required' 
      });
    }

    // Calculate total amount
    const total_amount = line_items.reduce((sum, item) => sum + (item.total || 0), 0);
    const bill_date = new Date().toISOString();
    const status = 'PENDING';

    const result = await pool.query(
      `INSERT INTO bills (patient_id, appointment_id, bill_date, line_items, total_amount, paid_amount, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [patient_id, appointment_id || null, bill_date, JSON.stringify(line_items), total_amount, paid_amount, status]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating bill:', error);
    res.status(500).json({ error: 'Failed to create bill' });
  }
});

// Update bill (status, paid amount)
app.patch('/api/bills/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { paid_amount, status, payment_method } = req.body;

    let updateQuery = 'UPDATE bills SET ';
    let updates = [];
    let params = [];
    let paramIndex = 1;

    if (paid_amount !== undefined) {
      updates.push('paid_amount = $' + paramIndex);
      params.push(paid_amount);
      paramIndex++;
    }

    if (status) {
      updates.push('status = $' + paramIndex);
      params.push(status);
      paramIndex++;
    }

    if (payment_method) {
      updates.push('payment_method = $' + paramIndex);
      params.push(payment_method);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateQuery += updates.join(', ') + ' WHERE bill_id = $' + paramIndex + ' RETURNING *';
    params.push(id);

    const result = await pool.query(updateQuery, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating bill:', error);
    res.status(500).json({ error: 'Failed to update bill' });
  }
});

// Delete bill
app.delete('/api/bills/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM bills WHERE bill_id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    res.json({ message: 'Bill deleted successfully', bill: result.rows[0] });
  } catch (error) {
    console.error('Error deleting bill:', error);
    res.status(500).json({ error: 'Failed to delete bill' });
  }
});

// Get bills by patient ID
app.get('/api/bills/patient/:patient_id', async (req, res) => {
  try {
    const { patient_id } = req.params;
    const result = await pool.query(
      'SELECT * FROM bills WHERE patient_id = $1 ORDER BY bill_id DESC',
      [patient_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching patient bills:', error);
    res.status(500).json({ error: 'Failed to fetch patient bills' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Billing Service running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`💰 Billing API: http://localhost:${PORT}/api/bills`);
});
