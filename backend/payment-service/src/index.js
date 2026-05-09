const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');
const logger = require('./middleware/logger');
const { errorHandler } = require('./middleware/errorHandler');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3005;
const BILLING_SERVICE_URL      = process.env.BILLING_SERVICE_URL      || 'http://localhost:3004/v1';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3007/v1';

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
    service: 'payment-service',
    timestamp: new Date().toISOString()
  });
});

// Get all payments with optional filters
app.get('/v1/payments', async (req, res) => {
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
    logger.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Get single payment by ID
app.get('/v1/payments/:id', async (req, res) => {
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
    logger.error('Error fetching payment:', error);
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

// Create new payment (idempotent via Idempotency-Key header)
app.post('/v1/payments', async (req, res) => {
  try {
    const { bill_id, patient_id, amount, method, reference, notes } = req.body;
    const idempotencyKey = req.headers['idempotency-key'];

    if (!bill_id || !amount || !method) {
      return res.status(400).json({
        error: 'Missing required fields: bill_id, amount, method'
      });
    }

    // Idempotency â€” if same key seen before, return existing payment
    if (idempotencyKey) {
      const existing = await pool.query(
        'SELECT * FROM payments WHERE reference = $1',
        [idempotencyKey]
      );
      if (existing.rows.length > 0) {
        return res.status(200).json({ ...existing.rows[0], _idempotent: true });
      }
    }

    const ref = idempotencyKey || reference || `HMS${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const result = await pool.query(
      `INSERT INTO payments (bill_id, amount, method, reference, paid_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [bill_id, amount, method, ref]
    );

    const payment = result.rows[0];

    // Mark bill as PAID (fire-and-forget)
    try {
      await axios.patch(`${BILLING_SERVICE_URL}/bills/${bill_id}/pay`, {}, { timeout: 3000 });
      logger.info(`[PaymentService] Bill #${bill_id} marked as PAID`);
    } catch (err) {
      logger.error(`[PaymentService] Failed to mark bill #${bill_id} as paid:`, err.message);
    }

    // Send payment notification (fire-and-forget)
    try {
      await axios.post(`${NOTIFICATION_SERVICE_URL}/notifications`, {
        type: 'PAYMENT_RECEIVED',
        title: 'Payment Received',
        message: `Payment of â‚¹${amount} received for Bill #${bill_id}. Reference: ${ref}`,
        metadata: { bill_id, payment_id: payment.payment_id }
      }, { timeout: 3000 });
    } catch (err) {
      logger.error('[PaymentService] Failed to send notification:', err.message);
    }

    res.status(201).json(payment);
  } catch (error) {
    logger.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// Update payment (mark as paid, update amount, etc.)
app.put('/v1/payments/:id', async (req, res) => {
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
    logger.error('Error updating payment:', error);
    res.status(500).json({ error: 'Failed to update payment' });
  }
});

// Delete payment
app.delete('/v1/payments/:id', async (req, res) => {
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
    logger.error('Error deleting payment:', error);
    res.status(500).json({ error: 'Failed to delete payment' });
  }
});

// Get payments by patient ID
app.get('/v1/payments/patient/:patient_id', async (req, res) => {
  try {
    const { patient_id } = req.params;
    const result = await pool.query(
      'SELECT * FROM payments WHERE patient_id = $1 ORDER BY payment_id DESC',
      [patient_id]
    );
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching patient payments:', error);
    res.status(500).json({ error: 'Failed to fetch patient payments' });
  }
});

// Get payments by bill ID
app.get('/v1/payments/bill/:bill_id', async (req, res) => {
  try {
    const { bill_id } = req.params;
    const result = await pool.query(
      'SELECT * FROM payments WHERE bill_id = $1 ORDER BY payment_id DESC',
      [bill_id]
    );
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching bill payments:', error);
    res.status(500).json({ error: 'Failed to fetch bill payments' });
  }
});

// Error handler (must be last middleware)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`ðŸš€ Payment Service running on http://localhost:${PORT}`);
  logger.info(`ðŸ“Š Health check: http://localhost:${PORT}/health`);
  logger.info(`ðŸ’³ Payments API: http://localhost:${PORT}/v1/payments`);
});


