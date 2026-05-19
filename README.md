# 🏥 ClinicAI - AI Clinic Management SaaS

> Complete AI-powered clinic management platform that digitizes paper-based clinics with intelligent diagnostic assistance, prescription generation, and SaaS subscription tiers.

Built for the **AI Hackathon — MERN Stack Final Track**.

---

## 🎯 Features Overview

### 4 User Roles
- **Admin** — Manage staff, view analytics, control subscriptions
- **Doctor** — View appointments, write prescriptions, use AI assistance
- **Receptionist** — Register patients, book appointments
- **Patient** — Self-signup, book appointments, view prescriptions, download PDFs

### Core Modules
- 🔐 JWT authentication + role-based access control
- 👥 Patient management with allergies, chronic conditions, history timeline
- 📅 Appointment booking with conflict detection
- 💊 Prescription writer with multi-medicine support
- 📄 Professional PDF generation (clinic letterhead)
- 🤖 **AI Symptom Checker** (Gemini-powered)
- 🤖 **AI Prescription Explanation** (English/Urdu)
- 🤖 **AI Risk Flagging** (analyze patient history)
- 📊 Analytics dashboards with Recharts
- 💎 SaaS subscription layer (Free / Pro plans)

---

## 📦 Tech Stack

**Frontend:** React 18 + Vite + Tailwind CSS + React Router + Axios + Recharts + Lucide
**Backend:** Node.js + Express + MongoDB (Mongoose) + JWT + PDFKit
**AI:** Google Gemini API (`gemini-1.5-flash`)

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js v18+
- MongoDB (local OR free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account)
- Gemini API key (free at [aistudio.google.com](https://aistudio.google.com/apikey)) — optional for AI features

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

**Edit `.env`:**
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/clinic_saas
# Atlas use kar rahe ho to: mongodb+srv://user:pass@cluster.mongodb.net/clinic_saas
JWT_SECRET=koi_strong_secret_min_32_characters_yaha_likho
JWT_EXPIRE=7d
NODE_ENV=development
GEMINI_API_KEY=your_gemini_key_here   # AI features ke liye
```

**Seed initial users:**
```bash
node seed.js
```

**Start backend:**
```bash
npm run dev   # http://localhost:5000
```

### 2. Frontend Setup (new terminal)

```bash
cd frontend
npm install
npm run dev   # http://localhost:3000
```

Browser kholo: **http://localhost:3000**

### Demo Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@clinic.com` | `admin123` |
| Doctor | `doctor@clinic.com` | `doctor123` |
| Receptionist | `receptionist@clinic.com` | `recep123` |
| Patient | Self-signup at `/register` | — |

---

## 🧪 Complete Test Flow (for demo video)

1. **Admin login** → `/admin/staff` → "Add Staff" → Create another doctor with specialization
2. **Receptionist login** → `/receptionist/patients` → "Register Patient" → Add a patient with allergies
3. Same screen → Click patient → See timeline (empty)
4. `/receptionist/appointments` → "Book Appointment" → Schedule patient with doctor
5. **Doctor login** → Dashboard shows today's appointment → Go to appointments → Click "Prescribe"
6. Fill prescription (diagnosis, medicines, instructions) → Save (appointment auto-marks completed)
7. Doctor → `/doctor/prescriptions/:id` → Click "Download PDF" — verify professional letterhead
8. Doctor → `/doctor/ai-assistant` → Enter symptoms → Get AI analysis
9. Patient detail page → "Run Risk Analysis" → See AI risk flags
10. **Patient login** (Pro plan recommended) → `/patient/prescriptions/:id` → "Generate AI Explanation" → See friendly explanation
11. **Admin** → `/admin/analytics` → See charts → `/admin/subscriptions` → Toggle a user's plan

---

## 🌐 Deployment

### Backend → Render (Free Tier)

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect repo, set **Root Directory** to `backend`
4. Build: `npm install` • Start: `node server.js`
5. Add env vars: `MONGO_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, `NODE_ENV=production`
6. Deploy. Note the URL: `https://your-app.onrender.com`

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → Import GitHub repo
2. Set **Root Directory** to `frontend`
3. Add env var: `VITE_API_URL=https://your-app.onrender.com/api`
4. Deploy

Alternative: **Netlify** for frontend, **Railway** / **Cyclic** for backend.

---

## 🗂 Project Structure

```
clinic-saas/
├── backend/
│   ├── config/db.js
│   ├── models/              # User, Patient, Appointment, Prescription, DiagnosisLog
│   ├── controllers/         # auth, patient, staff, appointment, prescription, ai, analytics
│   ├── routes/
│   ├── middleware/          # auth (JWT + RBAC + Pro plan gate), errors
│   ├── utils/               # generateToken, pdfGenerator, geminiService
│   ├── server.js
│   ├── seed.js
│   └── render.yaml
└── frontend/
    └── src/
        ├── components/      # Modal, Loader, Badge, EmptyState, forms
        ├── context/         # AuthContext
        ├── layouts/         # DashboardLayout (sidebar)
        ├── pages/
        │   ├── admin/       # Dashboard, Staff, Analytics, Subscriptions
        │   ├── doctor/      # Dashboard, AI Assistant
        │   ├── receptionist/
        │   ├── patient/
        │   └── (shared)     # Patients, Appointments, Prescriptions
        ├── services/api.js
        └── utils/pdfDownload.js
```

---

## 🔌 API Endpoints Summary

### Auth
- `POST /api/auth/register` — Patient self-signup
- `POST /api/auth/login` — Login (all roles)
- `GET /api/auth/me` — Current user
- `POST /api/auth/create-staff` — Admin only

### Patients
- `GET /api/patients` — List (with search + pagination)
- `POST /api/patients` — Create
- `GET /api/patients/:id` — Detail with history
- `PUT /api/patients/:id` — Update
- `DELETE /api/patients/:id` — Admin only
- `GET /api/patients/me/profile` — Patient's own profile

### Staff
- `GET /api/staff` — Admin only
- `GET /api/staff/doctors` — Public list (for booking)
- `PUT /api/staff/:id` — Admin only
- `DELETE /api/staff/:id` — Admin only

### Appointments
- `GET /api/appointments` — Role-filtered
- `POST /api/appointments` — Book (with conflict check)
- `PUT /api/appointments/:id` — Update status
- `DELETE /api/appointments/:id` — Cancel

### Prescriptions
- `GET /api/prescriptions` — Role-filtered
- `POST /api/prescriptions` — Doctor only
- `GET /api/prescriptions/:id` — Single
- `GET /api/prescriptions/:id/pdf` — Download PDF
- `PUT /api/prescriptions/:id` — Update
- `DELETE /api/prescriptions/:id` — Doctor/Admin

### AI (Pro plan required for symptom-check, risk-flag)
- `POST /api/ai/symptom-check` — Doctor
- `POST /api/ai/explain-prescription/:id` — Doctor/Patient
- `GET /api/ai/risk-flag/:patientId` — Doctor/Admin
- `GET /api/ai/logs` — Recent AI queries

### Analytics
- `GET /api/analytics/admin` — Full clinic stats + charts
- `GET /api/analytics/doctor` — Doctor's personal stats
- `GET /api/analytics/subscriptions` — All users' plans
- `PUT /api/analytics/subscription/:userId` — Toggle plan

---

## ⚠ Graceful AI Fallback

AI features **never block the system**. If Gemini API fails or key isn't set:
- Symptom checker returns `{ success: false, fallback: true }` — UI shows friendly message
- Prescription explanation just isn't generated — rest of the prescription still works
- Risk flagging shows "AI unavailable"
- Everything else (auth, patients, appointments, prescriptions, PDFs, analytics) keeps working

---

## 🐛 Troubleshooting

**MongoDB connection error?**
- Local: Make sure `mongod` is running
- Atlas: Whitelist `0.0.0.0/0` in Network Access (for testing)

**`Cannot find module '@google/generative-ai'`?**
- Run `npm install` in backend folder

**PDF download not working?**
- Check browser console — JWT token might be missing/expired
- Logout aur dobara login karo

**AI features showing "Pro Plan Required"?**
- Login as admin → `/admin/subscriptions` → Upgrade user to Pro
- Or in `seed.js`, doctor/admin already have Pro plan

**Frontend can't reach backend?**
- Backend running on port 5000? Check terminal
- Production: `VITE_API_URL` env var set correctly?

---

## 📹 Demo Video Checklist

Show in your 3–7 min demo:
- [x] Login + 4 role dashboards
- [x] Receptionist registers patient
- [x] Appointment booking with conflict detection
- [x] Doctor prescribes from appointment
- [x] PDF download (show the letterhead!)
- [x] Patient sees prescription + AI explanation
- [x] Doctor uses AI symptom checker — show response
- [x] Admin analytics with all charts
- [x] Subscription management
- [x] Medical history timeline on patient profile

---

## 🏢 Startup Opportunity

Yeh project highly commercial hai. Aage:
- Local clinics ko approach karo aur live demo do
- SMS reminders (Twilio integration)
- WhatsApp notifications (Meta Business API)
- Billing/invoicing module
- Multi-clinic tenant support
- Lab report uploads (Cloudinary integration)

---

## 👨‍💻 Author

Built with ❤️ for the **AI Hackathon — MERN Stack Final Track**.
