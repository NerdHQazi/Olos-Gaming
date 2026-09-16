# Olos Gaming Backend — Express.js Server

## Overview

The Backend is a lightweight Express.js server providing **authentication and health-check functionality** for the Olos Gaming platform. It acts as a bridge between the frontend (website) and Supabase's authentication system.

**What the Backend handles:**

- User signup and login via Supabase Auth
- Input validation and error handling
- CORS and security headers
- Rate limiting
- Health checks for diagnostics

**What the Backend does NOT handle:**

- Game logic, matchmaking, or move validation (handled by Supabase RPCs and Edge Functions)
- Wallet management or transactions (handled by Supabase database and functions)
- Player vs System orchestration (handled by Supabase Edge Functions)
- Database persistence beyond auth (handled by Supabase)

All game-related functionality, wallets, matchmaking, and Player vs System features are implemented server-side in Supabase RPCs and Edge Functions, not in this Express backend.

---

## Architecture

```
Backend/
├── src/
│   ├── index.js              # Entry point: initializes server
│   ├── app.js                # Express app setup: routes, middleware, CORS
│   ├── config/
│   │   └── supabase.js       # Supabase client initialization (service role key)
│   ├── controllers/
│   │   └── authController.js # Signup/login endpoints
│   ├── middleware/
│   │   └── validate.js       # Zod schemas for input validation
│   └── routes/
│       ├── authRoutes.js     # Auth endpoints: /api/auth/signup, /api/auth/login
│       └── internalRoutes.js # Internal debug endpoint: /api/_internal/supabase-health
├── scripts/                   # PvS system account provisioning and validation scripts
├── package.json
├── .env.example               # Environment variable template
├── supabase_setup.sql         # SQL for profiles table and new-user provisioning trigger
└── test_supabase.js           # Basic Supabase connectivity test

```

---

## Prerequisites

- **Node.js:** >= 18.0.0
- **npm** or **pnpm** for package management
- **Supabase project:** with Auth enabled and a service role key
- **Environment variables:** set up via `.env` file

---

## Installation & Setup

### 1. Install Dependencies

```bash
cd Backend
npm install
```

### 2. Configure Environment Variables

Copy the example file and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env` with these required values:

```env
# Supabase server-side credentials
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAi... (your service role key)

# Server configuration
PORT=5000
NODE_ENV=development

# Internal diagnostics (optional, for debugging Supabase connectivity)
INTERNAL_DEBUG_TOKEN=your-secret-debug-token
```

**⚠️ IMPORTANT:** Never commit `.env` to git. The service role key is secret and must be kept server-side only.

### 3. Verify Supabase Connection (Optional)

Test connectivity before starting the server:

```bash
node test_supabase.js
```

This will attempt a read query to the `profiles` table and print success/failure.

---

## Running the Server

### Development Mode (with auto-reload)

```bash
npm run dev
```

The server will start on `http://localhost:5000` and automatically reload when source files change.

### Production Mode

```bash
npm start
```

Starts the server without auto-reload. Use a process manager (pm2, systemd, Docker) in production.

---

## API Endpoints

### Authentication Endpoints

#### `POST /api/auth/signup`

Create a new user account in Supabase Auth.

**Request:**

```json
{
  "fullName": "John Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Password Requirements:**

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

**Response (201 Created):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "user-uuid",
    "email": "john@example.com",
    "fullName": "John Doe",
    "username": "johndoe"
  }
}
```

**Errors:**

- `400 Bad Request` — validation failed or user already exists
- `503 Service Unavailable` — Supabase connection error

---

#### `POST /api/auth/login`

Authenticate an existing user and return a session token.

**Request:**

```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Login successful",
  "session": {
    "access_token": "eyJ0eXAi...",
    "refresh_token": "...",
    "token_type": "bearer",
    "expires_in": 3600,
    "expires_at": 1234567890
  },
  "user": {
    "id": "user-uuid",
    "email": "john@example.com",
    "aud": "authenticated",
    "created_at": "2026-08-17T12:00:00Z",
    ...
  }
}
```

**Errors:**

- `401 Unauthorized` — invalid email/password
- `503 Service Unavailable` — Supabase connection error

---

### Health Check Endpoints

#### `GET /api/health`

Public health check for the Express server.

**Response (200 OK):**

```json
{
  "status": "ok",
  "uptime": 1234.56
}
```

Used to verify the server is running.

---

#### `GET /api/_internal/supabase-health`

Protected endpoint to diagnose Supabase connectivity. Requires the `x-internal-token` header.

