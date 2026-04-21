# API Testing Guide

## Quick Test Commands

### 1. Patient Service (Port 3001)

```bash
# Check health
curl http://localhost:3001/health

# Get all patients
curl http://localhost:3001/api/patients

# Get single patient
curl http://localhost:3001/api/patients/1

# Create patient
curl -X POST http://localhost:3001/api/patients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane.smith@example.com",
    "phone": "9876543210",
    "dob": "1990-05-15",
    "gender": "Female",
    "address": "456 Oak Ave, City"
  }'

# Update patient
curl -X PUT http://localhost:3001/api/patients/1 \
  -H "Content-Type: application/json" \
  -d '{"phone": "9999999999"}'

# Delete patient
curl -X DELETE http://localhost:3001/api/patients/1
```

---

### 2. Doctor Service (Port 3002)

```bash
# Check health
curl http://localhost:3002/health

# Get all doctors
curl http://localhost:3002/api/doctors

# Get doctors by department
curl "http://localhost:3002/api/doctors?department=Cardiology"

# Get single doctor
curl http://localhost:3002/api/doctors/1

# Get all departments
curl http://localhost:3002/api/doctors/departments

# Create doctor
curl -X POST http://localhost:3002/api/doctors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Robert Johnson",
    "email": "robert.j@hms.com",
    "phone": "8765432100",
    "department": "Surgery",
    "specialization": "General Surgery",
    "qualification": "MD",
    "experience_years": 12,
    "consultation_fee": 800
  }'

# Update doctor
curl -X PUT http://localhost:3002/api/doctors/1 \
  -H "Content-Type: application/json" \
  -d '{"consultation_fee": 900}'

# Delete doctor
curl -X DELETE http://localhost:3002/api/doctors/1
```

---

### 3. Appointment Service (Port 3003)

```bash
# Check health
curl http://localhost:3003/health

# Get all appointments
curl http://localhost:3003/api/appointments

# Get appointments by status
curl "http://localhost:3003/api/appointments?status=SCHEDULED"

# Get appointments for specific doctor
curl "http://localhost:3003/api/appointments?doctor_id=5"

# Get appointments for specific patient
curl "http://localhost:3003/api/appointments?patient_id=1"

# Get single appointment
curl http://localhost:3003/api/appointments/1

# Get available slots for doctor
curl "http://localhost:3003/api/appointments/slots/available?doctor_id=5&date=2026-04-25"

# Create appointment
curl -X POST http://localhost:3003/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": 1,
    "doctor_id": 5,
    "appointment_date": "2026-04-25T10:00:00Z",
    "time_slot": "10:00 AM",
    "reason": "Regular checkup",
    "notes": "Patient needs blood test"
  }'

# Update appointment
curl -X PUT http://localhost:3003/api/appointments/1 \
  -H "Content-Type: application/json" \
  -d '{
    "appointment_date": "2026-04-26T10:00:00Z",
    "time_slot": "10:30 AM",
    "status": "RESCHEDULED"
  }'

# Cancel appointment
curl -X PATCH http://localhost:3003/api/appointments/1/cancel \
  -H "Content-Type: application/json" \
  -d '{"cancellation_reason": "Patient requested to cancel"}'

# Delete appointment
curl -X DELETE http://localhost:3003/api/appointments/1
```

---

### 4. Billing Service (Port 3004)

```bash
# Check health
curl http://localhost:3004/health

# Get all bills
curl http://localhost:3004/api/bills

# Get bills by status
curl "http://localhost:3004/api/bills?status=PENDING"

# Get patient bills
curl http://localhost:3004/api/bills/patient/1

# Get single bill
curl http://localhost:3004/api/bills/1

# Create bill
curl -X POST http://localhost:3004/api/bills \
  -H "Content-Type: application/json" \
  -d '{
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
  }'

# Update bill (mark as paid)
curl -X PATCH http://localhost:3004/api/bills/1 \
  -H "Content-Type: application/json" \
  -d '{
    "paid_amount": 1300,
    "status": "PAID",
    "payment_method": "CARD"
  }'

# Delete bill
curl -X DELETE http://localhost:3004/api/bills/1
```

