# TST Meet

Internal Company Meeting Platform — quick setup guide.

## Quick Start (Windows)

1. Install Node.js 18+ from https://nodejs.org
2. Double-click `install.bat` (first time only)
3. Double-click `start.bat` to launch

## URLs
- User App: http://localhost:3002
- Admin App: http://localhost:3003/admin/login
- API Docs: http://localhost:3001/api/docs

## Admin Credentials
- Email: admin@tst-meet.com
- Password: Admin@123456

See `DOCUMENTATION.md` for full details.

## Render (SQLite + Persistent Disk)

This project is preconfigured for SQLite on Render using a persistent disk.

1. Create a Render Blueprint from this repo (uses [`render.yaml`](./render.yaml)).
2. Ensure backend service has:
   - `DATABASE_PATH=/opt/render/project/src/data/tst-meet.db`
   - Disk mount path: `/opt/render/project/src/data`
3. Set required secrets:
   - `JWT_SECRET`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `FRONTEND_URL` (comma-separated user/admin frontend URLs)

Notes:
- This is the easiest production setup with no DB rewrite.
- Good for low/medium internal usage.
- SQLite is single-instance and not ideal for horizontal scaling/high concurrency.
