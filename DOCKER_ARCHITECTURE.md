# Docker Architecture — Hospital Management System

## Overview

The HMS application is fully containerized using Docker and orchestrated with Docker Compose.
It runs **15 containers** in total: 7 microservices, 7 PostgreSQL databases, and 1 frontend — all on a shared Docker network.

---

## Container Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Docker Network (bridge)                            │
│                                                                             │
│   Browser                                                                   │
│   localhost:4200 ──► ┌─────────────────────┐                               │
│                       │  frontend (nginx)   │  port 80 internally          │
│                       │  Angular SPA        │                               │
│                       └──────────┬──────────┘                               │
│                                  │ HTTP calls to localhost:300x             │
│   ┌──────────────────────────────┼──────────────────────────────────────┐   │
│   │                    Microservices Layer                               │   │
│   │                                                                      │   │
│   │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐        │   │
│   │  │ patient-svc    │  │ doctor-svc     │  │ appointment-svc│        │   │
│   │  │ Node.js :3001  │  │ Node.js :3002  │  │ Node.js :3003  │        │   │
│   │  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘        │   │
│   │          │                   │                    │                  │   │
│   │  ┌───────▼────────┐  ┌───────▼────────┐  ┌───────▼────────┐        │   │
│   │  │ db-patients    │  │ db-doctors     │  │ db-appointments│        │   │
│   │  │ postgres:17    │  │ postgres:17    │  │ postgres:17    │        │   │
│   │  │ hms_patients   │  │ hms_doctors    │  │ hms_appointment│        │   │
│   │  └────────────────┘  └────────────────┘  └────────────────┘        │   │
│   │                                                                      │   │
│   │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐        │   │
│   │  │ billing-svc    │  │ payment-svc    │  │ prescription-  │        │   │
│   │  │ Node.js :3004  │  │ Node.js :3005  │  │ svc :3006      │        │   │
│   │  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘        │   │
│   │          │                   │                    │                  │   │
│   │  ┌───────▼────────┐  ┌───────▼────────┐  ┌───────▼────────┐        │   │
│   │  │ db-billing     │  │ db-payments    │  │ db-prescriptions│        │   │
│   │  │ postgres:17    │  │ postgres:17    │  │ postgres:17    │        │   │
│   │  │ hms_billing    │  │ hms_payments   │  │ hms_prescripti.│        │   │
│   │  └────────────────┘  └────────────────┘  └────────────────┘        │   │
│   │                                                                      │   │
│   │  ┌────────────────┐                                                  │   │
│   │  │notification-svc│                                                  │   │
│   │  │ Node.js :3007  │                                                  │   │
│   │  └───────┬────────┘                                                  │   │
│   │          │                                                            │   │
│   │  ┌───────▼────────┐                                                  │   │
│   │  │db-notifications│                                                  │   │
│   │  │ postgres:17    │                                                  │   │
│   │  │hms_notifications│                                                 │   │
│   │  └────────────────┘                                                  │   │
│   └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Inter-Service Communication

```
appointment-service ──► notification-service  (on book/cancel/reschedule/complete)
appointment-service ──► billing-service       (on complete/cancel/no-show)
payment-service     ──► billing-service       (mark bill PAID after payment)
payment-service     ──► notification-service  (send payment confirmation)
```

All inter-service calls use **internal Docker DNS** (container names as hostnames):
- `http://notification-service:3007/v1`
- `http://billing-service:3004/v1`

---

## Container Reference

