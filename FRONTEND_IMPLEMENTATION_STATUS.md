# HMS Frontend - Complete Implementation Guide

## 🎯 What's Been Created

### Core System (✅ Complete)
- ✅ All data models (Patient, Doctor, Appointment, Bill, Prescription, Notification)
- ✅ Auth Service with mock login (4 users: admin/admin, reception/reception, doctor/doctor, billing/billing)
- ✅ Mock Data Service with 60 patients, 5 doctors, 50 appointments, 30 bills, 40 prescriptions
- ✅ Angular Material added to package.json

### What Still Needs to Be Created

#### 1. Auth Module
- [ ] Login component
- [ ] Auth guard (canActivate)
- [ ] Role guard
- [ ] HTTP interceptor (add JWT token)

#### 2. Layout Module  
- [ ] Shell component (sidebar + topbar + main content)
- [ ] Sidebar with navigation
- [ ] Topbar with notification bell
- [ ] Role-based menu items

#### 3. Dashboard Module
- [ ] Admin dashboard (all KPIs)
- [ ] Reception dashboard (today's appointments)
- [ ] Doctor dashboard (my schedule)
- [ ] Billing dashboard (unpaid bills)

#### 4. Patient Module
- [ ] Patient list (searchable, paginated)
- [ ] Patient detail view
- [ ] Patient create/edit form
- [ ] Patient appointments history

#### 5. Doctor Module
- [ ] Doctor list with department filter
- [ ] Doctor detail view
- [ ] Weekly schedule view
- [ ] Slot availability calendar

### 6. Appointment Module (Most Complex)
- [ ] Appointment list with filters
- [ ] Book appointment (multi-step):
  - Step 1: Select patient
  - Step 2: Select department + doctor  
  - Step 3: Pick time slot
  - Step 4: Confirm
- [ ] Appointment detail
- [ ] Reschedule flow
- [ ] Cancel flow with policy

#### 7. Prescription Module
- [ ] Prescription list
- [ ] Create prescription form
- [ ] Prescription detail/print view

#### 8. Billing Module
- [ ] Bill list with status filter
- [ ] Bill detail with line items
- [ ] Payment form (cash/card/UPI)
- [ ] Generate bill button

#### 9. Notification Module
- [ ] Notification service
- [ ] Snackbar/toast service (Material)
- [ ] Notification bell in topbar
- [ ] Notification list drawer

---

## 📦 Backend APIs Required

Once frontend is complete, backend needs these endpoints:

### Auth Service (Port 3000)
```
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Patient Service (Port 3001) - ✅ Already exists
```
GET    /api/patients
GET    /api/patients/:id
POST   /api/patients
PUT    /api/patients/:id
DELETE /api/patients/:id
GET    /api/patients/search?q=name&phone=xxx
```

### Doctor Service (Port 3002) - ✅ Already exists
```
GET /api/doctors
GET /api/doctors/:id
GET /api/doctors?department=Cardiology
GET /api/doctors/departments
GET /api/doctors/:id/slots?date=2026-04-20
```

### Appointment Service (Port 3003) - ⚠️ Needs to be created
```
GET    /api/appointments
GET    /api/appointments/:id
POST   /api/appointments (book)
PUT    /api/appointments/:id/reschedule
DELETE /api/appointments/:id/cancel
PATCH  /api/appointments/:id/complete
PATCH  /api/appointments/:id/no-show
GET    /api/appointments/available-slots?doctor_id=1&date=2026-04-20
```

### Billing Service (Port 3004) - ⚠️ Needs to be created
```
GET  /api/bills
GET  /api/bills/:id
POST /api/bills (generate for appointment)
GET  /api/bills?status=OPEN
```

### Payment Service (Port 3005) - ⚠️ Needs to be created
```
POST /api/payments/charge
GET  /api/payments/:id
POST /api/payments/refund
```

### Prescription Service (Port 3006) - ⚠️ Needs to be created
```
GET  /api/prescriptions
GET  /api/prescriptions/:id
POST /api/prescriptions
GET  /api/prescriptions?patient_id=1
```

### Notification Service (Port 3007) - ⚠️ Needs to be created
```
GET   /api/notifications
POST  /api/notifications/send
PATCH /api/notifications/:id/read
GET   /api/notifications/unread-count
```

---

## 🚀 Next Steps

### Option 1: I Complete the Frontend (Recommended)
I can create all remaining components with mock data. This will take ~20-30 files but will give you a complete working UI.

### Option 2: You Complete Using Templates
I provide component templates and you fill in the details.

### Option 3: Hybrid Approach
I create the most complex parts (appointment booking flow, billing) and you handle simpler CRUD screens.

---

## 💡 Recommended: Let Me Build Complete Appointment Module

The appointment booking flow is the most complex (multi-step form, slot selection, validation). Let me create:

1. Complete appointment booking wizard
2. Appointment list with filters
3. Reschedule and cancel flows
4. Time slot picker component

This will show you the pattern for the rest.

**Should I proceed with creating the complete Appointment module?**

---

## 📝 Notes

- All mock data is in `MockDataService`
- Login credentials: `admin/admin`, `reception/reception`, `doctor/doctor`, `billing/billing`
- Frontend will work completely standalone with mock data
- Backend APIs can be added later without changing frontend code (just swap mock service for HTTP service)
