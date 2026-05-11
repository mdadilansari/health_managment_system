# Hospital Management System
## A Microservices-Based Architecture for Modern Healthcare Operations

---

## Acknowledgements

We would like to express our sincere gratitude to our faculty advisor and the Department of Computer Science for their guidance and support throughout the development of this project. Special thanks to the open-source community behind Node.js, Angular, PostgreSQL, Docker, and Kubernetes, whose tools made this system possible.

---

## Abstract

This report presents the design, implementation, and deployment of a Hospital Management System (HMS) built on a microservices architecture. The system addresses the operational needs of a modern hospital by decomposing the domain into seven independent services — Patient, Doctor, Appointment, Billing, Payment, Prescription, and Notification — each owning its own PostgreSQL database and communicating through well-defined HTTP APIs and an event-driven bus.

The frontend is a responsive Angular 21 single-page application consuming all seven backend services via RESTful APIs versioned at `/v1/`. The system implements role-based access control (RBAC) using JSON Web Tokens, structured JSON logging with PII masking, standardised error responses with correlation IDs, and Prometheus metrics with Grafana dashboards. The application is containerised using Docker Compose for local development and deployed to a Minikube Kubernetes cluster with per-service Deployments, Services, ConfigMaps, Secrets, and PersistentVolumeClaims. All appointment workflows — booking, rescheduling, cancellation, no-show handling, and completion — are enforced with business-rule constraints validated at the service layer.

---

## Table of Contents

1. Introduction
2. System Architecture
3. Technology Stack
4. Database Design
5. Microservices: Design and Implementation
6. Inter-Service Communication
7. Frontend Application
8. Security and RBAC
9. API Design Standards
10. Business Logic and Workflows
11. Containerisation with Docker
12. Kubernetes Deployment
13. Resilience and Observability
14. Testing and Validation
15. Conclusions and Recommendations
16. Appendices
17. References
18. Glossary

---

## 1. Introduction

### 1.1 Background

Hospitals generate and consume vast amounts of data daily — patient records, appointment schedules, diagnostic prescriptions, billing statements, and payment transactions. Traditionally managed through monolithic applications, these systems suffer from tight coupling, poor scalability, and high deployment risk. A single bug in the billing module can bring down the entire application.

Microservices architecture addresses these limitations by decomposing an application into small, independently deployable services. Each service owns a specific business domain, communicates through APIs, and can be scaled, updated, or replaced without affecting the rest of the system.

### 1.2 Problem Statement

The goal of this project is to build a production-ready Hospital Management System using microservices principles, with the following requirements:

- **Database-per-service** isolation — no shared tables, no cross-database joins
- **Seven independent services** covering the full hospital domain
- **Inter-service workflows** for booking, billing, payment, and notifications
- **RBAC** with JWT tokens enforcing role-specific access per endpoint
- **Containerisation** with Docker and orchestration with Kubernetes
- **Observability** through structured logging, Prometheus metrics, and Grafana dashboards
- **API standards** including versioning, pagination, filtering, and a standardised error schema

### 1.3 Scope

The system covers the following functional areas:

- Patient registration and management
- Doctor and department administration
- Appointment booking, rescheduling, cancellation, and completion
- Automatic bill generation with tax calculation
- Payment processing with idempotency guarantees
- Prescription creation and management
- Real-time notifications for all major events
- Role-based access for reception, doctor, billing, admin, and patient roles

---

## 2. System Architecture

### 2.1 Architecture Overview

The HMS follows a microservices architecture pattern with a React-free, Angular-based single-page application as the frontend. The architecture separates concerns across three layers:

1. **Presentation Layer** — Angular 21 SPA served by nginx
2. **Service Layer** — Seven Node.js/Express microservices
3. **Data Layer** — Seven isolated PostgreSQL databases (one per service)

```
┌────────────────────────────────────────────────────────────────────┐
│                        Browser / Client                            │
└──────────────────────────────┬─────────────────────────────────────┘
                               │ HTTP
┌──────────────────────────────▼─────────────────────────────────────┐
│               Frontend (Angular 21 + nginx)  :4200                 │
│    nginx proxies /v1/* requests to respective backend services     │
└──┬──────┬──────┬──────┬──────┬──────┬──────┬──────────────────────┘
   │      │      │      │      │      │      │
  3001   3002   3003   3004   3005   3006   3007
   │      │      │      │      │      │      │
┌──▼──┐ ┌─▼──┐ ┌─▼──┐ ┌─▼──┐ ┌─▼──┐ ┌─▼──┐ ┌─▼──┐
│Pat. │ │Doc.│ │App.│ │Bil.│ │Pay.│ │Rx. │ │Not.│
│Svc  │ │Svc │ │Svc │ │Svc │ │Svc │ │Svc │ │Svc │
└──┬──┘ └─┬──┘ └─┬──┘ └─┬──┘ └─┬──┘ └─┬──┘ └─┬──┘
   │      │      │      │      │      │      │
  PG     PG     PG     PG     PG     PG     PG
```

### 2.2 Design Principles

| Principle | Implementation |
|---|---|
| Database-per-service | Each service has its own PostgreSQL instance; no cross-DB queries |
| Single Responsibility | Each service owns exactly one bounded domain context |
| API-first | All communication is through versioned HTTP REST APIs |
| Event-driven | Appointment events trigger billing and notifications via EventBus |
| Fail-safe | Services degrade gracefully when downstream services are unavailable |
| Observable | All services expose `/metrics`, `/health`, and structured JSON logs |

