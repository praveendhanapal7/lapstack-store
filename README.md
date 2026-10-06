# Lapstack store

Next.js 15 + SQLite + Razorpay. Refurbished laptop store for Lapstack.

## Run
```
npm install
npm run dev
```
Open http://localhost:3000 (store) and http://localhost:3000/admin (admin). Needs Node 18.18+ (Node 20/22 recommended).

## Configure (.env.local)
- `ADMIN_PASSWORD` — admin login. Change it.
- `SESSION_SECRET` — any long random string. Change it.
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` — from Razorpay dashboard (use `rzp_test_...` keys first). Without keys, checkout offers cash on delivery only.
- `NEXT_PUBLIC_WHATSAPP` — WhatsApp number with country code.

Restart the server after editing .env.local.

## Notes
- Database: `data/lapstack.db`, created and seeded with 16 laptops on first run. Delete it to reset.
- Admin uploads go to `data/uploads`.
- Every model has stock 1 by default. Edit in Admin → Laptops.
- Prices and stock are always checked on the server. Payments are verified by Razorpay signature.
- Production: `npm run build && npm start`.
