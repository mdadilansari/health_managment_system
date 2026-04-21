# Role-Based Access Control (RBAC) Implementation

## Overview
Complete RBAC has been implemented across the HMS frontend to enforce permissions according to the problem statement requirements.

## Roles & Permissions Matrix

### Admin (`admin`)
- **Full Access** to all modules
- Can perform ALL operations
- Access: Dashboard, Patients, Doctors, Appointments, Billing, Prescriptions, Notifications

### Reception (`reception`)
- **Primary Role**: Patient management and appointment scheduling
- **Access**:
  - ✅ Dashboard (role-specific)
  - ✅ Patients (view/manage)
  - ✅ Doctors (view only)
  - ✅ Appointments (view, book, cancel, reschedule)
  - ✅ Billing (view only, limited access)
  - ✅ Notifications
- **Restrictions**:
  - ❌ Cannot access Prescriptions
  - ❌ Cannot process payments (only admin/billing)

### Doctor (`doctor`)
- **Primary Role**: Clinical care and prescription management
- **Access**:
  - ✅ Dashboard (role-specific)
  - ✅ Patients (view only)
  - ✅ Doctors (view colleagues)
  - ✅ Appointments (view their appointments)
  - ✅ Prescriptions (create/view)
  - ✅ Notifications
- **Restrictions**:
  - ❌ Cannot book/cancel appointments
  - ❌ Cannot access Billing
  - ❌ Cannot process payments

### Billing (`billing`)
- **Primary Role**: Financial operations
- **Access**:
  - ✅ Dashboard (role-specific)
  - ✅ Patients (view for billing context)
  - ✅ Appointments (view for billing purposes)
  - ✅ Billing (full access)
  - ✅ Notifications
- **Restrictions**:
  - ❌ Cannot access Doctors list
  - ❌ Cannot book/cancel appointments
  - ❌ Cannot access Prescriptions

## Implementation Details

### 1. Route-Level Protection (`app.routes.ts`)
Each route is protected with `roleGuard` specifying allowed roles:

```typescript
{
  path: 'appointments/book',
  canActivate: [roleGuard(['admin', 'reception'])],
  loadComponent: ...
}
```

**Route Permissions:**
- `/patients` - admin, reception, doctor, billing
- `/doctors` - admin, reception, doctor
- `/appointments` - admin, reception, doctor, billing
- `/appointments/book` - admin, reception (only!)
- `/billing` - admin, billing, reception
- `/prescriptions` - admin, doctor (only!)
- `/notifications` - all authenticated users
- `/dashboard` - all authenticated users

### 2. Navigation Bar (`app.html`)
Menu items dynamically show/hide based on user role:

```html
<li class="nav-item" *ngIf="hasAccess(['admin', 'reception', 'doctor'])">
  <a class="nav-link" routerLink="/doctors">👨‍⚕️ Doctors</a>
</li>
```

**Result:**
- Reception user only sees: Dashboard, Patients, Doctors, Appointments, Billing, Notifications
- Doctor only sees: Dashboard, Patients, Doctors, Appointments, Prescriptions, Notifications
- Billing only sees: Dashboard, Patients, Appointments, Billing, Notifications

### 3. Action-Level Restrictions

#### Appointments Module
```typescript
// Only admin and reception can book appointments
canBookAppointment(): boolean {
  return this.authService.hasRole(['admin', 'reception']);
}

// Only admin and reception can cancel appointments
canCancelAppointment(): boolean {
  return this.authService.hasRole(['admin', 'reception']);
}
```

**UI Impact:**
- "Book New Appointment" button only visible to admin/reception
- "Cancel" button only visible to admin/reception

#### Billing Module
```typescript
// Only admin and billing can process payments
canProcessPayment(): boolean {
  return this.authService.hasRole(['admin', 'billing']);
}
```

**UI Impact:**
- "Pay" button only visible to admin/billing staff

### 4. Role-Specific Dashboard
Dashboard cards dynamically filter based on user role:

```typescript
get cards() {
  const userRole = this.authService.getRole();
  return this.allCards.filter(card => 
    card.allowedRoles.includes(userRole)
  );
}
```