---

## 3. Technology Stack

### 3.1 Backend

| Technology | Version | Purpose |
|---|---|---|
| Node.js | 20 LTS | JavaScript runtime |
| Express.js | 4.x | HTTP server and routing |
| PostgreSQL | 17 | Relational database |
| `pg` | 8.x | PostgreSQL client for Node.js |
| `jsonwebtoken` | 9.x | JWT creation and verification |
| `bcryptjs` | 2.x | Password hashing |
| `prom-client` | 15.x | Prometheus metrics |
| `axios` | 1.x | Inter-service HTTP calls |
| `dotenv` | 16.x | Environment variable management |

### 3.2 Frontend

| Technology | Version | Purpose |
|---|---|---|
| Angular | 21.2.0 | SPA framework |
| TypeScript | 5.x | Typed JavaScript |
| RxJS | 7.x | Reactive programming |
| Angular Signals | 21.x | Reactive state management |
| nginx | Alpine | Static file serving + API proxy |

### 3.3 Infrastructure

| Technology | Purpose |
|---|---|
| Docker | Containerisation |
| Docker Compose | Local multi-container orchestration |
| Minikube | Local Kubernetes cluster |
| kubectl | Kubernetes CLI |
| RabbitMQ | Asynchronous inter-service messaging |
| Prometheus | Metrics collection |
| Grafana | Metrics visualisation and dashboards |

---

## 4. Database Design

### 4.1 Database-Per-Service Strategy

Each microservice owns its data exclusively. No service reads directly from another service's database. When a service needs data owned by another, it uses one of two patterns:

- **API Composition** — calls the owning service's REST API
- **Read Model Replication** — caches a projection of the data it needs (e.g., appointment-service caches `doctor_department` for validation)

### 4.2 Schema Definitions

#### hms_patients
```sql
CREATE TABLE patients (
  patient_id   SERIAL PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  email        VARCHAR(255) UNIQUE NOT NULL,
  phone        VARCHAR(20),
  dob          DATE,
  created_at   TIMESTAMP DEFAULT NOW()
);
```

#### hms_doctors
```sql
CREATE TABLE doctors (
  doctor_id          SERIAL PRIMARY KEY,
  name               VARCHAR(255) NOT NULL,
  email              VARCHAR(255) UNIQUE NOT NULL,
  phone              VARCHAR(20),
  department         VARCHAR(100),
  specialization     VARCHAR(100),
  qualification      VARCHAR(100),
  experience_years   INTEGER DEFAULT 0,
  consultation_fee   DECIMAL(10,2) DEFAULT 0,
  created_at         TIMESTAMP DEFAULT NOW()
);
```

#### hms_appointment
```sql
CREATE TABLE appointments (
  appointment_id    SERIAL PRIMARY KEY,
  patient_id        INTEGER NOT NULL,
  doctor_id         INTEGER NOT NULL,
  department        VARCHAR(100),
  slot_start        TIMESTAMP NOT NULL,
  slot_end          TIMESTAMP NOT NULL,
  status            VARCHAR(20) DEFAULT 'SCHEDULED',
  reschedule_count  INTEGER DEFAULT 0,
  version           INTEGER DEFAULT 1,
  created_at        TIMESTAMP DEFAULT NOW()
);
```

#### hms_billing
```sql
CREATE TABLE bills (
  bill_id          SERIAL PRIMARY KEY,
  patient_id       INTEGER NOT NULL,
  appointment_id   INTEGER,
  amount           DECIMAL(10,2) NOT NULL,
  status           VARCHAR(20) DEFAULT 'OPEN',
  created_at       TIMESTAMP DEFAULT NOW()
);
```

#### hms_payments
```sql
CREATE TABLE payments (
  payment_id   SERIAL PRIMARY KEY,
  bill_id      INTEGER NOT NULL,
  amount       DECIMAL(10,2) NOT NULL,
  method       VARCHAR(50),
  reference    VARCHAR(255) UNIQUE,
  paid_at      TIMESTAMP DEFAULT NOW()
);
```

#### hms_prescriptions
```sql
CREATE TABLE prescriptions (
  prescription_id   SERIAL PRIMARY KEY,
  patient_id        INTEGER NOT NULL,
  doctor_id         INTEGER NOT NULL,
  appointment_id    INTEGER,
  prescription_date TIMESTAMP DEFAULT NOW(),
  medications       JSONB,
  instructions      TEXT,
  follow_up_date    DATE
);
```

#### hms_notifications
```sql
CREATE TABLE notifications (
  notification_id   SERIAL PRIMARY KEY,
  type              VARCHAR(50) NOT NULL,
  title             VARCHAR(255) NOT NULL,
  message           TEXT NOT NULL,
  recipient_id      INTEGER,
  recipient_type    VARCHAR(20),
  is_read           BOOLEAN DEFAULT FALSE,
  metadata          JSONB,
  created_at        TIMESTAMP DEFAULT NOW()
);
```

---

## 5. Microservices: Design and Implementation

### 5.1 Patient Service (Port 3001)

**Responsibility:** CRUD operations for patient records.

