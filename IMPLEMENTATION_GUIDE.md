# HMS Backend Implementation Guide

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- PostgreSQL (v12+)
- npm

### Database Setup

All databases should already exist:
- `hms_patients` (port 5432)
- `hms_doctors`
- `hms_appointment`
- `hms_billing`
- `hms_payments`
- `hms_prescriptions`

---

## 📦 Microservices Overview

| Service | Port | Database | Status |
|---------|------|----------|--------|
| Patient Service | 3001 | hms_patients | ✅ CRUD Ready |
| Doctor Service | 3002 | hms_doctors | ✅ CRUD Ready |
| Appointment Service | 3003 | hms_appointment | ✅ Implemented |
| Billing Service | 3004 | hms_billing | ✅ Implemented |
| Payment Service | 3005 | hms_payments | ✅ Implemented |
| Prescription Service | 3006 | hms_prescriptions | ✅ Implemented |
| Notification Service | 3007 | hms_notifications | ⏳ TODO |

---

## 📥 Installation & Setup

### 1. Patient Service (Port 3001)
```bash
cd backend/patient-service
npm install
npm run dev
```

**Configuration** (`.env`):
```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hms_patients
DB_USER=postgres
DB_PASSWORD=postgres
```

**Endpoints**:
- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get patient by ID
- `POST /api/patients` - Create patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

---

### 2. Doctor Service (Port 3002)
```bash
cd backend/doctor-service
npm install
npm run dev
```

**Configuration** (`.env`):
```env
PORT=3002
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hms_doctors
DB_USER=postgres
DB_PASSWORD=postgres
```

**Endpoints**:
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors?department=Cardiology` - Filter by department
- `GET /api/doctors/:id` - Get doctor by ID
- `GET /api/doctors/departments` - Get all departments
- `POST /api/doctors` - Create doctor
- `PUT /api/doctors/:id` - Update doctor
- `DELETE /api/doctors/:id` - Delete doctor

---

### 3. Appointment Service (Port 3003)
```bash
cd backend/appointment-service
npm install
npm run dev
```

**Configuration** (`.env`):
```env
PORT=3003
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hms_appointment
DB_USER=postgres
DB_PASSWORD=postgres
```

**Key Features**:
- Book appointments with conflict detection
- Get available time slots for doctors
- Cancel and reschedule appointments
- Filter by status (SCHEDULED, COMPLETED, CANCELLED, etc.)

**Endpoints**:
- `GET /api/appointments` - Get all appointments
- `GET /api/appointments?status=SCHEDULED&doctor_id=5` - Filter appointments
- `GET /api/appointments/:id` - Get appointment by ID
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `PATCH /api/appointments/:id/cancel` - Cancel appointment
- `DELETE /api/appointments/:id` - Delete appointment
- `GET /api/appointments/slots/available?doctor_id=5&date=2026-04-25` - Get available slots

---

### 4. Billing Service (Port 3004)
```bash
cd backend/billing-service
npm install
npm run dev
```

**Configuration** (`.env`):
```env
PORT=3004
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hms_billing
DB_USER=postgres
DB_PASSWORD=postgres
```

**Bill Status**: PENDING | PAID | PARTIALLY_PAID | OVERDUE

**Endpoints**:
- `GET /api/bills` - Get all bills
- `GET /api/bills?status=PENDING` - Filter by status
- `GET /api/bills/:id` - Get bill by ID
- `GET /api/bills/patient/:patient_id` - Get patient bills
- `POST /api/bills` - Create bill (auto-calculates total)
- `PATCH /api/bills/:id` - Update bill status and payment
- `DELETE /api/bills/:id` - Delete bill

---

### 5. Payment Service (Port 3005)
```bash
cd backend/payment-service
npm install
npm run dev
```

**Configuration** (`.env`):
```env
PORT=3005
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hms_payments
DB_USER=postgres
DB_PASSWORD=postgres
```

**Payment Methods**: CASH | CARD | UPI | INSURANCE

**Endpoints**:
- `GET /api/payments` - Get all payments
- `GET /api/payments?patient_id=1&bill_id=5` - Filter payments
- `GET /api/payments/:id` - Get payment by ID
- `GET /api/payments/patient/:patient_id` - Get patient payments
- `GET /api/payments/bill/:bill_id` - Get bill payments
- `POST /api/payments` - Create payment (links to bill)
- `PUT /api/payments/:id` - Update payment
- `DELETE /api/payments/:id` - Delete payment

---

### 6. Prescription Service (Port 3006)
```bash
cd backend/prescription-service
npm install
npm run dev
```

**Configuration** (`.env`):
```env
PORT=3006
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hms_prescriptions
DB_USER=postgres
DB_PASSWORD=postgres
```

**Endpoints**:
- `GET /api/prescriptions` - Get all prescriptions
- `GET /api/prescriptions?patient_id=1` - Filter by patient
- `GET /api/prescriptions/:id` - Get prescription by ID
- `GET /api/prescriptions/patient/:patient_id` - Get patient prescriptions
- `POST /api/prescriptions` - Create prescription
- `PUT /api/prescriptions/:id` - Update prescription
- `DELETE /api/prescriptions/:id` - Delete prescription

---

## 🎯 Frontend Integration

### Angular Services

All HTTP services are located in `frontend/src/app/core/services/`:

1. **PatientService** - `patient.service.ts`
   - Calls `http://localhost:3001/api`
   - Manages patients with real-time updates

2. **DoctorService** - `doctor.service.ts`
   - Calls `http://localhost:3002/api`
   - Supports department filtering

