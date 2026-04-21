# Appointment Service

Microservice for handling appointment operations in the Hospital Management System.

## Features

- Create new appointments
- Retrieve all appointments with filtering
- Retrieve appointments by ID
- Update appointment information and status
- Cancel appointments
- Delete appointments
- Get available time slots for a doctor on a specific date
- Filter appointments by status, doctor, patient, or date

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file based on `.env.example`:

```env
PORT=3003
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hms_appointment
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

### Get All Appointments
```
GET /api/appointments?[status=SCHEDULED&doctor_id=5&patient_id=1&date=2026-04-25]
```

### Get Appointment by ID
```
GET /api/appointments/:id
```

### Create Appointment
```
POST /api/appointments
Content-Type: application/json

{
  "patient_id": 1,
  "doctor_id": 5,
  "appointment_date": "2026-04-25T10:00:00Z",
  "time_slot": "10:00 AM",
  "reason": "Regular checkup",
  "notes": "Patient has history of hypertension"
}
```

### Update Appointment
```
PUT /api/appointments/:id
Content-Type: application/json

{
  "appointment_date": "2026-04-26T10:00:00Z",
  "time_slot": "10:30 AM",
  "status": "RESCHEDULED",
  "reschedule_count": 1
}
```

### Cancel Appointment
```
PATCH /api/appointments/:id/cancel
Content-Type: application/json

{
  "cancellation_reason": "Patient unavailable"
}
```

### Delete Appointment
```
DELETE /api/appointments/:id
```

### Get Available Slots
```
GET /api/appointments/slots/available?doctor_id=5&date=2026-04-25
```

Response:
```json
[
  "09:00 AM",
  "09:30 AM",
  "10:00 AM",
  ...
]
```

## Database Schema

```sql
CREATE TABLE IF NOT EXISTS appointments (
  appointment_id SERIAL PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  appointment_date TIMESTAMP NOT NULL,
  time_slot VARCHAR(20),
  status VARCHAR(50) DEFAULT 'SCHEDULED',
  reason TEXT,
  notes TEXT,
  reschedule_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
