# Billing Service

Microservice for handling billing operations in the Hospital Management System.

## Features

- Create new bills with line items
- Retrieve all bills with filtering
- Retrieve bills by ID or patient ID
- Update bill status and payment information
- Delete bills
- Filter bills by status (PENDING, PAID, PARTIALLY_PAID, OVERDUE)

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file based on `.env.example`:

```env
PORT=3004
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hms_billing
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

### Get All Bills
```
GET /api/bills?[status=PENDING&patient_id=1]
```

### Get Bill by ID
```
GET /api/bills/:id
```

### Get Bills by Patient
```
GET /api/bills/patient/:patient_id
```

### Create Bill
```
POST /api/bills
Content-Type: application/json

{
  "patient_id": 1,
  "appointment_id": 125,
  "line_items": [
    {
      "description": "Consultation Fee",
      "quantity": 1,
      "unit_price": 500,
      "total": 500
    },
    {
      "description": "Lab Test - Blood",
      "quantity": 1,
      "unit_price": 800,
      "total": 800
    }
  ],
  "paid_amount": 0
}
```

### Update Bill
```
PATCH /api/bills/:id
Content-Type: application/json

{
  "paid_amount": 1300,
  "status": "PAID",
  "payment_method": "CARD"
}
```

### Delete Bill
```
DELETE /api/bills/:id
```

## Database Schema

```sql
CREATE TABLE IF NOT EXISTS bills (
  bill_id SERIAL PRIMARY KEY,
  patient_id INT NOT NULL,
  appointment_id INT,
  bill_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  line_items JSONB,
  total_amount DECIMAL(10, 2) NOT NULL,
  paid_amount DECIMAL(10, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'PENDING',
  payment_method VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
