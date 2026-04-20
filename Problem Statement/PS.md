Build a microservices-based Hospital Management System around the provided data. Use
database-per-service (no shared tables; no cross-DB joins). If multiple services need the
same fields, use replicated read models or API composition.
Base tables (seed provided)
 Patients(patient_id, name, email, phone, dob, created_at)
 Doctors(doctor_id, name, email, phone, department, specialization, created_at)
 Appointments(appointment_id, patient_id, doctor_id, department, slot_start, slot_end,
status, created_at)
 Prescriptions(prescription_id, appointment_id, patient_id, doctor_id, medication,
dosage, days, issued_at)
 Bills(bill_id, patient_id, appointment_id, amount, status, created_at)
 Payments(payment_id, bill_id, amount, method, reference, paid_at)
Seed size (for local dev): 60 patients · 25 doctors · 300 appointments · 220 prescriptions ·
300 bills (+ payments)
1) Microservices (each in its own repo)
a. Patient Service
o CRUD for patients; search by name/phone; PII masking in logs.
b. Doctor &amp; Scheduling Service
o Doctors listing, department filter, slot availability checks.
c. Appointment Service
o Book/reschedule/cancel; constraints &amp; slot collision checks.
d. Billing Service
o Generate bill for completed appointments; compute taxes; handle
cancellations.
e. Prescription Service
o Create/read prescriptions (requires an appointment).
f. Payment Service(Optional)
o Capture refunds and payments (idempotent charge).
g. Notification Service

o SMS/Email reminders for appointments/bill payments. (show it as an alert)
API Requirements: version /v1, OpenAPI 3.0, standard error schema (code, message,
correlationId), pagination &amp; filtering.
2) Database-Per-Service Split
Add minimal projections where needed (e.g., Appointment DB may cache doctor_department
for reporting).
3) Inter-Service Workflows (business logic)
a. Book Appointment
 Patient must exist and be active.
 Doctor must exist, be active, and belong to the requested department.
 Slot must be within clinic hours and lead time (e.g., ≥ 2h from “now”).
 No overlap for the same doctor and the same patient (see concurrency rules below).
 Appointment writes record → returns SCHEDULED.
 Appointment → Notification to send confirmation.
Concurrency rule
 Appointment Service uses optimistic locking (e.g., version field) or a short-lived slot
hold (e.g., 60 seconds) before creating the record to prevent double booking under
race.
b. Reschedule Appointment
1. Client → Appointment Service /v1/appointments/{id}/reschedule with new slot.
2. Appointment → Doctor Service: check availability + policy limits (see rules).
3. Appointment updates slot and bumps version; returns SCHEDULED.
4. Appointment → Notification: reschedule notice; cancel prior reminders, create new
ones.
Rules
 Max 2 reschedules per appointment.
 Cut-off: cannot reschedule within 1 hour of slot start.

c. Cancel Appointment
1. Client/Admin → Appointment Service /v1/appointments/{id}/cancel.
2. Appointment sets CANCELLED, releases held slot.

3. Appointment → Billing Service: mark any associated bill VOID or apply
cancellation fee per policy.
4. Notification: send cancellation confirmation and (if applicable) refund note.
Policy examples
 Cancel &gt; 2h before start → full refund.
 Cancel ≤ 2h → 50% fee (document amount or rule).
 No-show (see next) → 100% consultation fee charged or flagged for manual review.
d. No-Show Handling (system/desk action)
1. Reception marks appointment NO_SHOW after grace period (e.g., 15 minutes).
2. Appointment → Billing: create/adjust bill per no-show fee policy.
3. Notification: optional follow-up (rebook link or contact desk).

e. Complete Appointment → Bill &amp; Pay
1. Appointment status → COMPLETED.
2. Appointment → Billing Service to create bill (consultation + meds + 5% tax).
3. Client → Payment Service /v1/payments/charge (with Idempotency-Key).
4. Payment updates Bill to PAID, notifies Notification.
Rules
 Max 1 active appointment per patient per overlapping time slot.
 No Prescription without an Appointment.
 Bill for CANCELLED appointment → VOID or fee (your choice—document it).
 Payment endpoints must be idempotent (no double-charging on retries).

Additional Rules &amp; Guardrails
RBAC: roles like reception, doctor, billing, admin; enforce per endpoint.
Slot granularity: define standard slot length (e.g., 30 minutes).
Doctor daily cap: max N appointments/day/doctor to prevent overbo0 oking.
Department mismatch: reject if department in request ≠ doctor’s department.
Time-zone safety: all timestamps in ISO-8601 UTC; UI displays local time.

Status transitions: OPEN → PAID → (REFUND partial/complete); disallow edits to line
items after PAID (use adjustments/credit notes).

4) Containerization with Docker
 Dockerfile per service.
 A docker-compose.yml that boots all services + their DBs for local testing.
 Evidence: docker ps, health endpoints, sample API calls.

5) Deployment on Minikube (Kubernetes)
 Manifests per service:
o Deployment (readiness/liveness probes; resource requests/limits)
o Service (ClusterIP; NodePort/Ingress for the public API)
o ConfigMap/Secret for configuration/credentials
o PVCs for DBs (or point to an external DB)

6) Resilience &amp; Observability (HMS terms)
 Timeouts + bounded retries on cross-service calls.
 Circuit breaker (e.g., Appointment → Doctor; Billing → Payment).
 Rate limits on booking.
 Metrics: appointments_created_total, bill_creation_latency_ms,
payments_failed_total.
 Tracing: Patient → Appointment → Doctor → Billing → Payment.
 Logs: structured JSON; mask PII (email/phone).