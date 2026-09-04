# Public Grievance Portal

A **Public Grievance Redressal Portal** built with the **MERN Stack** (MongoDB, Express.js, React.js, Node.js).

Citizens can file and track complaints. Municipal officers review and update them. The Chief Municipal Officer manages officer registrations.

---

## 📁 Project Structure

```text
public-grievance-portal/
├── backend/                  # Node.js + Express + Mongoose API
│   ├── config/db.js
│   ├── controllers/          # authController.js, grievanceController.js
│   ├── middleware/           # authMiddleware.js
│   ├── models/               # User.js, Grievance.js
│   ├── routes/               # authRoutes.js, grievanceRoutes.js
│   ├── utils/emailService.js # Nodemailer email verification
│   ├── seed.js               # Seeds demo users and complaints
│   └── server.js
│
└── frontend/                 # React + Vite frontend
    └── src/
        ├── components/       # Navbar, GrievanceCard, StatsCard, ProtectedRoute, EditProfileModal
        ├── pages/            # Login, Register, VerifyEmail, CitizenDashboard, AdminDashboard
        ├── services/api.js   # Axios instance with JWT interceptor
        ├── App.jsx
        └── index.css
```

---

## 🚀 Running Locally

### Prerequisites
- Node.js (v18+)
- MongoDB running locally on port 27017

### 1. Backend

```bash
cd backend
cp .env.example .env        # fill in your values
npm install
node seed.js                # seed demo accounts
npm run dev                 # starts on http://localhost:5001
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                 # starts on http://localhost:5173
```

---

## 🔑 Demo Accounts

| Role | Email | Password |
| :--- | :--- | :--- |
| **Citizen** | `citizen@example.com` | `password123` |
| **Chief Officer** *(Super Admin)* | `chief@citygov.org` | `adminpassword123` |
| **Approved Officer** | `rajesh.officer@citygov.org` | `password123` |
| **Pending Officer** | `priya.officer@citygov.org` | `password123` |

Use the **Quick Fill** buttons on the sign-in page for faster demo access.

---

## ✨ Features

- **Citizens**: Register, verify email, file & track complaints
- **Municipal Officers**: Review and update complaint status with remarks
- **Chief Municipal Officer**: Approve/suspend officer accounts, view all activity
- **Email Verification**: Nodemailer with Ethereal (no real email service needed for development)
- **JWT Authentication** with role-based access control (citizen / admin / superadmin)
- **Audit Trail**: Each complaint update records the officer responsible
