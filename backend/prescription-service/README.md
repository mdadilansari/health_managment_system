# Prescription Service

Microservice for handling prescription operations in the Hospital Management System.

## Features

- Create new prescriptions with medications
- Retrieve all prescriptions with filtering
- Retrieve prescriptions by ID or patient ID
- Update prescription information
- Delete prescriptions
- Filter prescriptions by patient ID, doctor ID, or appointment ID

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file based on `.env.example`:

```env
PORT=3006
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hms_prescriptions
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

### Get All Prescriptions
```
GET /api/prescriptions?[patient_id=1&doctor_id=5&appointment_id=125]
```

### Get Prescription by ID
```
GET /api/prescriptions/:id
```

### Get Prescriptions by Patient
```
GET /api/prescriptions/patient/:patient_id
```

### Create Prescription
```
POST /api/prescriptions
Content-Type: application/json

{
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
}
```

### Update Prescription
```
PUT /api/prescriptions/:id
Content-Type: application/json

{
  "medications": [...],
  "instructions": "Updated instructions",
  "follow_up_date": "2026-05-05"
}
```

### Delete Prescription
```
DELETE /api/prescriptions/:id
```

## Database Schema

```sql
CREATE TABLE IF NOT EXISTS prescriptions (
  prescription_id SERIAL PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  appointment_id INT,
  prescription_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  medications JSONB,
  instructions TEXT,
  follow_up_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
