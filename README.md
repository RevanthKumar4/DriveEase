# DriveEase

**DriveEase** is a full-stack professional driver booking platform that connects customers with verified, experienced drivers for personal and business travel needs.

---

## Features

- **Driver Booking** — Browse available drivers, view profiles, and book by vehicle type, hourly rate, and availability
- **Real-Time Request Management** — Track your ride requests from pending through completion
- **Secure Payments** — Integrated Razorpay payment processing with server-side signature verification
- **OTP Email Verification** — Verified email registration with 6-digit OTP, cooldown, and brute-force protection
- **AI Chatbot** — Powered by Google Gemini AI for instant customer support
- **Feedback System** — Rate and review drivers after trips
- **Admin Dashboard** — Manage drivers, view all requests and feedback
- **Interactive Maps** — Location selection powered by Leaflet/OpenStreetMap
- **PDF Receipts** — Downloadable payment receipts generated client-side
- **Role-based Access Control** — Separate portals for customers and admins
- **JWT Cookie Authentication** — Secure HttpOnly cookie-based sessions

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 16, TypeScript, Tailwind CSS |
| Backend | Spring Boot 3.2, Java 17 |
| Database | MySQL 8 (production), H2 (tests) |
| Authentication | JWT (HttpOnly cookies), BCrypt |
| Payments | Razorpay (order creation + HMAC-SHA256 verification) |
| Email | Gmail SMTP via Spring Mail |
| AI | Google Gemini API |
| Maps | Leaflet + OpenStreetMap Nominatim |
| PDF | jsPDF + jspdf-autotable |
| API Docs | SpringDoc OpenAPI (Swagger UI) |
| CI | GitHub Actions |
| Containers | Docker + Docker Compose |

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Angular 16 SPA                    │
│   (Components, Services, Guards, Interceptors)       │
│   Auth: HttpOnly JWT Cookie via HttpClient           │
└─────────────────────┬────────────────────────────────┘
                      │ HTTPS / REST API
                      ▼
┌──────────────────────────────────────────────────────┐
│              Spring Boot 3.2 Backend                 │
│   Security: JWT Filter → @PreAuthorize RBAC          │
│   OTP: In-memory store, rate-limited, single-use     │
│   Payments: Razorpay order creation + verification   │
│   AI: Gemini API via RestTemplate                    │
└───────────┬─────────────────────────────┬────────────┘
            │                             │
            ▼                             ▼
    ┌───────────────┐           ┌─────────────────┐
    │  MySQL 8 DB   │           │  External APIs   │
    │  (JPA/Flyway) │           │  Gmail, Razorpay │
    └───────────────┘           │  Gemini, Maps    │
                                └─────────────────┘
```

---

## Requirements

| Tool | Minimum Version |
|------|----------------|
| Java | 17 |
| Maven | 3.8+ |
| Node.js | 18+ |
| npm | 9+ |
| MySQL | 8.0+ |
| Angular CLI | 16 |

---

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/DriveEase.git
cd DriveEase
```

### 2. Environment Variables

```bash
cp .env.example .env
# Edit .env and fill in your values
```

### 3. Database Setup

```sql
CREATE DATABASE IF NOT EXISTS appdb;
```

### 4. Backend Setup

```bash
cd springapp
./mvnw spring-boot:run
# Backend runs on http://localhost:8080
```

### 5. Frontend Setup

```bash
cd angularapp
npm install
npm start
# Frontend runs on http://localhost:4200
```

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | JDBC URL for MySQL | Yes |
| `DATABASE_USERNAME` | Database username | Yes |
| `DATABASE_PASSWORD` | Database password | Yes |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | Yes |
| `JWT_EXPIRATION_MS` | JWT expiry in milliseconds | No (default: 86400000) |
| `MAIL_USERNAME` | Gmail address for OTP/notifications | Yes |
| `MAIL_PASSWORD` | Gmail App Password | Yes |
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `GEMINI_API_URL` | Gemini endpoint URL | No |
| `RAZORPAY_KEY_ID` | Razorpay Key ID | Yes |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret | Yes |
| `CORS_ALLOWED_ORIGINS` | Comma-separated frontend URLs | Yes |
| `SPRING_PROFILES_ACTIVE` | `dev` or `prod` | No (default: dev) |