3. **AppointmentService** - `appointment.service.ts`
   - Calls `http://localhost:3003/api`
   - Includes slot availability checking

4. **BillingService** - `billing.service.ts`
   - Calls `http://localhost:3004/api`

5. **PaymentService** - `payment.service.ts`
   - Calls `http://localhost:3005/api`

6. **PrescriptionService** - `prescription.service.ts`
   - Calls `http://localhost:3006/api`

### Usage Example

```typescript
import { PatientService } from './core/services/patient.service';

export class MyComponent implements OnInit {
  constructor(private patientService: PatientService) {}

  ngOnInit() {
    // Get all patients
    this.patientService.getPatients().subscribe(patients => {
      console.log(patients);
    });

    // Create patient
    this.patientService.createPatient({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '9876543210'
    }).subscribe(newPatient => {
      console.log('Patient created:', newPatient);
    });
  }
}
```

---

## 🔄 Running All Services

### Start All Services (Separate Terminals)

**Terminal 1 - Patient Service**:
```bash
cd backend/patient-service && npm run dev
```

**Terminal 2 - Doctor Service**:
```bash
cd backend/doctor-service && npm run dev
```

**Terminal 3 - Appointment Service**:
```bash
cd backend/appointment-service && npm run dev
```

**Terminal 4 - Billing Service**:
```bash
cd backend/billing-service && npm run dev
```

**Terminal 5 - Payment Service**:
```bash
cd backend/payment-service && npm run dev
```

**Terminal 6 - Prescription Service**:
```bash
cd backend/prescription-service && npm run dev
```

**Terminal 7 - Frontend**:
```bash
cd frontend && npm start
```

### OR Use PM2 (Production-like)

```bash
# Install PM2 globally (if not already)
npm install -g pm2

# Start all services
pm2 start "npm run dev" --name "patient-service" --cwd "./backend/patient-service"
pm2 start "npm run dev" --name "doctor-service" --cwd "./backend/doctor-service"
pm2 start "npm run dev" --name "appointment-service" --cwd "./backend/appointment-service"
pm2 start "npm run dev" --name "billing-service" --cwd "./backend/billing-service"
pm2 start "npm run dev" --name "payment-service" --cwd "./backend/payment-service"
pm2 start "npm run dev" --name "prescription-service" --cwd "./backend/prescription-service"

# View all processes
pm2 list

# View logs
pm2 logs

# Stop all
pm2 stop all
```

---

## 📋 API Testing

### Using cURL

```bash
# Get all patients
curl http://localhost:3001/api/patients

# Create patient
curl -X POST http://localhost:3001/api/patients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "dob": "1990-01-01",
    "gender": "Male",
    "address": "123 Main St"
  }'

# Get appointments for doctor 5 on 2026-04-25
curl "http://localhost:3003/api/appointments/slots/available?doctor_id=5&date=2026-04-25"

# Create appointment
curl -X POST http://localhost:3003/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": 1,
    "doctor_id": 5,
    "appointment_date": "2026-04-25T10:00:00Z",
    "time_slot": "10:00 AM",
    "reason": "Regular checkup"
  }'
```

### Using Postman

1. Import the provided Postman collection (if available)
2. Or create requests manually:
   - **Base URLs**:
     - Patient: `http://localhost:3001/api`
     - Doctor: `http://localhost:3002/api`
     - Appointment: `http://localhost:3003/api`
     - Billing: `http://localhost:3004/api`
     - Payment: `http://localhost:3005/api`
     - Prescription: `http://localhost:3006/api`

---

## 🛠️ Common Issues & Solutions

### Issue: Cannot connect to database
**Solution**: 
- Ensure PostgreSQL is running
- Check `.env` file has correct credentials
- Verify database exists: `psql -U postgres -l`

### Issue: Port already in use
**Solution**: 
- Kill process on port: `lsof -ti:3001 | xargs kill -9` (macOS/Linux)
- Or use different port in `.env`

### Issue: CORS errors in frontend
**Solution**: 
- CORS is enabled in all services
- Check browser console for specific URL issues
- Ensure backend services are running

### Issue: 404 Not Found on endpoints
**Solution**: 
- Verify service is running on correct port
- Check endpoint path matches exactly
- Use `/health` endpoint to verify service is up

---

## ✅ Checklist

Before going to production:

- [ ] All 6 microservices running and tested
- [ ] Frontend connecting to real APIs
- [ ] Database migrations applied
- [ ] Error boundaries and loading states in UI
- [ ] Authentication/JWT implemented
- [ ] Rate limiting configured
- [ ] Logging system in place
- [ ] Tests written for critical paths
- [ ] Environment variables properly secured
- [ ] HTTPS enabled for production
- [ ] API documentation generated
- [ ] Notification Service implemented (if needed)

---

## 📚 Next Steps

1. **Notification Service (Port 3007)** - Implement for real-time updates
2. **Add Authentication** - Integrate JWT with all services
3. **Add Validation** - Input validation on all endpoints
4. **Add Testing** - Unit and integration tests
5. **Deploy** - Docker containerization and K8s deployment
6. **Monitor** - Add metrics and monitoring (Prometheus, Grafana)

---

## 📞 Helpful Resources

- **PostgreSQL**: https://www.postgresql.org/docs/
- **Express.js**: https://expressjs.com/
- **Angular**: https://angular.io/docs
- **Node.js**: https://nodejs.org/en/docs/

---

**Last Updated**: April 21, 2026  
**Status**: 6/7 microservices implemented