---

### 5. Payment Service (Port 3005)

```bash
# Check health
curl http://localhost:3005/health

# Get all payments
curl http://localhost:3005/api/payments

# Get patient payments
curl http://localhost:3005/api/payments/patient/1

# Get bill payments
curl http://localhost:3005/api/payments/bill/1

# Get single payment
curl http://localhost:3005/api/payments/1

# Create payment
curl -X POST http://localhost:3005/api/payments \
  -H "Content-Type: application/json" \
  -d '{
    "bill_id": 1,
    "patient_id": 1,
    "amount": 5000,
    "payment_method": "CARD",
    "transaction_id": "TXN123456789",
    "notes": "Paid via Visa card"
  }'

# Update payment
curl -X PUT http://localhost:3005/api/payments/1 \
  -H "Content-Type: application/json" \
  -d '{"amount": 5500}'

# Delete payment
curl -X DELETE http://localhost:3005/api/payments/1
```

---

### 6. Prescription Service (Port 3006)

```bash
# Check health
curl http://localhost:3006/health

# Get all prescriptions
curl http://localhost:3006/api/prescriptions

# Get patient prescriptions
curl http://localhost:3006/api/prescriptions/patient/1

# Get single prescription
curl http://localhost:3006/api/prescriptions/1

# Create prescription
curl -X POST http://localhost:3006/api/prescriptions \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": 1,
    "doctor_id": 5,
    "appointment_id": 125,
    "medications": [
      {
        "name": "Paracetamol",
        "dosage": "500mg",
        "frequency": "Twice daily",
        "duration": "5 days"
      },
      {
        "name": "Amoxicillin",
        "dosage": "250mg",
        "frequency": "Three times daily",
        "duration": "7 days"
      }
    ],
    "instructions": "Take after meals",
    "follow_up_date": "2026-05-01"
  }'

# Update prescription
curl -X PUT http://localhost:3006/api/prescriptions/1 \
  -H "Content-Type: application/json" \
  -d '{
    "instructions": "Take with water after meals"
  }'

# Delete prescription
curl -X DELETE http://localhost:3006/api/prescriptions/1
```

---

## Using Postman

### Import Collection

1. Open Postman
2. Click **Import** 
3. Select **Link** tab
4. Paste this raw collection (or create manually):

```json
{
  "info": {
    "name": "HMS API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Patient Service",
      "item": [
        {
          "name": "Get All Patients",
          "request": {
            "method": "GET",
            "url": "http://localhost:3001/api/patients"
          }
        }
      ]
    }
  ]
}
```

Or manually create requests:
- **GET** `http://localhost:3001/api/patients`
- **POST** `http://localhost:3001/api/patients` with JSON body
- **PUT** `http://localhost:3001/api/patients/1` with JSON body
- **DELETE** `http://localhost:3001/api/patients/1`

---

## Using Thunder Client (VS Code)

1. Install Thunder Client extension
2. Create requests:
   - Method: GET/POST/PUT/DELETE
   - URL: `http://localhost:3001/api/patients`
   - Body (for POST/PUT): JSON format
   - Headers: Set `Content-Type: application/json`

---

## Expected Responses

### Success Response
```json
{
  "patient_id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "dob": "1990-01-01",
  "gender": "Male",
  "address": "123 Main St",
  "created_at": "2026-04-21T10:00:00.000Z"
}
```

### Error Response
```json
{
  "error": "Patient not found"
}
```

or

```json
{
  "error": "Missing required fields: name, email, phone"
}
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid input |
| 404 | Not Found - Resource doesn't exist |
| 500 | Server Error - Internal issue |

---

## Tips for Testing

1. **Always check service is running** - Use `/health` endpoint first
2. **Check response codes** - 200 = OK, 201 = Created, 404 = Not Found
3. **Validate JSON** - Use https://jsonlint.com/ if errors
4. **Check database directly** - `psql -U postgres -d hms_patients -c "SELECT * FROM patients;"`
5. **Check logs** - Terminal where service is running for errors
6. **Test in order** - Create before updating/deleting

---

**Happy Testing!** 🎉
