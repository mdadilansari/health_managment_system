# Backend API Requirements for Hospital Management System

This document outlines all the backend API endpoints required to support the complete frontend application.

## 🎯 Overview

The HMS frontend requires **7 backend microservices**, each running on separate ports with their own database (database-per-service pattern).

---

## 📋 Service Architecture

| Service | Port | Database | Purpose |
|---------|------|----------|---------|
| Patient Service | 3001 | hms_patients | Manage patient records |
| Doctor Service | 3002 | hms_doctors | Manage doctor profiles and schedules |
| Appointment Service | 3003 | hms_appointment | Handle appointment bookings and scheduling |
| Billing Service | 3004 | hms_billing | Manage bills and invoices |
| Payment Service | 3005 | hms_payments | Process payments |
| Prescription Service | 3006 | hms_prescriptions | Create and manage prescriptions |
| Notification Service | 3007 | hms_notifications (optional) | Send and track notifications |

---

## 1️⃣ Patient Service (Port 3001) ✅ IMPLEMENTED

**Base URL:** `http://localhost:3001/api`

### Endpoints

#### GET /patients
- **Description:** Fetch all patients
- **Response:** `Patient[]`
- **Status:** ✅ Implemented

#### GET /patients/:id
- **Description:** Fetch single patient by ID
- **Response:** `Patient`
- **Status:** ✅ Implemented

#### POST /patients
- **Description:** Create new patient
- **Status:** ⏳ TODO

#### PUT /patients/:id
- **Description:** Update patient details
- **Status:** ⏳ TODO

#### DELETE /patients/:id
- **Description:** Delete patient (soft delete recommended)
- **Status:** ⏳ TODO

### Data Model
```typescript
interface Patient {
  patient_id: number;
  name: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
  address: string;
  created_at: string;
}
```

---

## 2️⃣ Doctor Service (Port 3002) ✅ IMPLEMENTED

**Base URL:** `http://localhost:3002/api`

### Endpoints

#### GET /doctors
- **Description:** Fetch all doctors (with optional department filter)
- **Query Params:** `department` (optional)
- **Response:** `Doctor[]`
- **Status:** ✅ Implemented

#### GET /doctors/:id
- **Description:** Fetch single doctor by ID
- **Response:** `Doctor`
- **Status:** ✅ Implemented

#### GET /doctors/departments
- **Description:** Get list of all departments
- **Response:** `string[]`
- **Status:** ✅ Implemented

#### POST /doctors
- **Description:** Add new doctor
- **Status:** ⏳ TODO

#### PUT /doctors/:id
- **Description:** Update doctor details
- **Status:** ⏳ TODO

### Data Model
```typescript
interface Doctor {
  doctor_id: number;
  name: string;
  email: string;
  phone: string;
  department: string;
  specialization: string;
  qualification: string;
  experience_years: number;
  consultation_fee: number;
}
```

---

## 3️⃣ Appointment Service (Port 3003) ⏳ TODO

**Base URL:** `http://localhost:3003/api`

### Endpoints

#### GET /appointments
- **Description:** Fetch all appointments (with optional filters)
- **Query Params:** 
  - `status` (optional): SCHEDULED | CONFIRMED | COMPLETED | CANCELLED | RESCHEDULED
  - `doctor_id` (optional): Filter by doctor
  - `patient_id` (optional): Filter by patient
  - `date` (optional): Filter by date
- **Response:** `Appointment[]`

#### GET /appointments/:id
- **Description:** Fetch single appointment by ID
- **Response:** `Appointment`

#### POST /appointments
- **Description:** Create new appointment
- **Request Body:**
```json
{
  "patient_id": 1,
  "doctor_id": 5,
  "appointment_date": "2026-04-25T10:00:00Z",
  "time_slot": "10:00 AM",
  "reason": "Regular checkup",
  "notes": "Patient has history of hypertension"
}
```
- **Response:** `Appointment`
- **Business Logic:**
  - Check doctor availability for the time slot
  - Prevent double-booking
  - Send confirmation notification

