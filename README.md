# Fit_and_Flare
# Ecommerce Auth Backend (Password + OTP)

## Prereqs
- Node 18+
- MySQL server
- (optional) Twilio account for SMS
- (recommended) create a Gmail App Password for nodemailer or use any SMTP provider

## Setup
1. Clone repo
2. `npm install`
3. Copy `.env.example` to `.env` and fill values
4. Create the database in MySQL: `CREATE DATABASE ecommerce_db;` (or whatever you configured)
5. Start server:
   - dev: `npm run dev` (requires nodemon)
   - prod: `npm start`

DB models auto-sync on startup (development mode). For production use, replace `sync` with proper migrations.

## Endpoints
- `POST /api/auth/register` — register (body: `name`, `email`, `phone`, `password`, `otpMethod: 'email'|'phone'`)
- `POST /api/auth/verify-otp` — verify registration OTP (body: `emailOrPhone`, `code`)
- `POST /api/auth/resend-otp` — resend OTP (body: `emailOrPhone`, `type`)
- `POST /api/auth/login` — login (body: `emailOrPhone`, `password`, optional `otp`)
- `GET /api/auth/me` — profile (requires `Authorization: Bearer <token>`)

## Notes
- OTPs expire (configurable via `.env`).
- Twilio is optional; if not configured, SMS sending will skip but OTP will still be generated and stored for testing.
- For production: enable rate-limiting, brute-force protection, stricter validation, and use migrations for DB changes.
