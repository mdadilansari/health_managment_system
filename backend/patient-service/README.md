# Patient Service

Simple REST API for managing patient records.

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
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hms_patients
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

### Get all patients
```
GET http://localhost:3001/api/patients
```

### Get single patient
```
GET http://localhost:3001/api/patients/:id
```

### Health check
```
GET http://localhost:3001/health
```

## Testing

```bash
# Get all patients
curl http://localhost:3001/api/patients

# Get specific patient
curl http://localhost:3001/api/patients/P001

# Health check
curl http://localhost:3001/health
```
