# Deliberate Coaching — Beta Ops Dashboard

Frontend for **P0 / Beta** product metrics. **No fixtures** — data comes from
`GET /admin/metrics/overview` on `coaching-app-back`.

## Run

```bash
cp .env.example .env
# set VITE_API_BASE_URL to your API
npm install
npm run dev
```

Sign in with a user whose `profile.isAdmin = true`.

## API

- `POST /login-registro/login` → session token
- `GET /admin/metrics/overview?days=7` (Bearer + admin)