**Endpoints:**

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/v1/patients` | List all patients (paginated) | admin, reception |
| GET | `/v1/patients/:id` | Get patient by ID | admin, reception, patient |
| POST | `/v1/patients` | Register new patient | admin, reception |
| PUT | `/v1/patients/:id` | Update patient | admin, reception |
| DELETE | `/v1/patients/:id` | Delete patient | admin |

**Key Features:**
- Search by name or phone via query params
- PII fields (email, phone, dob) masked in all log output
- Pagination: `?page=1&limit=10`

---

### 5.2 Doctor & Scheduling Service (Port 3002)

**Responsibility:** Doctor profiles, department management, and slot availability.

**Endpoints:**

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/v1/doctors` | List doctors with optional department filter | admin, reception, patient |
| GET | `/v1/doctors/departments` | List unique departments | all |
| GET | `/v1/doctors/:id` | Get doctor by ID | all |
| POST | `/v1/doctors` | Register new doctor | admin |
| PUT | `/v1/doctors/:id` | Update doctor | admin |
| DELETE | `/v1/doctors/:id` | Remove doctor | admin |

---

### 5.3 Appointment Service (Port 3003)

**Responsibility:** Full appointment lifecycle including booking, rescheduling, cancellation, completion, and no-show handling.

**Endpoints:**

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/v1/appointments` | List with filters | admin, reception, doctor |
| GET | `/v1/appointments/:id` | Get single appointment | admin, reception, doctor |
| POST | `/v1/appointments` | Book new appointment | admin, reception |
| PATCH | `/v1/appointments/:id/cancel` | Cancel appointment | admin, reception |
| PATCH | `/v1/appointments/:id/complete` | Mark as completed | admin, doctor |
| PATCH | `/v1/appointments/:id/reschedule` | Reschedule appointment | admin, reception |
| PATCH | `/v1/appointments/:id/no-show` | Mark as no-show | admin, reception |
| DELETE | `/v1/appointments/:id` | Delete appointment | admin |

**Business Rules enforced:**
- Minimum 2-hour lead time before slot start
- No overlapping slots for same doctor or patient
- Doctor daily cap enforcement
- Maximum 2 reschedules per appointment
- 1-hour cutoff for rescheduling
- Status transitions validated (cannot cancel a COMPLETED appointment)
- Department mismatch rejected

---

### 5.4 Billing Service (Port 3004)

**Responsibility:** Bill generation, tax calculation, and payment status management.

**Endpoints:**

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/v1/bills` | List bills (paginated, filtered) | admin, billing |
| GET | `/v1/bills/:id` | Get bill by ID | admin, billing |
| GET | `/v1/bills/patient/:id` | Get bills for a patient | admin, billing, patient |
| POST | `/v1/bills` | Create bill manually | admin, billing |
| PATCH | `/v1/bills/:id/pay` | Mark bill as PAID | admin, billing |
| PATCH | `/v1/bills/:id/void` | Void a bill | admin, billing |
| POST | `/v1/bills/internal` | Internal bill creation (EventBus) | internal |

**Business Rules:**
- 5% tax applied on consultation base fee
- PAID or VOID bills cannot be modified
- Auto-generated on appointment COMPLETED event
- Cancellation fee tiers: >2h = no charge, ≤2h = 50% fee, no-show = 100% fee

---

### 5.5 Payment Service (Port 3005)

**Responsibility:** Payment capture with idempotency and downstream bill update.

**Endpoints:**

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/v1/payments` | List payments | admin, billing |
| GET | `/v1/payments/:id` | Get payment by ID | admin, billing |
| GET | `/v1/payments/patient/:id` | Payments for a patient | admin, billing, patient |
| GET | `/v1/payments/bill/:id` | Payments for a bill | admin, billing |
| POST | `/v1/payments` | Capture payment | admin, billing |
| PUT | `/v1/payments/:id` | Update payment | admin |
| DELETE | `/v1/payments/:id` | Delete payment | admin |

**Key Features:**
- `Idempotency-Key` header prevents double-charging on retries
- On successful payment, automatically calls Billing Service to mark bill as PAID
- Sends `PAYMENT_RECEIVED` notification via Notification Service

---

### 5.6 Prescription Service (Port 3006)

**Responsibility:** Prescription creation and retrieval, tied to appointments.

**Endpoints:**

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/v1/prescriptions` | List prescriptions | admin, doctor, reception |
| GET | `/v1/prescriptions/:id` | Get by ID | admin, doctor, patient |
| GET | `/v1/prescriptions/patient/:id` | Patient prescriptions | admin, doctor, patient |
| POST | `/v1/prescriptions` | Create prescription | admin, doctor |
| PUT | `/v1/prescriptions/:id` | Update prescription | admin, doctor |
| DELETE | `/v1/prescriptions/:id` | Delete prescription | admin |

**Business Rule:** A prescription requires a valid `appointment_id`.

---

### 5.7 Notification Service (Port 3007)

**Responsibility:** Store and serve notifications triggered by system events.

**Endpoints:**

| Method | Path | Description |
|---|---|---|
| GET | `/v1/notifications` | List all notifications |
| GET | `/v1/notifications/unread-count` | Count of unread notifications |
| POST | `/v1/notifications` | Create notification (internal) |
| PATCH | `/v1/notifications/:id/read` | Mark as read |
| PATCH | `/v1/notifications/read-all` | Mark all as read |
| DELETE | `/v1/notifications/:id` | Delete notification |

**Notification Types:**

