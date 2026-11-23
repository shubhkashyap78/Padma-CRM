# Padma Tourism CRM

Full-stack CRM for Padma Tourism — Leads → Quotations → Bookings → Payments, with admin + staff logins.

## Stack
- Backend: Node.js, Express, MongoDB (Mongoose), JWT auth
- Frontend: React + Vite, Tailwind CSS, Recharts

```
padma-crm/
  backend/    -> Express API
  frontend/   -> React panel (mobile friendly)
```

## 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env      # then edit it
npm run dev
```

`.env`:
```
PORT=5000
MONGO_URI=<your MongoDB Atlas connection string>
JWT_SECRET=<long random string>
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173        # several allowed: url1,url2
```
The server refuses to start if `JWT_SECRET` is missing or still the default.

### First admin (one time)
```bash
curl -X POST http://localhost:5000/api/auth/seed-admin \
  -H "Content-Type: application/json" \
  -d '{"name":"Shubham","email":"admin@padmatourism.com","password":"at-least-8-chars"}'
```
Disabled automatically once any admin exists.

### Staff logins
Two ways:
1. **From the CRM** – log in as admin → **Staff** → *+ Add Staff* (set ID + password, role Staff).
2. **Bulk, from the terminal** – edit the list in `backend/scripts/seedStaff.js`, then:
   ```bash
   npm run seed:staff
   ```
   Existing emails are skipped. Delete the passwords from that file after handing them out.

Staff should change their password on first login (**My Account**). Admin can reset any password from the Staff page.

## 2. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env     # VITE_API_URL=http://localhost:5000/api
npm run dev              # http://localhost:5173
```

## Who can do what

Rules are enforced on the **server** (hiding a button is not the only protection).

| Module | Admin | Staff |
|---|---|---|
| Dashboard | Company totals, revenue / collected / due, recent payments | Counts for own leads & bookings + own follow-ups. **No revenue figures** |
| Leads | All leads; create, edit, assign to staff, delete, export CSV | **Only leads assigned to / created by them**: create, edit, change status, notes, follow-up date. Cannot delete or reassign |
| Quotations | All; create, edit, PDF, WhatsApp text, convert to booking, delete | **Own only**: create, edit, PDF, WhatsApp text, convert to booking. Cannot delete |
| Bookings | All; create, edit, status, delete, export CSV | **Own only**: create, edit, status. Cannot delete; cannot set amount paid directly |
| Payments | All; record, delete (balance auto-restored), export CSV | Record payments on own bookings, view them. Cannot delete |
| Staff & logins | Create / deactivate / remove, reset passwords, change roles | No access |
| My Account | Change own password | Change own password |

"Own" = assigned to the staff member or created by them. When an admin assigns a lead to a staff member, that staff member sees it (and bookings/quotations created from it).

## Features
- **Leads**: source, package interest, budget, travel date, pipeline (New → Contacted → Quoted → Follow-up → Converted/Lost), lost reason, notes timeline, **next follow-up date** with overdue highlighting.
- **Quotations**: build from a lead, day-wise itinerary, inclusions/exclusions, price breakup, terms. Edit anytime. Branded PDF + WhatsApp-ready text. **One click → Booking** (lead becomes Converted, quotation Accepted).
- **Bookings**: codes `PT-2026-0001…`, edit, status, traveler details, balance due.
- **Payments**: UPI/Bank/Cash/Card; cannot exceed balance due; cannot be negative; cancelled bookings blocked.
- **Dashboard**: role-aware stats, follow-ups due, leads-by-status chart.
- **Security**: bcrypt passwords (min 8 chars), JWT, login rate limit (8 fails / 15 min), input whitelisting, regex-safe search, deactivated users blocked instantly.

## Deployment notes
- Backend on Render/Railway, frontend on Vercel/Netlify.
- Backend env: `CLIENT_URL` = deployed frontend URL(s). Frontend env: `VITE_API_URL` = deployed backend URL + `/api`.
- Never commit `.env`. Use a long random `JWT_SECRET` and a dedicated Atlas DB user.
- Vercel/Netlify: add a rewrite of all paths to `/index.html` so `/leads` etc. work on refresh.

## Ideas for later
- Connect the website enquiry form to `POST /api/leads` (needs a small public endpoint with spam protection).
- WhatsApp/SMS reminders for follow-ups and payment dues.
- Receipt / invoice PDF per payment.
