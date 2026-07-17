# Padma Tourism CRM

Full-stack CRM for Padma Tourism — Leads → Bookings → Payments, with admin + staff logins.

## Stack
- Backend: Node.js, Express, MongoDB (Mongoose), JWT auth
- Frontend: React + Vite, Tailwind CSS, Recharts

## Folder Structure
```
padma-crm/
  backend/    -> Express API
  frontend/   -> React admin panel
```

## 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
```
PORT=5000
MONGO_URI=<your MongoDB Atlas connection string>
JWT_SECRET=<long random string>
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

Run it:
```bash
npm run dev
```

### Create the first admin account
Since there's no default login, hit this ONE-TIME route to create your first admin (it auto-disables after first use):

```bash
curl -X POST http://localhost:5000/api/health   # sanity check
curl -X POST http://localhost:5000/api/auth/seed-admin \
  -H "Content-Type: application/json" \
  -d '{"name":"Shubham","email":"admin@padmatourism.com","password":"yourpassword"}'
```

After this, log in normally from the frontend. Use the Staff page (admin only) to add staff logins.

## 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `.env`:
```
VITE_API_URL=http://localhost:5000/api
```

Run it:
```bash
npm run dev
```

Visit `http://localhost:5173` and log in.

## Features
- **Leads**: capture enquiries (source, package interest, budget, travel date), pipeline status (New → Contacted → Quoted → Follow-up → Converted/Lost), notes/timeline per lead.
- **Bookings**: auto-generated booking codes (PT-2026-0001...), traveler details, total amount, status tracking. Creating a booking from a lead auto-marks that lead Converted.
- **Payments**: record partial payments against a booking (UPI/Bank/Cash/Card), auto-updates amount paid & balance due.
- **Vehicles**: manage your transport fleet — own vehicles or vendor/contractor vehicles, with driver details, vendor contact, per-day/per-km rates, and status (Available/On Trip/Maintenance/Inactive). Assign a vehicle directly to a booking (with route, dates, driver, and cost) from the Bookings page.
- **Quotations**: build a quotation directly from a lead (auto-fills customer/package details), day-wise itinerary (with hotel/stay **and** vehicle/transport per day), inclusions/exclusions, price breakup, terms & conditions. Download as branded PDF or copy a WhatsApp-ready formatted text in one click.
- **Staff**: admin-only — create staff/admin logins, activate/deactivate, remove.
- **Dashboard**: totals for leads/bookings/revenue/collected/due, leads-by-status pie chart, recent payments.

## Deployment Notes
- Deploy backend on Render/Railway (Node), frontend on Vercel/Netlify.
- Set `CLIENT_URL` in backend env to your deployed frontend URL (for CORS).
- Set `VITE_API_URL` in frontend env to your deployed backend URL.
- Use a strong random `JWT_SECRET` in production.

## What's Next (ideas to extend)
- Connect the actual Padma Tourism website enquiry form to POST directly into `/api/leads`.
- WhatsApp/SMS reminders for follow-ups and payment dues.
- Role-based restriction so staff only see their assigned leads.
- Export leads/bookings to Excel/CSV.
- Invoice/receipt PDF generation per booking (can reuse your existing wkhtmltopdf pipeline).
