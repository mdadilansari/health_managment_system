# Hospital Management System - Quick Start Guide

Microservices-based HMS with Angular frontend and Node.js backend.

## Current Status

✅ **Patient Service** - Backend API + Frontend (Port 3001)  
✅ **Doctor Service** - Backend API + Frontend (Port 3002)  
✅ **Dashboard** - Navigation hub for all services  
✅ **Database** - PostgreSQL with 6 databases setup

## Quick Start

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (with data already imported)
- Angular CLI: `npm install -g @angular/cli`

---

### Step 1: Start Patient Service

Terminal 1:
```bash
cd backend/patient-service
npm install
# Update .env with your PostgreSQL password if needed
npm run dev
```

Expected output:
```
🚀 Patient Service running on http://localhost:3001
✓ Connected to PostgreSQL database: hms_patients
```

---

### Step 2: Start Doctor Service

Terminal 2:
```bash
cd backend/doctor-service
npm install
# Update .env with your PostgreSQL password if needed
npm run dev
```

Expected output:
```
🚀 Doctor Service running on http://localhost:3002
✓ Connected to PostgreSQL database: hms_doctors
```

---

### Step 3: Start Frontend

Terminal 3:
```bash
cd frontend
npm install
ng serve
```

---

### Step 4: Open Application

Browser: **http://localhost:4200**

You should see:
- 🏠 **Dashboard** - Navigation hub with service cards
- 👥 **Patients** - List of 60 patients (click card or nav link)
- 👨‍⚕️ **Doctors** - List of 25 doctors with department filter

---

## Features Implemented

### ✅ Dashboard
- Navigation cards for all services
- Quick statistics
- Visual service status (active/coming soon)

### ✅ Patient Service
- View all patients (60 records)
- Beautiful table with avatars
- Clickable email/phone links
- Responsive design

### ✅ Doctor Service  
- View all doctors (25 records)
- **Filter by department** (Cardiology, Pediatrics, etc.)
- Department badges
- Responsive table

---

## API Endpoints

### Patient Service (Port 3001)
- `GET /health` - Service health check
- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get patient by ID

### Doctor Service (Port 3002)
- `GET /health` - Service health check
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors?department=Cardiology` - Filter by department
- `GET /api/doctors/departments` - Get unique departments
- `GET /api/doctors/:id` - Get doctor by ID

---

## What's Next?

### Immediate Next Steps (Recommended Order):

**1. Appointment Service** (3-4 hours)
- Port 3003
- Book appointments (patient + doctor + time slot)
- View appointments list
- Reschedule/Cancel functionality

**2. Billing Service** (2 hours)
- Port 3004
- Generate bills for completed appointments
- View bill history

**3. Payment Service** (2 hours)
- Port 3005
- Process payments
- Link to billing service

**4. Prescription Service** (1 hour)
- Port 3006
- Create prescriptions
- Link to appointments

---

## Project Structure

```
HMS final sem/
├── backend/
│   ├── patient-service/          (Port 3001)
│   │   ├── src/
│   │   │   ├── db.js
│   │   │   └── index.js
│   │   ├── .env
│   │   └── package.json
│   │
│   └── doctor-service/           (Port 3002)
│       ├── src/
│       │   ├── db.js
│       │   └── index.js
│       ├── .env
│       └── package.json
│
├── frontend/                     (Port 4200)
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── patient-list/
│   │   │   │   └── doctor-list/
│   │   │   ├── services/
│   │   │   │   ├── patient.service.ts
│   │   │   │   └── doctor.service.ts
│   │   │   └── models/
│   │   │       ├── patient.model.ts
│   │   │       └── doctor.model.ts
│   │   └── environments/
│   └── package.json
│
└── Data/                         (CSV - already imported to PostgreSQL)
```

---

## Testing Commands

### Backend Health Checks
```bash
# Patient Service
curl http://localhost:3001/health
curl http://localhost:3001/api/patients

# Doctor Service  
curl http://localhost:3002/health
curl http://localhost:3002/api/doctors
curl http://localhost:3002/api/doctors?department=Cardiology
curl http://localhost:3002/api/doctors/departments
```

---

## Troubleshooting

**Services won't start:**
- Check PostgreSQL is running
- Verify database names (`hms_patients`, `hms_doctors`)
- Update password in each service's `.env` file

**Frontend errors:**
- Ensure both backend services are running
- Check browser console (F12) for errors
- Verify ports 3001 and 3002 are not in use

**No data showing:**
- Open browser console to see API responses
- Check if you get data at `localhost:3001/api/patients` directly
- Verify CSV data was imported to PostgreSQL databases

### Patient Service (http://localhost:3001)

- `GET /health` - Health check
- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get single patient

## Testing Commands

```bash
# Test health
curl http://localhost:3001/health

# Get all patients
curl http://localhost:3001/api/patients

# Get specific patient
curl http://localhost:3001/api/patients/P001
```
