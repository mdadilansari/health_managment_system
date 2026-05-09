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

// Update bill status (guarded — cannot edit PAID or VOID)
app.patch('/api/bills/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const existing = await pool.query('SELECT * FROM bills WHERE bill_id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Bill not found' });

    const bill = existing.rows[0];
    if (['PAID', 'VOID'].includes(bill.status)) {
      return res.status(400).json({ error: `Cannot modify a bill with status: ${bill.status}` });
    }

    if (!status) return res.status(400).json({ error: 'No fields to update' });

    const result = await pool.query(
      'UPDATE bills SET status = $1 WHERE bill_id = $2 RETURNING *',
      [status, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating bill:', error);
    res.status(500).json({ error: 'Failed to update bill' });
  }
});

// Pay a bill — marks it PAID, idempotent
app.patch('/api/bills/:id/pay', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query('SELECT * FROM bills WHERE bill_id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Bill not found' });

    const bill = existing.rows[0];
    if (bill.status === 'PAID') return res.status(200).json({ message: 'Bill already paid', bill });
    if (bill.status === 'VOID') return res.status(400).json({ error: 'Cannot pay a voided bill' });

    const result = await pool.query(
      "UPDATE bills SET status = 'PAID' WHERE bill_id = $1 RETURNING *",
      [id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error paying bill:', error);
    res.status(500).json({ error: 'Failed to pay bill' });
  }
});

// Void a bill
app.patch('/api/bills/:id/void', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query('SELECT * FROM bills WHERE bill_id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Bill not found' });

    const bill = existing.rows[0];
    if (bill.status === 'PAID') return res.status(400).json({ error: 'Cannot void a paid bill' });
    if (bill.status === 'VOID') return res.status(200).json({ message: 'Bill already voided', bill });

    const result = await pool.query(
      "UPDATE bills SET status = 'VOID' WHERE bill_id = $1 RETURNING *",
      [id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error voiding bill:', error);
    res.status(500).json({ error: 'Failed to void bill' });
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

// Internal endpoint — called by other services via EventBus (not exposed to frontend)
// To migrate to RabbitMQ: remove this endpoint, replace with a queue consumer
app.post('/api/bills/internal', async (req, res) => {
  try {
    const { appointment_id, patient_id, bill_type } = req.body;

    if (!appointment_id || !patient_id) {
      return res.status(400).json({ error: 'Missing required fields: appointment_id, patient_id' });
    }

    // Idempotency — don't create duplicate bills for the same appointment + type
    const existing = await pool.query(
      'SELECT bill_id FROM bills WHERE appointment_id = $1 AND status != $2',
      [appointment_id, 'VOID']
    );
    if (existing.rows.length > 0) {
      return res.status(200).json({ message: 'Bill already exists', bill_id: existing.rows[0].bill_id });
    }

    // Base amounts per bill type (configurable)
    const BASE_AMOUNTS = {
      CONSULTATION: 500,
      NO_SHOW_FEE:  200,
    };
    const TAX_RATE = 0.05; // 5% as per problem statement

    const base   = BASE_AMOUNTS[bill_type] || BASE_AMOUNTS.CONSULTATION;
    const tax    = parseFloat((base * TAX_RATE).toFixed(2));
    const amount = parseFloat((base + tax).toFixed(2));

    const result = await pool.query(
      `INSERT INTO bills (appointment_id, patient_id, amount, status, created_at)
       VALUES ($1, $2, $3, 'OPEN', NOW())
       RETURNING *`,
      [appointment_id, patient_id, amount]
    );

    console.log(`[BillingService] Bill #${result.rows[0].bill_id} created for appointment ${appointment_id} (${bill_type}, ₹${amount})`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating internal bill:', error);
    res.status(500).json({ error: 'Failed to create bill' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Billing Service running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`💰 Billing API: http://localhost:${PORT}/api/bills`);
});