| Type | Trigger |
|---|---|
| `APPOINTMENT_BOOKED` | New appointment created |
| `APPOINTMENT_CANCELLED` | Appointment cancelled |
| `APPOINTMENT_RESCHEDULED` | Appointment rescheduled |
| `APPOINTMENT_COMPLETED` | Appointment completed |
| `APPOINTMENT_NO_SHOW` | Patient marked no-show |
| `PAYMENT_RECEIVED` | Payment captured |

The Angular frontend polls this service every 30 seconds and displays a live notification badge.

---

## 6. Inter-Service Communication

### 6.1 EventBus Pattern with RabbitMQ

Inter-service communication is implemented using **RabbitMQ** as the message broker, accessed through the `amqplib` Node.js client. The appointment-service publishes domain events to named RabbitMQ exchanges; downstream services (billing, notification) subscribe to the relevant queues and process events asynchronously.

An EventBus abstraction wraps the RabbitMQ channel, keeping all producer and consumer logic in a single file:

```javascript
// eventBus.js — RabbitMQ-backed event publisher
const amqp = require('amqplib');

let channel;
async function connect() {
  const conn = await amqp.connect(process.env.RABBITMQ_URL);
  channel = await conn.createChannel();
  await channel.assertExchange('hms.events', 'topic', { durable: true });
}

async function publish(eventType, payload) {
  const msg = Buffer.from(JSON.stringify({ eventType, payload, timestamp: new Date() }));
  channel.publish('hms.events', eventType, msg, { persistent: true });
}
```

Downstream services consume from their respective queues:

```javascript
// notification-service consumer
await channel.assertQueue('notification.appointments', { durable: true });
await channel.bindQueue('notification.appointments', 'hms.events', 'appointment.*');
channel.consume('notification.appointments', async (msg) => {
  const { eventType, payload } = JSON.parse(msg.content.toString());
  await handleEvent(eventType, payload);
  channel.ack(msg);
});
```

This approach fully decouples producers from consumers — the appointment-service has no knowledge of which services consume its events.

### 6.2 Event Flow

```
POST /v1/appointments
  └─► Appointment Service creates record
       └─► EventBus.publish('appointment.booked')
            ├─► Notification Service: "Appointment Confirmed"
            └─► (no bill yet — bill created on COMPLETED)

PATCH /v1/appointments/:id/complete
  └─► Appointment Service updates status → COMPLETED
       └─► EventBus.publish('appointment.completed')
            ├─► Billing Service: create bill (consultation + 5% tax)
            └─► Notification Service: "Your appointment is complete. Bill generated."

PATCH /v1/appointments/:id/cancel
  └─► Appointment Service checks cancellation policy
       └─► EventBus.publish('appointment.cancelled')
            ├─► Billing Service: void bill or apply fee
            └─► Notification Service: "Appointment cancelled. Refund policy applied."

POST /v1/payments
  └─► Payment Service records payment
       ├─► Billing Service: PATCH /bills/:id/pay
       └─► Notification Service: "Payment of ₹X received"
```

### 6.3 RabbitMQ Configuration (Docker/K8s)

RabbitMQ runs as a dedicated container and is reachable by all services via its internal DNS name:

```
RABBITMQ_URL = amqp://guest:guest@rabbitmq:5672
```

The RabbitMQ Management UI is exposed on port `15672` for queue inspection and monitoring. Direct HTTP calls are still used for synchronous operations (e.g., payment-service calling billing-service to mark a bill as PAID), while all event-driven workflows (booking, completion, cancellation, no-show) flow through RabbitMQ.

---

## 7. Frontend Application

### 7.1 Angular Architecture

The frontend is organised into feature modules following Angular best practices:

```
src/app/
├── core/
│   ├── services/           # API services (one per backend service)
│   ├── models/             # TypeScript interfaces
│   ├── guards/             # Auth and role guards
│   └── interceptors/       # JWT token interceptor
├── features/
│   ├── patients/           # Patient list, form, detail
│   ├── doctors/            # Doctor list, form, detail
│   ├── appointments/       # Appointment list, booking, calendar
│   ├── billing/            # Bill list, payment form
│   ├── prescriptions/      # Prescription list and form
│   └── notifications/      # Notification panel
└── shared/
    └── components/         # Reusable UI components
```

### 7.2 Environment Configuration

The app uses Angular's environment file system to switch API base URLs:

```typescript
// environment.ts (local development)
export const environment = {
  production: false,
  patientServiceUrl:      'http://localhost:3001/v1',
  doctorServiceUrl:       'http://localhost:3002/v1',
  appointmentServiceUrl:  'http://localhost:3003/v1',
  billingServiceUrl:      'http://localhost:3004/v1',
  paymentServiceUrl:      'http://localhost:3005/v1',
  prescriptionServiceUrl: 'http://localhost:3006/v1',
  notificationServiceUrl: 'http://localhost:3007/v1',
};

// environment.prod.ts (Docker / Kubernetes — nginx proxies /v1/*)
export const environment = {
  production: true,
  patientServiceUrl:      '/v1',
  // all services use relative /v1 — nginx routes to correct backend
};
```

### 7.3 nginx API Proxy (Production)

In Docker/K8s, the Angular app is served by nginx, which also proxies all API calls to the correct backend service using Kubernetes internal DNS:

```nginx
location /v1/patients      { proxy_pass http://patient-service:3001; }
location /v1/doctors       { proxy_pass http://doctor-service:3002; }
location /v1/appointments  { proxy_pass http://appointment-service:3003; }
location /v1/bills         { proxy_pass http://billing-service:3004; }
location /v1/payments      { proxy_pass http://payment-service:3005; }
location /v1/prescriptions { proxy_pass http://prescription-service:3006; }
location /v1/notifications { proxy_pass http://notification-service:3007; }
location /                 { try_files $uri $uri/ /index.html; }
```

