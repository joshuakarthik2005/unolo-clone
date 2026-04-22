# Unolo Clone — Field Force Management Platform

A robust full-stack solution tailored for managing remote field workforces, tracking location coordinates in real time, and maintaining deep analytics across an organization.

## Stack Architecture
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Recharts, React-Leaflet
- **Backend**: Node.js, Express, Socket.io, Nodemailer, Zod, Helmet
- **Database**: PostgreSQL paired with Prisma ORM

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- [Node.js (v18+)](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/) running locally (or via Docker)

### 2. Database Setup
Create a PostgreSQL database locally.
In the `server/` directory, copy the `.env.example` to `.env` and assign your connection string:
```bash
cd server
cp .env.example .env
npm install
npx prisma db push
npx prisma db seed # (If seed exists)
```

### 3. Running the Stack locally

**Terminal 1 (Backend Engine):**
```bash
cd server
npm run dev
```

**Terminal 2 (Client UI):**
```bash
cd client
npm install
npm run dev
```

### 4. Prisma Database UI
To visually inspect databases, execute:
```bash
cd server
npx prisma studio
```
It immediately opens `localhost:5555`.

---

## 🐳 Docker Deployment

For pushing this code natively to an external Linux VM or AWS EC2 instance:
1. Ensure Docker Desktop is running.
2. In the `unolo-clone` root directory, execute:
```bash
docker-compose up --build -d
```
Docker will internally spin up instances isolating the React Nginx host, the Node server backend, and the raw PostgreSQL container instance communicating organically.

---

## Security Mechanics
1. **JWT Verification** limits strict REST API actions.
2. **Helmet** masks headers and intercepts malicious injections.
3. **Express Rate Limit** shields the auth loops against brute attacks.
4. **Zod Validation** strictly forces HTTP bodies perfectly against Prisma objects natively prior to database writes.

## End to End Functional Scope
- Auth & Org generation
- GPS Live Pings leveraging internal background geolocation algorithms
- Task Completion Pipelines (Pending > In Progress > Completed)
- Expenses Claims + Auto Haversine geo-distance generation
- Beautiful SVG Dashboard Aggregations
