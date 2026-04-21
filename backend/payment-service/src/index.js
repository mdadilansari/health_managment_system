const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'UP', 
    service: 'payment-service',
    timestamp: new Date().toISOString()
  });
});

// Get all payments with optional filters
app.get('/api/payments', async (req, res) => {
  try {
    const { patient_id, bill_id } = req.query;
    
    let query = 'SELECT * FROM payments';
    let params = [];
    let conditions = [];

    if (patient_id) {
      conditions.push('patient_id = $' + (conditions.length + 1));
      params.push(patient_id);
    }

    if (bill_id) {
      conditions.push('bill_id = $' + (conditions.length + 1));
      params.push(bill_id);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY payment_id DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Get single payment by ID
app.get('/api/payments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM payments WHERE payment_id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

// Create new payment
app.post('/api/payments', async (req, res) => {
  try {
    const { bill_id, patient_id, amount, payment_method, transaction_id, notes } = req.body;

    // Validate required fields
    if (!bill_id || !patient_id || !amount || !payment_method) {
      return res.status(400).json({ 
        error: 'Missing required fields: bill_id, patient_id, amount, payment_method' 
      });
    }

    const payment_date = new Date().toISOString();
    
    const result = await pool.query(
      `INSERT INTO payments (bill_id, patient_id, amount, payment_date, payment_method, transaction_id, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [bill_id, patient_id, amount, payment_date, payment_method, transaction_id || null, notes || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// Update payment (mark as paid, update amount, etc.)
app.put('/api/payments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, payment_method, transaction_id, notes } = req.body;

    const result = await pool.query(
      `UPDATE payments 
       SET amount = COALESCE($1, amount),
           payment_method = COALESCE($2, payment_method),
           transaction_id = COALESCE($3, transaction_id),
           notes = COALESCE($4, notes)
       WHERE payment_id = $5
       RETURNING *`,
      [amount, payment_method, transaction_id, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ error: 'Failed to update payment' });
  }
});

// Delete payment
app.delete('/api/payments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM payments WHERE payment_id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({ message: 'Payment deleted successfully', payment: result.rows[0] });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ error: 'Failed to delete payment' });
  }
});

// Get payments by patient ID
app.get('/api/payments/patient/:patient_id', async (req, res) => {
  try {
    const { patient_id } = req.params;
    const result = await pool.query(
      'SELECT * FROM payments WHERE patient_id = $1 ORDER BY payment_id DESC',
      [patient_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching patient payments:', error);
    res.status(500).json({ error: 'Failed to fetch patient payments' });
  }
});

// Get payments by bill ID
app.get('/api/payments/bill/:bill_id', async (req, res) => {
  try {
    const { bill_id } = req.params;
    const result = await pool.query(
      'SELECT * FROM payments WHERE bill_id = $1 ORDER BY payment_id DESC',
      [bill_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching bill payments:', error);
    res.status(500).json({ error: 'Failed to fetch bill payments' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Payment Service running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`💳 Payments API: http://localhost:${PORT}/api/payments`);
});