#### PUT /appointments/:id
- **Description:** Update appointment (for rescheduling)
- **Request Body:**
```json
{
  "appointment_date": "2026-04-26T10:00:00Z",
  "time_slot": "10:30 AM",
  "status": "RESCHEDULED"
}
```

#### PATCH /appointments/:id/cancel
- **Description:** Cancel appointment
- **Request Body:**
```json
{
  "cancellation_reason": "Patient unavailable"
}
```

#### GET /appointments/slots/available
- **Description:** Get available time slots for a doctor on a specific date
- **Query Params:**
  - `doctor_id`: required
  - `date`: required (YYYY-MM-DD)
- **Response:** `string[]` (e.g., ["09:00 AM", "09:30 AM", "10:00 AM"])

### Data Model
```typescript
interface Appointment {
  appointment_id: number;
  patient_id: number;
  doctor_id: number;
  appointment_date: string; // ISO 8601
  time_slot: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
  reason: string;
  notes?: string;
  created_at: string;
  reschedule_count: number;
}
```

---

## 4️⃣ Billing Service (Port 3004) ⏳ TODO

**Base URL:** `http://localhost:3004/api`

### Endpoints

#### GET /bills
- **Description:** Fetch all bills (with optional status filter)
- **Query Params:** `status` (optional): PENDING | PAID | PARTIALLY_PAID | OVERDUE
- **Response:** `Bill[]`

#### GET /bills/:id
- **Description:** Fetch single bill by ID
- **Response:** `Bill`

#### POST /bills
- **Description:** Generate new bill
- **Request Body:**
```json
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
  ]
}
```
- **Response:** `Bill`
- **Business Logic:**
  - Calculate total amount
  - Set initial status as PENDING
  - Link to appointment if applicable

#### PATCH /bills/:id
- **Description:** Update bill status or paid amount
- **Request Body:**
```json
{
  "paid_amount": 1300,
  "status": "PAID",
  "payment_method": "CARD"
}
```

### Data Model
```typescript
interface Bill {
  bill_id: number;
  patient_id: number;
  appointment_id?: number;
  bill_date: string;
  line_items: LineItem[];
  paid_amount: number;
  status: 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE';
}

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}
```

---

## 5️⃣ Payment Service (Port 3005) ⏳ TODO

**Base URL:** `http://localhost:3005/api`

### Endpoints

#### GET /payments
- **Description:** Fetch all payments
- **Query Params:** 
  - `patient_id` (optional)
  - `bill_id` (optional)
- **Response:** `Payment[]`

#### GET /payments/:id
- **Description:** Fetch single payment by ID
- **Response:** `Payment`

#### POST /payments
- **Description:** Process new payment
- **Request Body:**
```json
{
  "bill_id": 234,
  "patient_id": 1,
  "amount": 5000,
  "payment_method": "CARD",
  "transaction_id": "TXN123456789",
  "notes": "Paid via Visa card"
}
```
- **Response:** `Payment`
- **Business Logic:**
  - Update bill's paid_amount
  - Update bill status (PAID or PARTIALLY_PAID)
  - Send payment confirmation notification

### Data Model
```typescript
interface Payment {
  payment_id: number;
  bill_id: number;
  patient_id: number;
  amount: number;
  payment_date: string;
  payment_method: 'CASH' | 'CARD' | 'UPI' | 'INSURANCE';
  transaction_id?: string;
  notes?: string;
}
```

---

## 6️⃣ Prescription Service (Port 3006) ⏳ TODO

**Base URL:** `http://localhost:3006/api`

### Endpoints

#### GET /prescriptions
- **Description:** Fetch all prescriptions
- **Query Params:**
  - `patient_id` (optional)
  - `doctor_id` (optional)
  - `appointment_id` (optional)
- **Response:** `Prescription[]`

#### GET /prescriptions/:id
- **Description:** Fetch single prescription by ID
- **Response:** `Prescription`