| Container Name | Image | Host Port | Internal Port | Database |
|---|---|---|---|---|
| frontend | nginx:alpine (custom) | 4200 | 80 | — |
| patient-service | node:20-alpine (custom) | 3001 | 3001 | hms_patients |
| doctor-service | node:20-alpine (custom) | 3002 | 3002 | hms_doctors |
| appointment-service | node:20-alpine (custom) | 3003 | 3003 | hms_appointment |
| billing-service | node:20-alpine (custom) | 3004 | 3004 | hms_billing |
| payment-service | node:20-alpine (custom) | 3005 | 3005 | hms_payments |
| prescription-service | node:20-alpine (custom) | 3006 | 3006 | hms_prescriptions |
| notification-service | node:20-alpine (custom) | 3007 | 3007 | hms_notifications |
| db-patients | postgres:17-alpine | — | 5432 | hms_patients |
| db-doctors | postgres:17-alpine | — | 5432 | hms_doctors |
| db-appointments | postgres:17-alpine | — | 5432 | hms_appointment |
| db-billing | postgres:17-alpine | — | 5432 | hms_billing |
| db-payments | postgres:17-alpine | — | 5432 | hms_payments |
| db-prescriptions | postgres:17-alpine | — | 5432 | hms_prescriptions |
| db-notifications | postgres:17-alpine | — | 5432 | hms_notifications |

> Database containers are **not exposed** to the host machine — only accessible by services within the Docker network.

---

## Frontend Docker Build (Multi-Stage)

```
Stage 1 — Builder (node:20-alpine)
  ├── npm install
  ├── ng build --configuration production
  └── Output: dist/frontend/browser/

Stage 2 — Server (nginx:alpine)
  ├── Copy dist/ → /usr/share/nginx/html
  ├── nginx.conf: SPA fallback (try_files → index.html)
  └── EXPOSE 80
```

The multi-stage build keeps the final image small — Node.js and build tools are discarded, only static files + nginx are shipped.

---

## Backend Service Dockerfile

Each of the 7 backend services uses the same Dockerfile pattern:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev     # production deps only
COPY . .
EXPOSE <port>
CMD ["node", "src/index.js"]
```

`--omit=dev` excludes devDependencies (e.g. nodemon) from the image, keeping it lean.

---

## Volumes (Persistent Data)

Each database has its own named volume, so data survives container restarts:

```
db-patients-data       → /var/lib/postgresql/data  (hms_patients)
db-doctors-data        → /var/lib/postgresql/data  (hms_doctors)
db-appointments-data   → /var/lib/postgresql/data  (hms_appointment)
db-billing-data        → /var/lib/postgresql/data  (hms_billing)
db-payments-data       → /var/lib/postgresql/data  (hms_payments)
db-prescriptions-data  → /var/lib/postgresql/data  (hms_prescriptions)
db-notifications-data  → /var/lib/postgresql/data  (hms_notifications)
```

---

## Health Checks

All database containers have a health check configured:
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U postgres"]
  interval: 10s
  timeout: 5s
  retries: 5
```

Microservices use `depends_on: condition: service_healthy` — they only start after their database passes the health check.

---

## Environment Configuration

A single `.env` file at the project root controls the shared DB password:

```env
DB_PASSWORD=postgres
```

Each service container receives its own environment variables via `docker-compose.yml`:
```yaml
environment:
  PORT: 3001
  DB_HOST: db-patients      # Docker internal hostname
  DB_PORT: 5432
  DB_NAME: hms_patients
  DB_USER: postgres
  DB_PASSWORD: ${DB_PASSWORD:-postgres}
```

---

## Common Commands

```powershell
# Start all containers (background)
docker-compose up -d

# Start and rebuild images
docker-compose up --build -d

# Stop all containers (data preserved)
docker-compose down

# Stop and delete all data volumes
docker-compose down -v

# View logs for all services
docker-compose logs -f

# View logs for one service
docker-compose logs -f appointment-service

# Check container status
docker ps

# Restart one service
docker-compose restart patient-service

# Or use the project script
.\hms.ps1 docker:start
.\hms.ps1 docker:stop
.\hms.ps1 docker:status
.\hms.ps1 docker:logs
```

---

## Seeding Data (First-Time Setup)

On first run, databases are empty. Load data by copying SQL dumps into containers:

```powershell
docker cp .\docker-seeds\patients.sql      health_managment_system-db-patients-1:/seed.sql
docker exec health_managment_system-db-patients-1 psql -U postgres -d hms_patients -f /seed.sql

# Repeat for: doctors, appointments, billing, payments, prescriptions
```

The `hms_notifications` table is **auto-created** by the notification service on startup — no seed needed.