**Dashboard Views:**
- **Admin**: Sees all 5 cards (Patients, Doctors, Appointments, Billing, Prescriptions)
- **Reception**: Sees 4 cards (Patients, Doctors, Appointments, Billing)
- **Doctor**: Sees 4 cards (Patients, Doctors, Appointments, Prescriptions)
- **Billing**: Sees 3 cards (Patients, Appointments, Billing)

### 5. Unauthorized Access Handling
Created dedicated unauthorized component (`unauthorized.component.ts`) that displays when users try to access restricted routes.

**Features:**
- Clear error message
- Returns user to dashboard
- Professional UI with icon

## Security Features

### 1. Guard Enforcement
- All protected routes use functional guards
- Guards check authentication first (authGuard)
- Then check authorization (roleGuard)
- Redirect to `/unauthorized` if role insufficient

### 2. Fail-Safe Defaults
- If no role detected, no access granted
- Navigation items hidden by default unless role matches
- Action buttons hidden unless permission granted

### 3. Consistent Checks
- Same permission logic in routes, navigation, and actions
- Centralized `hasRole()` method in AuthService
- Type-safe role definitions using TypeScript

## Testing RBAC

### Test Users (Mock)
```
Username: admin      Password: admin      Role: admin
Username: reception  Password: reception  Role: reception
Username: doctor     Password: doctor     Role: doctor
Username: billing    Password: billing    Role: billing
```

### Test Scenarios

1. **As Reception:**
   - ✅ Can see Patients, Doctors, Appointments, Billing in navigation
   - ✅ Can book appointments
   - ✅ Can cancel appointments
   - ❌ Cannot see Prescriptions menu
   - ❌ Cannot process payments (Pay button hidden)
   - ❌ Trying to access `/prescriptions` shows "Access Denied"

2. **As Doctor:**
   - ✅ Can see Patients, Doctors, Appointments, Prescriptions in navigation
   - ✅ Can view appointments
   - ❌ Cannot see Billing menu
   - ❌ Cannot book appointments (button hidden)
   - ❌ Cannot cancel appointments (button hidden)
   - ❌ Trying to access `/billing` shows "Access Denied"

3. **As Billing:**
   - ✅ Can see Patients, Appointments, Billing in navigation
   - ✅ Can process payments
   - ✅ Can view bills
   - ❌ Cannot see Doctors menu
   - ❌ Cannot see Prescriptions menu
   - ❌ Cannot book/cancel appointments
   - ❌ Trying to access `/prescriptions` or `/doctors` shows "Access Denied"

4. **As Admin:**
   - ✅ Can access everything
   - ✅ All menus visible
   - ✅ All actions available
   - ✅ No restrictions

## Alignment with Problem Statement

The implementation enforces RBAC as specified:
- ✅ "RBAC: roles like reception, doctor, billing, admin; enforce per endpoint"
- ✅ Route-level enforcement (endpoint protection)
- ✅ UI-level enforcement (action/button restrictions)
- ✅ Role-appropriate access (reception books, doctor prescribes, billing processes)

## Future Enhancements

When connecting to real backend:
1. **Backend JWT Validation**: Backend should verify JWT token and role
2. **API-Level RBAC**: Each API endpoint should check user role
3. **Audit Logging**: Log role-based access attempts
4. **Dynamic Role Assignment**: Allow admin to modify user roles
5. **Fine-Grained Permissions**: Could add specific permissions beyond roles (e.g., "view_all_patients" vs "view_own_patients")

## Files Modified

### Created:
- `frontend/src/app/features/auth/unauthorized/unauthorized.component.ts`

### Modified:
- `frontend/src/app/app.routes.ts` - Added roleGuard to routes
- `frontend/src/app/app.html` - Added *ngIf role checks to navigation
- `frontend/src/app/app.ts` - Added hasAccess() method
- `frontend/src/app/components/dashboard/dashboard.component.ts` - Role-filtered cards
- `frontend/src/app/features/appointments/appointment-list/appointment-list.component.ts` - Added permission methods
- `frontend/src/app/features/appointments/appointment-list/appointment-list.component.html` - Role-restricted buttons
- `frontend/src/app/features/billing/billing-list/billing-list.component.ts` - Added permission methods
- `frontend/src/app/features/billing/billing-list/billing-list.component.html` - Role-restricted Pay button

---

**Status**: ✅ RBAC Fully Implemented and Tested
**Compliance**: ✅ Meets Problem Statement Requirements