### 7.4 Key Frontend Features

- **Live notification badge** — polls `/v1/notifications/unread-count` every 30 seconds using Angular Signals
- **Role-aware UI** — navigation items and action buttons hidden based on JWT role claim
- **Reactive state** — all data flows through RxJS Observables and BehaviorSubjects
- **Production build** — `ng build --configuration production` produces optimised, tree-shaken bundles

---

## 8. Security and RBAC

### 8.1 Authentication Flow

```
1. User submits credentials to POST /v1/auth/login
2. Auth service validates credentials against hms_users table
3. On success, returns a signed JWT:
   {
     "token": "eyJhbGci...",
     "role": "reception",
     "userId": 42,
     "expiresIn": "8h"
   }
4. Angular stores token in sessionStorage
5. HTTP Interceptor attaches token to every request:
   Authorization: Bearer eyJhbGci...
6. Each backend service verifies the token on protected routes
```

### 8.2 JWT Middleware

Applied to all protected routes across all services:

```javascript
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({
    code: 'UNAUTHORISED', message: 'No token provided', ...
  });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ code: 'INVALID_TOKEN', message: 'Token invalid or expired', ... });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        code: 'FORBIDDEN', message: `Role '${req.user.role}' cannot access this resource`, ...
      });
    }
    next();
  };
}
```

### 8.3 Role-to-Endpoint Matrix

| Endpoint | admin | reception | doctor | billing | patient |
|---|:---:|:---:|:---:|:---:|:---:|
| GET /v1/patients | ✅ | ✅ | ❌ | ❌ | own |
| POST /v1/patients | ✅ | ✅ | ❌ | ❌ | ❌ |
| POST /v1/appointments | ✅ | ✅ | ❌ | ❌ | ❌ |
| PATCH /appointments/:id/complete | ✅ | ❌ | ✅ | ❌ | ❌ |
| PATCH /appointments/:id/cancel | ✅ | ✅ | ❌ | ❌ | ❌ |
| POST /v1/prescriptions | ✅ | ❌ | ✅ | ❌ | ❌ |
| PATCH /v1/bills/:id/pay | ✅ | ❌ | ❌ | ✅ | ❌ |
| PATCH /v1/bills/:id/void | ✅ | ❌ | ❌ | ✅ | ❌ |
| POST /v1/payments | ✅ | ❌ | ❌ | ✅ | ❌ |
| GET /v1/notifications | ✅ | ✅ | ✅ | ✅ | own |

---

## 9. API Design Standards

### 9.1 Versioning

All endpoints are prefixed with `/v1/`. This allows future breaking changes to be introduced under `/v2/` without disrupting existing clients.

### 9.2 Standard Error Schema

Every error response across all services follows a consistent structure:

```json
{
  "code": "SLOT_CONFLICT",
  "message": "The requested slot overlaps with an existing appointment for this doctor.",
  "correlationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "timestamp": "2026-05-12T10:30:00.000Z"
}
```

| Field | Description |
|---|---|
| `code` | Machine-readable error code |
| `message` | Human-readable description |
| `correlationId` | UUID unique to this request, used for log tracing |
| `timestamp` | ISO-8601 UTC time of the error |

### 9.3 Correlation IDs

Every incoming request is assigned a `correlationId` — either from the `x-correlation-id` request header (if provided by the caller) or auto-generated as a UUID. This ID is included in all log entries and all error responses, enabling end-to-end request tracing across services.

### 9.4 Pagination

All list endpoints support pagination:

```
GET /v1/patients?page=1&limit=10&search=John
```

Response:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 60,
    "totalPages": 6
  }
}
```

### 9.5 Filtering

| Service | Supported Filters |
|---|---|
| Patients | `search` (name/phone) |
| Doctors | `department` |
| Appointments | `patient_id`, `doctor_id`, `status`, `date` |
| Bills | `patient_id`, `status` |
| Payments | `patient_id`, `bill_id` |
| Prescriptions | `patient_id`, `doctor_id`, `appointment_id` |

---

## 10. Business Logic and Workflows

### 10.1 Appointment Booking

```
Client → POST /v1/appointments
  1. Validate JWT (reception or admin role)
  2. Validate required fields (patient_id, doctor_id, slot_start, slot_end)
  3. Check doctor exists and belongs to requested department
  4. Validate slot is ≥ 2 hours from now
  5. Check no slot overlap for this doctor (same time range)
  6. Check no slot overlap for this patient
  7. Check doctor has not exceeded daily appointment cap
  8. Insert appointment with status = SCHEDULED
  9. Publish 'appointment.booked' event
     → Notification: "Appointment confirmed for [date/time]"
  10. Return 201 with appointment object
```

### 10.2 Appointment Cancellation and Fee Policy

```
Client → PATCH /v1/appointments/:id/cancel
  1. Load appointment; reject if already CANCELLED, COMPLETED, or NO_SHOW
  2. Calculate hours until slot start
  3. Determine cancellation policy:
     - > 2 hours  → FULL_REFUND (no charge)
     - ≤ 2 hours  → PARTIAL_REFUND (50% consultation fee charged)
  4. Update status to CANCELLED
  5. Publish 'appointment.cancelled' event
     → Billing: void associated bill OR create fee bill
     → Notification: "Appointment cancelled. [Refund policy details]"
  6. Return updated appointment with cancellationPolicy
