# Doctor Service

REST API for managing doctor records.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update `.env` with your PostgreSQL credentials:
```
PORT=3002
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hms_doctors
DB_USER=postgres
DB_PASSWORD=your_actual_password
```

## Running

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Get all doctors
```
GET http://localhost:3002/api/doctors
```

### Get doctors by department
```
GET http://localhost:3002/api/doctors?department=Cardiology
```

### Get departments list
```
GET http://localhost:3002/api/doctors/departments
```

### Get single doctor
```
GET http://localhost:3002/api/doctors/:id
```

### Health check
```
GET http://localhost:3002/health
```

## Testing

```bash
# Get all doctors
curl http://localhost:3002/api/doctors

# Get cardiologists
curl http://localhost:3002/api/doctors?department=Cardiology

# Get departments
curl http://localhost:3002/api/doctors/departments

# Get specific doctor
curl http://localhost:3002/api/doctors/1

# Health check
curl http://localhost:3002/health
```