**Headers:**

```
x-internal-token: <INTERNAL_DEBUG_TOKEN>
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Supabase reachable",
  "sampleRows": 5
}
```

**Errors:**

- `403 Forbidden` — invalid or missing token
- `500 Internal Server Error` — token not configured on server
- `502 Bad Gateway` — Supabase query failed

Use this endpoint when debugging Supabase connectivity issues.

---

## Middleware & Security

### Error Handling

The Express app includes a global error handler that catches unhandled errors and returns a 500 response:

```javascript
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});
```

In development, error details are returned; in production, they are hidden.

---

## Environment Variables Reference

| Variable                    | Type   | Required | Default       | Description                                                |
| --------------------------- | ------ | -------- | ------------- | ---------------------------------------------------------- |
| `SUPABASE_URL`              | string | Yes      | —             | Supabase project URL (e.g., `https://project.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | string | Yes      | —             | Service role key (server-only, keep secret)                |
| `PORT`                      | number | No       | `5000`        | Server port                                                |
| `NODE_ENV`                  | string | No       | `development` | `development` or `production`                              |
| `INTERNAL_DEBUG_TOKEN`      | string | No       | —             | Secret token for internal debug endpoints                  |

---

## Authentication Flow

1. **Frontend** sends email/password to `POST /api/auth/signup` or `POST /api/auth/login`
2. **Backend** validates input with Zod schemas
3. **Backend** forwards credentials to Supabase Auth via the service role key
4. **Supabase** creates auth user and triggers provisioning trigger (see below)
5. **Backend** returns session token and user data to frontend
6. **Frontend** stores session in localStorage, uses token for subsequent requests to Supabase Edge Functions

---

## Supabase Integration

### Authentication

The backend uses the Supabase **service role key** to call Supabase Auth on behalf of the user. This key grants full access and must be kept server-side only.

See `src/config/supabase.js` for the client initialization.

### User Provisioning Trigger

When a user signs up via Supabase Auth, the trigger in `supabase_setup.sql` automatically:

1. Creates a row in the `profiles` table with `id`, `full_name`, `username`, `email`
2. Creates a wallet row in the `wallets` table (initialized with 0 balance)

This happens server-side in Supabase, not in the Express backend.

### Database Responsibilities (Supabase)

**Auth tables:** `auth.users`

- Managed by Supabase Auth system

**Game tables:** `matches`, `match_queue`, `match_events`, `match_payouts`, `match_result_submissions`

- Managed by Supabase Edge Functions and RPCs

**User tables:** `profiles`, `wallets`

- Created by signup provisioning trigger

The Express backend never directly modifies game or wallet tables. All game operations (matchmaking, moves, resolution, payouts) are performed by Supabase Edge Functions with appropriate RLS policies.

### Edge Functions (Supabase)

Game-related operations are handled by Edge Functions in `supabase/functions/`:

- `submit_game_move/` — Processes moves, applies System replies, detects terminal states
- System move selectors (`_shared/system-move-selector.ts`, `_shared/system-move-reply.ts`) — Deterministic move logic

These are **not** part of this Backend service.

---

## Middleware & Security

### CORS Configuration

Configured to allow:

- Origins: `localhost`, `127.0.0.1`, and any origin if no origin header (dev mode)
- Methods: GET, POST, PUT, DELETE, OPTIONS
- Headers: Content-Type, Authorization
- Credentials: yes

**Production note:** Update CORS to restrict to your actual frontend domain.

### Helmet Security Headers

Enabled by default (with `crossOriginResourcePolicy: false` to allow CORS).

### Rate Limiting

- Window: 15 minutes
- Limit: 100 requests per IP per window
- Applied to `/api/*` routes

### Input Validation

Zod schemas validate all auth requests:

- `signupSchema` — email, password (complex), fullName, username
- `loginSchema` — email, password

Invalid requests return 400 with detailed error messages.

---

## Error Handling

### Authentication Errors

- **Invalid credentials:** Returns 401 with generic message (no details leaked)
- **Validation error:** Returns 400 with field-level error details
- **Supabase connection error:** Returns 503 with helpful message

All errors are logged server-side for debugging; client-side responses are generic to prevent information leakage.

### Common Issues

| Issue                           | Cause                                | Solution                                             |
| ------------------------------- | ------------------------------------ | ---------------------------------------------------- |
| `SUPABASE_URL` or key not found | Missing `.env` file                  | Run `cp .env.example .env` and fill in values        |
| Supabase connection error       | Network issue or invalid credentials | Verify `.env` values and run `node test_supabase.js` |
| CORS error on frontend          | Frontend not in CORS allow list      | Update CORS config in `app.js` for your domain       |
| Rate limit error (429)          | Too many requests from IP            | Wait 15 minutes or increase limit in `app.js`        |

---

## Scripts

### System Account Provisioning (Player vs System)

```bash
node Backend/scripts/provision_pvs_system_account.js
```

Provisions the System account ("Neigel") for Player vs System matches. Part of the PvS implementation (Phases 1-7).

### Validation Scripts (Player vs System)

Scripted tests for PvS functionality:

```bash
# Phase 2: Test matchmaking
node Backend/scripts/validate_phase2_start_system_match.js

# Phase 5: Test full game and payout
node Backend/scripts/validate_phase5_full_game.js

# Phase 7: Security and regression tests
node Backend/scripts/validate_phase7_security_negatives.js
node Backend/scripts/validate_phase7_1v1_regression.js
```

These scripts use QA credentials from `.env.qa.local` and test against the linked Supabase project.

---

## Error Handling Middleware

The Express app includes a global error handler that catches unhandled errors and returns a 500 response:

```javascript
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});
```

In development, error details are returned; in production, they are hidden.

---

## Development Workflow

### 1. Start the Backend

```bash
npm run dev
```

### 2. Test Auth Endpoints

Use curl, Postman, or your frontend:

```bash
# Signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"TestPassword123!",
    "fullName":"Test User",
    "username":"testuser"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"TestPassword123!"
  }'

# Health check
curl http://localhost:5000/api/health
```

### 3. Debug Supabase Connectivity

```bash
# Test basic connectivity
node test_supabase.js

# Test via debug endpoint (if INTERNAL_DEBUG_TOKEN is set)
curl -H "x-internal-token: your-debug-token" \
  http://localhost:5000/api/_internal/supabase-health
```

### 4. View Logs

The backend logs all requests and errors to stdout/stderr. In dev mode (`npm run dev`), logs appear in the terminal.

---

## Testing

Currently, the repo does not have automated unit/integration tests for the Backend. To add tests:

```bash
npm install --save-dev jest supertest
```

Then add test files and a test script in `package.json`.

For now, manual testing via curl or the frontend is the primary validation method.

---

## Deployment

### Environment Variables

Set these in your hosting platform (Vercel, Render, etc.):

```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
PORT=5000
NODE_ENV=production
```

### Build & Run

The backend has no build step (no TypeScript compilation, no bundling).

```bash
npm install
npm start
```

### Process Manager (Production)

Use a process manager to keep the server running:

```bash
# pm2
npm install -g pm2
pm2 start npm --name "olos-backend" -- start
pm2 save

# Docker
docker run -p 5000:5000 --env-file .env node:18 npm start
```

---

## Security & Operations Notes

1. **Service Role Key:** Never expose in client code, git history, or logs. Use environment variables only.
2. **CORS:** Restrict to your actual frontend domain in production.
3. **Rate Limiting:** Adjust limits based on expected traffic.
4. **Monitoring:** Log all requests and errors. Set up alerts for 5xx errors.
5. **Secrets Rotation:** Rotate Supabase keys periodically.
6. **Health Checks:** Use `/api/health` for uptime monitoring.

---

## Contributing

1. Follow the existing code structure (controllers, routes, middleware).
2. Add new endpoints in `routes/`, business logic in `controllers/`.
3. Use Zod for all input validation.
4. Test authentication flows end-to-end before submitting PRs.
5. Ensure `.env` is in `.gitignore` and never committed.

---

## Related Documentation

- **Frontend:** See `website/README.md`
- **Supabase/Database:** See `supabase/README.md` and migration files
- **Edge Functions:** See `supabase/functions/` (game logic, Player vs System)
- **Architecture Overview:** See `docs/` and `docs/roadmaps/`

---

## Support & Troubleshooting

| Issue                       | Check                                                           |
| --------------------------- | --------------------------------------------------------------- |
| Server won't start          | Verify Node.js >= 18, run `npm install`, check `.env`           |
| Auth endpoints fail         | Verify Supabase URL/key in `.env`, test with `test_supabase.js` |
| CORS errors                 | Check CORS config in `app.js` and frontend origin               |
| Rate limit errors           | Increase limit or wait 15 minutes                               |
| Supabase connection timeout | Check internet, verify Supabase project is active               |

For detailed debugging, enable request logging and check stdout/stderr.