```

### 10.3 Appointment Completion → Auto-Billing

```
Doctor → PATCH /v1/appointments/:id/complete
  1. Validate JWT (doctor or admin role)
  2. Load appointment; reject if not SCHEDULED
  3. Update status to COMPLETED
  4. Publish 'appointment.completed' event
     → Billing: create bill
          base = ₹500 (consultation fee)
          tax  = 5% = ₹25
          total = ₹525, status = OPEN
     → Notification: "Appointment completed. Bill of ₹525 generated."
  5. Return updated appointment
```

### 10.4 No-Show Handling

```
Reception → PATCH /v1/appointments/:id/no-show
  1. Validate JWT (reception or admin role)
  2. Update status to NO_SHOW
  3. Publish 'appointment.no_show' event
     → Billing: create bill for 100% consultation fee (₹500 + tax)
     → Notification: "Patient marked as no-show. Late fee applied."
```

### 10.5 Rescheduling Rules

```
PATCH /v1/appointments/:id/reschedule
  1. Reject if reschedule_count >= 2 (maximum 2 reschedules enforced)
  2. Reject if current slot starts within 1 hour
  3. Validate new slot (lead time, collision, daily cap)
  4. Update slot_start, slot_end, increment reschedule_count
  5. Publish 'appointment.rescheduled' event
     → Notification: "Your appointment has been rescheduled to [new time]"
```

### 10.6 Payment Processing

```
POST /v1/payments  (with Idempotency-Key: <uuid> header)
  1. Check if Idempotency-Key already exists in payments.reference
     - If yes: return existing payment (prevents double-charge)
  2. Insert payment record
  3. Call Billing Service: PATCH /v1/bills/:id/pay
     → Bill status → PAID (guarded: cannot re-pay a PAID bill)
  4. Call Notification Service: "Payment of ₹X received. Reference: Y"
  5. Return 201 with payment object
```

---

## 11. Containerisation with Docker

### 11.1 Dockerfile (Backend Services)

All seven backend services share the same Dockerfile pattern:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
EXPOSE <port>
CMD ["node", "src/index.js"]
```

Key decisions:
- `node:20-alpine` — minimal image size (~180MB vs ~900MB for full Node)
- `--omit=dev` — excludes devDependencies (nodemon etc.) from production image

### 11.2 Frontend Dockerfile (Multi-Stage)

```dockerfile
# Stage 1: Build Angular application
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npx ng build --configuration production

# Stage 2: Serve with nginx
FROM nginx:alpine
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

The multi-stage build discards Node.js and build tools from the final image — only static files + nginx are shipped (~25MB final image).

### 11.3 Docker Compose

The `docker-compose.yml` orchestrates all 17 containers:

- 7 microservice containers
- 7 PostgreSQL database containers (one per service)
- 1 Angular frontend container (nginx)
- 1 Prometheus container
- 1 Grafana container

Key configuration features:
- **Health checks** on all databases using `pg_isready`
- **`depends_on: condition: service_healthy`** — services wait for their DB before starting
- **Named volumes** for data persistence across container restarts
- **Internal DNS** for inter-service communication (container names as hostnames)

```yaml
appointment-service:
  environment:
    DB_HOST: db-appointments
    NOTIFICATION_SERVICE_URL: http://notification-service:3007/v1
    BILLING_SERVICE_URL: http://billing-service:3004/v1
```

---

## 12. Kubernetes Deployment

### 12.1 Cluster Architecture

The application is deployed to a local Minikube cluster with the following resource types per service:

| Resource | Purpose |
|---|---|
| `Namespace` | Isolates all HMS resources under `hms` namespace |
| `Secret` | Stores database credentials (DB_USER, DB_PASSWORD) |
| `ConfigMap` | Stores non-sensitive config (ports, service URLs) |
| `PersistentVolumeClaim` | Provides durable storage for each PostgreSQL database |
| `Deployment` | Manages pods with readiness/liveness probes and resource limits |
| `Service` | Provides stable internal DNS for inter-pod communication |
| `Ingress` | Routes external traffic to frontend and services |

### 12.2 Deployment Configuration

Each microservice Deployment includes:

```yaml
readinessProbe:
  httpGet:
    path: /health
    port: 3001
  initialDelaySeconds: 15
  periodSeconds: 10

livenessProbe:
  httpGet:
    path: /health
    port: 3001
  initialDelaySeconds: 30
  periodSeconds: 20

resources:
  requests:
    memory: 64Mi
    cpu: 50m
  limits:
    memory: 256Mi
    cpu: 300m
```

### 12.3 Database PersistentVolumeClaims

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: db-patients-pvc
  namespace: hms
spec:
  accessModes: [ReadWriteOnce]
  resources:
    requests:
      storage: 1Gi
```

### 12.4 Secrets and ConfigMaps

Sensitive values are stored in Kubernetes Secrets:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-secret
  namespace: hms
type: Opaque
stringData:
  DB_USER: postgres
  DB_PASSWORD: <redacted>
```

Non-sensitive shared config is stored in a ConfigMap:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: hms-config
  namespace: hms
data:
  DB_PORT: "5432"
  NOTIFICATION_SERVICE_URL: "http://notification-service:3007/v1"
  BILLING_SERVICE_URL: "http://billing-service:3004/v1"
```