#### POST /prescriptions
- **Description:** Create new prescription
- **Request Body:**
```json
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
- **Response:** `Prescription`

#### PUT /prescriptions/:id
- **Description:** Update prescription
- **Use Case:** Modify medications or instructions

### Data Model
```typescript
interface Prescription {
  prescription_id: number;
  patient_id: number;
  doctor_id: number;
  appointment_id?: number;
  prescription_date: string;
  medications: Medication[];
  instructions?: string;
  follow_up_date?: string;
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}
```

---

## 7️⃣ Notification Service (Port 3007) ⏳ TODO

**Base URL:** `http://localhost:3007/api`

### Endpoints

#### GET /notifications
- **Description:** Fetch all notifications for current user
- **Query Params:** `read` (optional): true | false
- **Response:** `Notification[]`

#### GET /notifications/unread-count
- **Description:** Get count of unread notifications
- **Response:** `{ count: number }`

#### PATCH /notifications/:id/read
- **Description:** Mark notification as read
- **Response:** `Notification`

#### POST /notifications/mark-all-read
- **Description:** Mark all notifications as read
- **Response:** `{ success: boolean }`

#### POST /notifications (Internal/Triggered)
- **Description:** Create new notification (triggered by other services)
- **Request Body:**
```json
{
  "user_id": 1,
  "type": "APPOINTMENT_CONFIRMED",
  "message": "Your appointment on 2026-04-25 has been confirmed",
  "related_entity_id": 125,
  "related_entity_type": "APPOINTMENT"
}
```

### Data Model
```typescript
interface Notification {
  id: number;
  type: 'APPOINTMENT_CONFIRMED' | 'APPOINTMENT_RESCHEDULED' | 'APPOINTMENT_CANCELLED' | 'PAYMENT_RECEIVED' | 'BILL_REMINDER';
  message: string;
  timestamp: Date;
  read: boolean;
  user_id?: number; // Optional: if multi-user system
  related_entity_id?: number;
  related_entity_type?: string;
}
```

---

## 🔐 Cross-Cutting Concerns

### 1. Authentication & Authorization
Currently using mock JWT-based auth. Backend services should:
- Implement JWT token generation on login
- Validate JWT tokens on protected routes
- Support roles: `admin`, `reception`, `doctor`, `billing`
- Provide `/api/auth/login` and `/api/auth/logout` endpoints

### 2. CORS Configuration
All services must enable CORS with:
```javascript
res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4201');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
```

### 3. Error Responses
Standardize error format:
```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Patient with ID 999 not found",
    "status": 404
  }
}
```

### 4. Pagination (Recommended)
For large datasets, implement pagination:
```
GET /api/patients?page=1&limit=20
```
Response:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 60,
    "totalPages": 3
  }
}
```

---

## 🚀 Implementation Priority

Based on frontend functionality, implement in this order:

1. ✅ **Patient Service** (Already done)
2. ✅ **Doctor Service** (Already done)
3. ⭐ **Appointment Service** (Most critical - core booking flow)
4. ⭐ **Billing Service**
5. ⭐ **Payment Service**
6. **Prescription Service**
7. **Notification Service** (Can use simple polling initially)

---

## 📊 Database Schema Notes

- All services use PostgreSQL
- Each service has its own database (database-per-service)
- Foreign keys reference IDs as integers (patient_id, doctor_id, etc.)
- Use standard naming: `{entity}_id` for primary keys
- Timestamps should be stored as ISO 8601 strings or TIMESTAMP type
- Implement soft deletes with `deleted_at` column where applicable

---

## 🧪 Testing Endpoints

Use these mock credentials for testing:
- **Admin:** admin / admin
- **Reception:** reception / reception
- **Doctor:** doctor / doctor
- **Billing:** billing / billing

---

## 📝 Next Steps

1. Implement Appointment Service (port 3003)
2. Implement Billing Service (port 3004)
3. Implement Payment Service (port 3005)
4. Implement Prescription Service (port 3006)
5. Add CRUD operations to Patient Service
6. Add CRUD operations to Doctor Service
7. Implement Notification Service (port 3007)
8. Replace frontend's MockDataService with real HTTP calls
9. Add proper authentication/JWT handling
10. Deploy all services (consider PM2 for local orchestration)

---

**Generated:** April 20, 2026  
**Frontend Build:** Angular 21.2.0  
**Current Status:** 2/7 microservices implemented
