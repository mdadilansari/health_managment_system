# Payment Service

Microservice for handling payment operations in the Hospital Management System.

## Features

- Create new payments
- Retrieve all payments with filtering
- Retrieve payments by ID, patient ID, or bill ID
- Update payment information
- Delete payments
- Filter payments by patient or bill

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file based on `.env.example`:

```env
PORT=3005
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hms_payments
DB_USER=postgres
DB_PASSWORD=postgres
```

## Running

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

## API Endpoints

### Get All Payments
```
GET /api/payments?[patient_id=1&bill_id=5]
```

### Get Payment by ID
```
GET /api/payments/:id
```

### Get Payments by Patient
```
GET /api/payments/patient/:patient_id
```

### Get Payments by Bill
```
GET /api/payments/bill/:bill_id
```

### Create Payment
```
POST /api/payments
Content-Type: application/json

{
  "bill_id": 1,
  "patient_id": 1,
  "amount": 5000,
  "payment_method": "CARD",
  "transaction_id": "TXN123456789",
  "notes": "Paid via Visa card"
}
```

### Update Payment
```
PUT /api/payments/:id
Content-Type: application/json

{
  "amount": 5500,
  "payment_method": "UPI",
  "transaction_id": "TXN987654321",
  "notes": "Updated payment"
}
```

### Delete Payment
```
DELETE /api/payments/:id
```

## Database Schema

```sql
CREATE TABLE IF NOT EXISTS payments (
  payment_id SERIAL PRIMARY KEY,
  bill_id INT NOT NULL,
  patient_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  payment_method VARCHAR(50) NOT NULL,
  transaction_id VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
