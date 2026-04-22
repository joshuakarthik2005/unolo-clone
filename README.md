# Unolo Clone — Field Force Management Platform

A full-stack solution for managing remote field workforces, tracking GPS locations in real time, and maintaining deep analytics across an organization.

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, Recharts, React-Leaflet |
| Backend | Node.js, Express 5, Socket.io, Nodemailer, Helmet, Zod |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT (httpOnly cookies) + Refresh Token rotation |

---

## 🚀 Local Development

### Prerequisites
- [Node.js v18+](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/) running locally

### Setup
```bash
# 1. Clone the repo
git clone https://github.com/joshuakarthik2005/unolo-clone.git
cd unolo-clone

# 2. Setup backend
cd server
cp .env.example .env        # Edit .env with your DB credentials
npm install
npx prisma generate
npx prisma db push           # Creates all tables in your PostgreSQL
cd ..

# 3. Setup frontend
cd client
npm install
cd ..
```

### Run
```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

Open `http://localhost:5173` in your browser.

### Inspect Database
```bash
cd server && npx prisma studio
```
Opens a visual DB editor at `http://localhost:5555`.

---

## ☁️ Production Deployment (Vercel + Railway)

This is the recommended deployment strategy. The frontend deploys to **Vercel** (global CDN, instant loads) and the backend + database live on **Railway** (same VPC, low-latency DB queries).

### Step 1: Deploy PostgreSQL + Backend on Railway

1. Go to [railway.app](https://railway.app) and create a new project.
2. Click **"Add a Service"** → **"Database"** → **"PostgreSQL"**.
   - Railway will provision a database and give you a `DATABASE_URL`.
3. Click **"Add a Service"** → **"GitHub Repo"** → select `unolo-clone`.
4. In the service settings:
   - Set **Root Directory** to `server`
   - Set **Build Command** to `npm run build`
   - Set **Start Command** to `npm start`
5. Go to **Variables** tab and add:
   ```
   DATABASE_URL       = (copy from the PostgreSQL service — use the internal URL)
   JWT_SECRET         = your-strong-random-secret-here
   NODE_ENV           = production
   CLIENT_URL         = https://your-app-name.vercel.app  (set after Vercel deploy)
   PORT               = 5000
   ```
6. Deploy. Copy the public Railway URL (e.g. `https://unolo-clone-production.up.railway.app`).

### Step 2: Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) and import the `unolo-clone` GitHub repo.
2. In project settings:
   - Set **Root Directory** to `client`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add this **Environment Variable**:
   ```
   VITE_API_URL = https://unolo-clone-production.up.railway.app
   ```
   *(Use the Railway URL from Step 1, NO trailing slash)*
4. Deploy.

### Step 3: Connect the dots

1. Copy your Vercel deployment URL (e.g. `https://unolo-clone.vercel.app`).
2. Go back to Railway → your backend service → **Variables**.
3. Set `CLIENT_URL` to your Vercel URL.
4. Redeploy the Railway service.

### Step 4: Initialize the Database

After Railway deploys, open the Railway service shell and run:
```bash
npx prisma db push
```
This creates all tables in the production PostgreSQL.

---

## 🔒 Security
- **JWT** with httpOnly cookie authentication
- **Helmet** for HTTP header hardening
- **Rate Limiting** (1000 req / 15 min per IP)
- **Cross-origin cookies** with `sameSite: none` + `secure: true` in production

## 📱 Features
- Real-time GPS live tracking (Socket.io + Leaflet maps)
- Task assignment with geofence verification
- Attendance punch-in/out with location proof
- Expense claims with auto-calculated GPS distance (Haversine)
- Leave management with approval workflows
- Analytics dashboard with Recharts visualizations
- CSV report exports
- In-app notifications (real-time bell)
- Email notifications (Nodemailer)
- Mobile-responsive bottom navigation
