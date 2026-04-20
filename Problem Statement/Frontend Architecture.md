Angular Application Structure
App Architecture
hms-frontend/
├── core/                  # Auth, interceptors, guards
├── shared/                # Reusable components, pipes, directives
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── patients/
│   ├── doctors/
│   ├── appointments/
│   ├── prescriptions/
│   ├── billing/
│   └── notifications/
└── layouts/               # Shell, sidebar, topbar

Modules / Feature Areas
1. Auth Module

Login page (role-based: reception, doctor, billing, admin)
JWT token handling via HTTP interceptor
Route guards per role (canActivate)
Auto logout on token expiry


2. Dashboard (Role-aware)
Each role sees a different dashboard:
RoleDashboard ContentAdminAll KPIs — total patients, appointments today, revenue, no-showsReceptionToday's appointments, check-in queue, pending bookingsDoctorMy schedule today, pending prescriptions, patient historyBillingUnpaid bills, recent payments, cancellation fees pending
Use Angular standalone components + NgRx signals or a simple service store for dashboard state.

3. Patient Module
Pages:

Patient list (searchable by name/phone, paginated)
Patient detail view (appointments history, bills, prescriptions)
Create / Edit patient form
Soft delete / deactivate patient

Key UX considerations:

Phone/email shown masked in list view (PII) — full detail only on detail page with role check
Search with debounce (RxJS debounceTime + distinctUntilChanged)


4. Doctor & Scheduling Module
Pages:

Doctor list with department filter
Doctor detail (specialization, today's schedule, slot availability calendar)
Weekly availability view (calendar grid)

Key UX:

Department filter as a chip/tag selector
Slot availability shown as a time grid (available = green, booked = grey, held = yellow)


5. Appointment Module
This is the most complex module.
Pages:

Appointment list (filters: date, status, department, doctor)
Book appointment flow (multi-step form):

Select patient
Select department → doctor
Pick available slot (calendar/time picker)
Confirm & submit


Appointment detail view (status, timeline, actions)
Reschedule flow (inline slot picker, shows reschedule count left)
Cancel flow (confirmation modal with policy shown — refund/fee)

Status badge colors:
SCHEDULED  → blue
COMPLETED  → green
CANCELLED  → red
NO_SHOW    → orange
Concurrency UX: Show a countdown timer (60s) when a slot is "held" during booking.

6. Prescription Module
Pages:

Prescription list (filterable by patient, doctor, date)
Create prescription (linked to a completed/active appointment)
Prescription detail / print view (printable layout)

Key UX:

Doctor role only can create
Appointment selector only shows valid appointments (not cancelled)
Print-friendly CSS for prescription card


7. Billing Module
Pages:

Bill list (filter by status: OPEN, PAID, VOID)
Bill detail (line items: consultation, meds, 5% tax, cancellation fee)
Generate bill (triggered after appointment COMPLETED)
Payment flow (method selector: cash, card, UPI; idempotency key auto-generated)
Refund/credit note view

Key UX:

Line items locked after PAID (read-only, with adjustment note option)
Tax breakdown shown clearly
Status chip: OPEN → PAID → REFUND


8. Notification Module
In-app alerts (since SMS/email is backend-driven):

Toast notifications for: booking confirmed, reschedule, cancellation, payment received
Notification bell in topbar with unread count
Notification list/drawer with mark-as-read

Use Angular's MatSnackBar or a custom toast service fed by polling or WebSocket.

Cross-Cutting Angular Concerns
HTTP Layer

One ApiService per microservice (base URL from environment)
Global HTTP interceptor for: JWT attachment, correlation ID header, error normalization
Retry logic with RxJS retry(2) for transient failures

Error Handling

Global error handler mapping backend { code, message, correlationId } to user-friendly messages
Show correlationId in error dialogs for support reference

Pagination & Filtering

Shared PaginatorComponent used across all list pages
URL query params synced with filters (so links are shareable)
Use ActivatedRoute + queryParamMap to persist filter state

Role-Based UI
typescript// Structural directive
*hasRole="['admin', 'billing']"
Hide/show buttons, menu items, and entire routes based on role.
State Management

Keep it simple: RxJS-based services with BehaviorSubject for most features
Use NgRx only if appointment booking flow gets complex (slot hold timer, multi-step state)

Forms

Reactive Forms throughout (FormGroup, FormBuilder)
Custom validators: slot lead time ≥ 2h, phone format, date range
AsyncValidators for checking patient/doctor existence via API


UI Component Library
Use Angular Material as the base:
NeedComponentTables/listsmat-table + mat-paginatorFormsmat-form-field, mat-selectDate/time pickingmat-datepicker + custom time pickerModalsmat-dialogNotificationsmat-snack-barStatus chipsmat-chipCalendar/slotsCustom grid or @schedule-x/angular

Routing Structure
/login
/dashboard
/patients
/patients/:id
/doctors
/doctors/:id
/appointments
/appointments/new         ← booking flow
/appointments/:id
/appointments/:id/reschedule
/prescriptions
/prescriptions/new
/billing
/billing/:id
/payments/:id
All routes except /login protected by an AuthGuard. Sub-routes additionally protected by RoleGuard.

Key Angular-Specific Tips

Use lazy loading for every feature module — the app will be large
Use OnPush change detection everywhere for performance
Use trackBy in all *ngFor loops (especially appointment/patient lists)
Environment files for service base URLs (environment.ts per service)
Use Angular Signals (v17+) for local UI state like slot selection and form steps