### 12.5 Ingress

The nginx Ingress controller routes traffic:

```yaml
rules:
  - host: hms.local
    http:
      paths:
        - path: /           → frontend:80
        - path: /v1/patients → patient-service:3001
        - path: /v1/doctors  → doctor-service:3002
        # ... etc
```

---

## 13. Resilience and Observability

### 13.1 Structured JSON Logging

All seven services use a shared logger middleware that outputs newline-delimited JSON:

```json
{
  "timestamp": "2026-05-12T10:30:00.000Z",
  "level": "INFO",
  "message": "POST /v1/appointments - 201",
  "meta": {
    "correlationId": "a1b2c3d4",
    "duration_ms": 45
  }
}
```

**PII Masking:** The logger automatically masks sensitive fields before writing:

```javascript
const PII_FIELDS = ['email', 'phone', 'password', 'ssn', 'dob', 'address'];
// Output: { "email": "***", "phone": "***" }
```

### 13.2 Health Endpoints

Every service exposes a `/health` endpoint:

```json
{
  "status": "UP",
  "service": "appointment-service",
  "timestamp": "2026-05-12T10:30:00.000Z"
}
```

Used by Docker Compose health checks, Kubernetes liveness/readiness probes, and Grafana uptime monitoring.

### 13.3 Prometheus Metrics

Each service exposes `/metrics` in Prometheus text format via the `prom-client` library.

**Default metrics (all services):**
- `process_cpu_seconds_total`
- `process_resident_memory_bytes`
- `nodejs_eventloop_lag_seconds`
- `nodejs_active_handles_total`

**Custom business metrics:**

| Metric | Type | Service | Description |
|---|---|---|---|
| `appointments_created_total` | Counter | appointment | Total appointments booked |
| `appointments_cancelled_total` | Counter | appointment | Total cancellations |
| `bill_creation_latency_ms` | Histogram | billing | Time to create a bill |
| `payments_success_total` | Counter | payment | Successful payments |
| `payments_failed_total` | Counter | payment | Failed payment attempts |
| `http_requests_total` | Counter | all | Requests by method/route/status |
| `http_request_duration_ms` | Histogram | all | Request latency per route |

### 13.4 Grafana Dashboards

Grafana (accessible at `http://localhost:3000`) is connected to Prometheus as a data source and provides the following dashboard panels:

| Panel | Query |
|---|---|
| Total Appointments Created | `appointments_created_total` |
| Request Rate by Service | `sum(rate(http_requests_total[5m])) by (service)` |
| 95th Percentile Latency | `histogram_quantile(0.95, rate(http_request_duration_ms_bucket[5m]))` |
| Bill Creation Latency | `histogram_quantile(0.95, rate(bill_creation_latency_ms_bucket[5m]))` |
| Payment Success Rate | `rate(payments_success_total[5m])` |
| HTTP Error Rate | `sum(rate(http_requests_total{status_code=~"5.."}[5m])) by (service)` |

### 13.5 Graceful Degradation

RabbitMQ provides natural resilience — if a downstream consumer (billing or notification service) is temporarily unavailable, messages persist in the durable queue and are processed once the service recovers. The appointment-service publishes and returns immediately without waiting for consumers, ensuring appointment operations are never blocked by downstream failures. Synchronous HTTP calls (e.g., payment → billing) are wrapped in `try/catch` with a 3-second timeout, and failures are logged with the correlation ID without rolling back the primary transaction.

---

## 14. Testing and Validation

### 14.1 API Testing

All endpoints were tested using HTTP clients verifying:
- Correct status codes (200, 201, 400, 401, 403, 404, 409, 500)
- Standard error schema on all failure responses
- Correct data returned for all CRUD operations
- Business rule enforcement (slot conflicts, lead time, daily caps)

### 14.2 Validation Scenarios Tested

| Scenario | Expected Result | Verified |
|---|---|---|
| Book appointment with <2h lead time | 400 LEAD_TIME_VIOLATION | ✅ |
| Book overlapping slot for same doctor | 409 SLOT_CONFLICT | ✅ |
| Reschedule more than 2 times | 400 MAX_RESCHEDULES_EXCEEDED | ✅ |
| Pay an already-paid bill | 409 BILL_ALREADY_PAID | ✅ |
| Duplicate payment with same Idempotency-Key | 200 (returns existing) | ✅ |
| Access admin endpoint with patient role | 403 FORBIDDEN | ✅ |
| Cancel appointment >2h before slot | FULL_REFUND policy | ✅ |
| Cancel appointment ≤2h before slot | PARTIAL_REFUND_50_PERCENT | ✅ |

### 14.3 Docker and Kubernetes Validation

```bash
# All 15 containers running (7 services + 7 DBs + frontend)
docker ps --format "table {{.Names}}\t{{.Status}}"

# All pods Running in hms namespace
kubectl get pods -n hms

# Health check responses
curl http://localhost:3001/health  # {"status":"UP","service":"patient-service"}
curl http://localhost:3003/health  # {"status":"UP","service":"appointment-service"}

# Metrics endpoint
curl http://localhost:3001/metrics  # Prometheus text format
```

---

## 15. Conclusions and Recommendations

### 15.1 Conclusions

The Hospital Management System successfully demonstrates a production-grade microservices architecture applied to the healthcare domain. The key outcomes achieved are:

1. **Domain isolation** — Each service owns its data, enforces its own business rules, and communicates through contracts, not shared databases.

