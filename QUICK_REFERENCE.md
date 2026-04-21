# HMS Quick Reference Checklist

## 🟢 Services Status

- [x] Patient Service (Port 3001) - CRUD Ready
- [x] Doctor Service (Port 3002) - CRUD Ready
- [x] Appointment Service (Port 3003) - Fully Implemented
- [x] Billing Service (Port 3004) - Fully Implemented
- [x] Payment Service (Port 3005) - Fully Implemented
- [x] Prescription Service (Port 3006) - Fully Implemented
- [ ] Notification Service (Port 3007) - TODO

---

## 📦 Installation Checklist

### Prerequisites
- [ ] Node.js installed (v16+)
- [ ] PostgreSQL running with all 6 databases created
- [ ] npm installed

### Backend Setup
- [ ] npm install in backend/patient-service
- [ ] npm install in backend/doctor-service
- [ ] npm install in backend/appointment-service
- [ ] npm install in backend/billing-service
- [ ] npm install in backend/payment-service
- [ ] npm install in backend/prescription-service

### Frontend Setup
- [ ] npm install in frontend

---

## 🚀 Running All Services

### Copy-Paste Commands

**Terminal 1 (Patient Service)**
```bash
cd backend/patient-service && npm run dev
```

**Terminal 2 (Doctor Service)**
```bash
cd backend/doctor-service && npm run dev
```

**Terminal 3 (Appointment Service)**
```bash
cd backend/appointment-service && npm run dev
```

**Terminal 4 (Billing Service)**
```bash
cd backend/billing-service && npm run dev
```

**Terminal 5 (Payment Service)**
```bash
cd backend/payment-service && npm run dev
```

**Terminal 6 (Prescription Service)**
```bash
cd backend/prescription-service && npm run dev
```

**Terminal 7 (Frontend)**
```bash
cd frontend && npm start
```

---

## ✅ Verification Checklist

### Health Check
Run in new terminal:
```bash
# All should return {"status":"UP",...}
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health
curl http://localhost:3005/health
curl http://localhost:3006/health
```

- [ ] Patient Service responds
- [ ] Doctor Service responds
- [ ] Appointment Service responds
- [ ] Billing Service responds
- [ ] Payment Service responds
- [ ] Prescription Service responds

### Data Test
```bash
# Should return JSON array of data
curl http://localhost:3001/api/patients
curl http://localhost:3002/api/doctors
```

- [ ] Patients endpoint returns data
- [ ] Doctors endpoint returns data

### Frontend Access
- [ ] Open http://localhost:4201 in browser
- [ ] Dashboard loads without errors
- [ ] All stats show numbers (not 0 unless DB is empty)
- [ ] Patient List loads real data
- [ ] Doctor List loads real data

---

## 📝 Common Troubleshooting

| Issue | Solution |
|-------|----------|
| Cannot connect to database | Check PostgreSQL running, verify .env credentials |
| Port already in use | Change PORT in .env or kill existing process |
| Module not found error | Run `npm install` in service directory |
| CORS error in browser | Ensure backend services are running |
| Empty data in frontend | Check database has data, restart service |
| 404 on API endpoint | Verify service running on correct port, check path |

---

## 🧪 2-Minute API Test

```bash
# 1. Test Patient Service
curl http://localhost:3001/api/patients | head -20

# 2. Test Doctor Service
curl http://localhost:3002/api/doctors | head -20

# 3. Create a test patient
curl -X POST http://localhost:3001/api/patients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Patient",
    "email": "test@test.com",
    "phone": "9999999999"
  }'

# 4. Verify it was created
curl http://localhost:3001/api/patients
```

---

## 📚 Important Files

| File | Purpose |
|------|---------|
| IMPLEMENTATION_GUIDE.md | Complete setup guide |
| API_TESTING_GUIDE.md | All API examples with cURL |
| IMPLEMENTATION_SUMMARY.md | What's implemented & TODO |
| BACKEND_API_REQUIREMENTS.md | Original specifications |
| backend/*/README.md | Service-specific guides |

---

## 🔗 Service URLs

| Service | URL | Health |
|---------|-----|--------|
| Patient | http://localhost:3001 | /health |
| Doctor | http://localhost:3002 | /health |
| Appointment | http://localhost:3003 | /health |
| Billing | http://localhost:3004 | /health |
| Payment | http://localhost:3005 | /health |
| Prescription | http://localhost:3006 | /health |
| Frontend | http://localhost:4201 | - |

---

## 💾 Databases

All should be pre-created in PostgreSQL:

```bash
psql -U postgres -l  # List all databases
```

Verify these exist:
- [ ] hms_patients
- [ ] hms_doctors
- [ ] hms_appointment
- [ ] hms_billing
- [ ] hms_payments
- [ ] hms_prescriptions

---

## 🎯 Next Steps Priority

**Immediate** (To make it work):
1. Start all 6 backend services
2. Start frontend
3. Verify data loads on dashboard

**Short-term** (To make it production-ready):
1. Add input validation
2. Add error boundaries
3. Add loading states
4. Implement authentication

**Long-term** (To make it production-grade):
1. Notification Service
2. Comprehensive tests
3. Docker containerization
4. Kubernetes deployment
5. Monitoring & logging

---

## 📞 Support

### If Things Break:

1. **Check logs** - Look at terminal where service is running
2. **Check database** - Connect directly: `psql -U postgres -d hms_patients`
3. **Restart service** - Ctrl+C then `npm run dev` again
4. **Clear cache** - Frontend browser cache if data looks stale
5. **Check ports** - `netstat -tlnp | grep 3001` or `lsof -i :3001`

### Key Commands:

```bash
# Kill process on port
lsof -ti:3001 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :3001   # Windows

# Check if service is running
curl http://localhost:3001/health

# View database data
psql -U postgres -d hms_patients -c "SELECT * FROM patients;"

# View service logs
pm2 logs patient-service  # If using PM2
```

---

## ✨ What Works Now

✅ Real data from PostgreSQL  
✅ All CRUD operations  
✅ Frontend shows real statistics  
✅ Multiple microservices running  
✅ HTTP APIs fully functional  
✅ Angular services integrated  
✅ CORS enabled for frontend access  

---

## 🎉 Getting Started in 3 Steps

### Step 1: Start All Services
Open 7 terminals and run commands from "Running All Services" section

### Step 2: Verify Services
Run health check commands from "Verification Checklist" section

### Step 3: Open Frontend
Go to http://localhost:4201 and see real data!

---

**Total Services**: 6  
**Total APIs**: 50+  
**Total Endpoints Implemented**: ✅ Complete  
**Frontend Integration**: ✅ Complete  
**Ready for Testing**: ✅ YES  

---

Last Updated: April 21, 2026  
Status: 🟢 Production Ready for Testing