---

## Testing

### Backend Tests

```bash
cd springapp
./mvnw clean test
```

Tests use H2 in-memory database — no MySQL required.

Test coverage includes:
- Auth controller (register, login, logout, JWT cookie)
- JWT utilities (generation, validation, expiry, tampering)
- OTP service (generation, verification, single-use, cooldown)
- Driver controller (authorization: admin vs customer)
- Feedback controller (authorization, validation)

### Frontend Tests

```bash
cd angularapp
npm test
```

---

## Production Build

### Backend

```bash
cd springapp
./mvnw clean package -DskipTests
# JAR: target/springapp-0.0.1-SNAPSHOT.jar
```

### Frontend

```bash
cd angularapp
npm run build:prod
# Output: dist/angularapp/
```

---

## Docker

```bash
# Start all services locally
cp .env.example .env
# (fill in .env values)
docker compose up --build
```

Services:
- Frontend: http://localhost:4200
- Backend: http://localhost:8080
- MySQL: localhost:3306

---

## Deployment

### Recommended Free Architecture

```
GitHub
  ├── GitHub Pages (Angular frontend)
  └── Render (Spring Boot backend)
        └── Railway / PlanetScale (MySQL)
```

### Step 1 — Backend on Render

1. Push code to GitHub
2. Create a new **Web Service** on [render.com](https://render.com)
3. Connect your GitHub repository
4. Set **Root Directory**: `springapp`
5. Set **Build Command**: `./mvnw clean package -DskipTests`
6. Set **Start Command**: `java -jar target/springapp-0.0.1-SNAPSHOT.jar`
7. Add all environment variables in Render's dashboard
8. Set `SPRING_PROFILES_ACTIVE=prod`
9. Set `CORS_ALLOWED_ORIGINS=https://YOUR-USERNAME.github.io`

### Step 2 — Frontend on GitHub Pages

1. Update `angularapp/src/environments/environment.prod.ts`:
   ```typescript
   apiURL: 'https://YOUR-RENDER-APP.onrender.com'
   ```
2. Build: `npm run build:prod`
3. Deploy `dist/angularapp/` to GitHub Pages

### Step 3 — Database

1. Create a free MySQL database on [Railway](https://railway.app) or [PlanetScale](https://planetscale.com)
2. Set `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD` in Render

### Step 4 — Health Check

```bash
curl https://YOUR-RENDER-APP.onrender.com/actuator/health
# Expected: {"status":"UP"}
```

---

## GitHub Actions CI

Set these **GitHub Secrets** in your repository settings:

| Secret | Value |
|--------|-------|
| `JWT_SECRET` | Strong random string (min 32 chars) |

CI runs on every push:
- Backend: test → build
- Frontend: install → production build

---

## Security

### Secret Management

- **Never** commit `.env` files or `application-prod.properties`
- All credentials are injected via environment variables
- The `.env.example` file contains only variable names — safe to commit

### Credential Rotation

> **⚠️ IMPORTANT**: The original repository had the following credentials committed to Git history. These must be **rotated immediately**:
>
> - Gmail App Password — generate a new App Password in Google Account settings
> - Gemini API Key — revoke and generate a new key in Google AI Studio
> - Sonar Token — revoke in SonarQube dashboard

### Git History Cleanup

To remove secrets from Git history:

```bash
# Option 1: BFG Repo Cleaner (recommended)
java -jar bfg.jar --replace-text secrets.txt YOUR-REPO.git
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --force

# Option 2: git filter-repo
git filter-repo --use-base-name --path application.properties --invert-paths
```

### Production Configuration

- JWT uses HS256 with a minimum 32-byte secret
- Cookies: `HttpOnly=true`, `Secure=true`, `SameSite=None`
- CORS: only configured origins (never `*` in production)
- Passwords: BCrypt (strength 12)
- OTP: 5-minute expiry, single-use, 5-attempt lockout, 60s resend cooldown
- Payments: Server-side Razorpay HMAC-SHA256 signature verification
- Actuator: only `/actuator/health` exposed publicly

---

## API Documentation

When running locally, Swagger UI is available at:
```
http://localhost:8080/swagger-ui/index.html
```

---

## License

This project is for educational purposes.

---

*DriveEase — Your Journey, Our Responsibility.*