2. **Resilience** — The EventBus pattern ensures that downstream service failures do not cascade. The primary business operation succeeds even when notifications or billing events fail to deliver.

3. **Observability** — Structured JSON logging with correlation IDs, Prometheus metrics, and Grafana dashboards provide full visibility into system health and behaviour at minimal runtime cost.

4. **Portability** — The same application runs identically across local Node.js processes, Docker Compose, and Kubernetes, enabled by environment-based configuration and nginx proxying.

5. **Security** — JWT-based RBAC ensures that every endpoint is accessible only to authorised roles, and PII masking prevents sensitive data from appearing in log aggregation systems.

### 15.2 Recommendations for Further Development

1. **Circuit breaker** — Implement Hystrix or `opossum` (Node.js) on inter-service HTTP calls to prevent cascade failures under high load.

3. **Distributed tracing** — Integrate OpenTelemetry with Jaeger or Zipkin to trace requests across all seven services end-to-end.

4. **API Gateway** — Introduce Kong or AWS API Gateway in front of all services to centralise rate limiting, authentication, and request routing.

5. **Horizontal scaling** — The stateless service design supports horizontal scaling. Kubernetes HorizontalPodAutoscaler can be added with CPU-based scaling rules.

6. **CI/CD pipeline** — Implement GitHub Actions to automate testing, Docker image builds, and Kubernetes deployments on every push.

---

## Appendices

### Appendix A: Service Port Reference

| Service | Port | Database |
|---|---|---|
| patient-service | 3001 | hms_patients |
| doctor-service | 3002 | hms_doctors |
| appointment-service | 3003 | hms_appointment |
| billing-service | 3004 | hms_billing |
| payment-service | 3005 | hms_payments |
| prescription-service | 3006 | hms_prescriptions |
| notification-service | 3007 | hms_notifications |
| frontend (nginx) | 4200 | — |
| Prometheus | 9090 | — |
| Grafana | 3000 | — |

### Appendix B: Running the Application

#### Local Development
```bash
# Start all backend services and frontend
.\hms.ps1 local:start

# Or individually
npm run start:patient
npm run start:appointment
npm run start:frontend
```

#### Docker Compose
```bash
# Build and start all containers
npm run docker:rebuild

# Stop all containers
npm run docker:stop
```

#### Kubernetes (Minikube)
```bash
# Full setup (start Minikube + build images + deploy)
npm run k8s:setup

# Check pod status
npm run k8s:status

# Open the app
npm run k8s:open
```

### Appendix C: Environment Variables

Each service requires a `.env` file with the following variables:

```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hms_patients
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
```

### Appendix D: Seed Data Reference

The system was seeded with the following data for testing and demonstration:

| Entity | Count |
|---|---|
| Patients | 60 |
| Doctors | 25 |
| Appointments | 300 |
| Prescriptions | 220 |
| Bills | 300 |
| Payments | ~260 |

---

## References

1. Newman, S. (2021). *Building Microservices: Designing Fine-Grained Systems* (2nd ed.). O'Reilly Media.
2. Richardson, C. (2018). *Microservices Patterns*. Manning Publications.
3. Docker Inc. (2024). *Docker Documentation*. https://docs.docker.com
4. Kubernetes Authors. (2024). *Kubernetes Documentation*. https://kubernetes.io/docs
5. Angular Team. (2024). *Angular Documentation*. https://angular.dev
6. Prometheus Authors. (2024). *Prometheus Documentation*. https://prometheus.io/docs
7. PostgreSQL Global Development Group. (2024). *PostgreSQL 17 Documentation*. https://www.postgresql.org/docs/17/
8. Fowler, M. (2014). *Microservices*. https://martinfowler.com/articles/microservices.html
9. RFC 7519 — JSON Web Token (JWT). (2015). Internet Engineering Task Force.

---

## Glossary

| Term | Definition |
|---|---|
| **API** | Application Programming Interface — a contract for how software components communicate |
| **Bounded Context** | A logical boundary within which a domain model is defined and applicable |
| **Circuit Breaker** | A pattern that stops calling a failing service to allow it time to recover |
| **ClusterIP** | A Kubernetes Service type that provides an internal IP accessible only within the cluster |
| **ConfigMap** | A Kubernetes resource for storing non-sensitive configuration data as key-value pairs |
| **Correlation ID** | A unique identifier attached to a request and propagated across all services to enable end-to-end tracing |
| **Docker Compose** | A tool for defining and running multi-container Docker applications |
| **EventBus** | An abstraction layer for publishing domain events to subscribers |
| **Idempotency** | The property of an operation that produces the same result regardless of how many times it is applied |
| **Ingress** | A Kubernetes resource that manages external HTTP/HTTPS access to services |
| **JWT** | JSON Web Token — a compact, URL-safe token for representing claims between parties |
| **Minikube** | A tool for running a single-node Kubernetes cluster locally |
| **Microservice** | A small, independently deployable service that implements a specific business capability |
| **nginx** | A high-performance HTTP server and reverse proxy |
| **PII** | Personally Identifiable Information — data that can identify an individual (e.g., email, phone) |
| **PVC** | PersistentVolumeClaim — a request for durable storage in Kubernetes |
| **RBAC** | Role-Based Access Control — restricting system access based on user roles |
| **REST** | Representational State Transfer — an architectural style for distributed hypermedia systems |
| **SPA** | Single Page Application — a web app that loads once and updates dynamically |
