# CivicDesk — Citizen services portal

A municipal **citizen-services portal**: residents apply for services through config-driven forms, upload
documents and track an honest status timeline, while officers work a queue with an **enforced approval
workflow** and every action lands in an **immutable audit trail**. Built to mirror real government /
public-sector software — workflows with states, multi-level RBAC, and auditability.

**Live demo:** https://luisgxz.github.io/CivicDesk · **API:** https://civicdesk-api-luisgxz.azurewebsites.net/health

> Free-tier demo. The API sleeps when idle — the first request may take ~30–60 s to wake (the login retries through the cold start).

## Demo accounts

| Role | Email | Password | Can do |
|------|-------|----------|--------|
| Citizen | `citizen@civicdesk.gov` | `Citizen123!` | File & track applications, upload documents, respond to requests |
| Officer | `officer@civicdesk.gov` | `Officer123!` | Work the inbox, take cases, request changes, approve/reject, verify documents |
| Supervisor | `supervisor@civicdesk.gov` | `Supervisor123!` | Everything officers can, plus assign cases and read the audit trail |

## Screens

| Catalog | Application stepper | Status timeline |
|---|---|---|
| ![Catalog](docs/screenshots/catalog-1280.png) | ![Apply](docs/screenshots/apply-1280.png) | ![Detail](docs/screenshots/application-detail-1280.png) |

| Officer inbox | Officer review | About |
|---|---|---|
| ![Inbox](docs/screenshots/officer-inbox-1280.png) | ![Review](docs/screenshots/officer-detail-1280.png) | ![About](docs/screenshots/about-1280.png) |

## Stack

- **Frontend:** Angular 20 (standalone + signals), Tailwind v4, lucide. Bilingual EN/ES, WCAG-AA focus.
- **Backend:** .NET 9 minimal API, Clean Architecture, MediatR (CQRS) + FluentValidation, EF Core + SQL Server.
- **Auth:** JWT + rotating refresh, lockout, 3-role RBAC, rate limiting, append-only audit log.
- **Deploy:** Azure App Service (F1) + Azure SQL (serverless, free offer) + GitHub Pages. CI on GitHub Actions.

See **[docs/TECHNICAL.md](docs/TECHNICAL.md)** for the deep-dive (architecture, the workflow engine,
security, data integrity, testing, trade-offs), or the in-app **About this project** page.

## Highlights

- **Enforced workflow** — `Draft → Submitted → UnderReview ⇄ NeedsInfo → Approved | Rejected`, all
  transitions on a domain state machine; each appends an immutable timeline event the citizen sees.
- **Config-driven forms** — a service defines its fields + required documents as data; the SPA renders the
  whole form generically. New services need data, not code.
- **Real auditability** — every action recorded with actor, IP and timestamp; the audit log and timeline
  are append-only (the DbContext rejects any update/delete).
- **Honest, per-field errors** — server validation returns `ProblemDetails.errors` per field; the form
  shows exactly what's wrong, and infra failures never masquerade as "bad input".

## Run locally

```bash
# 1. Database (SQL Server via Docker)
docker compose up -d                     # SQL Server on localhost:14333

# 2. API (migrates + seeds the demo dataset automatically in Development)
cd backend
ConnectionStrings__Default="Server=localhost,14333;Database=CivicDesk;User Id=sa;Password=CivicDesk_Dev!2026;TrustServerCertificate=True;" \
  dotnet run --project CivicDesk.Api --urls http://localhost:5280

# 3. Frontend
cd frontend
npm install
npm start                                # http://localhost:4200

# Tests
dotnet test backend/CivicDesk.sln        # 24 unit/integration tests
cd frontend && npx playwright test       # E2E (servers must be running)
```

## Project structure

```
civicdesk/
├── backend/        .NET solution (Domain / Application / Infrastructure / Api + tests)
├── frontend/       Angular 20 SPA (core / shared / layout / features) + e2e
├── docs/           PHASES.md · TECHNICAL.md · screenshots
└── docker-compose.yml
```

---

Part of [Luis Chiquito Vera's portfolio](https://luisgxz.github.io/portfolio/). Built with .NET, Angular and Clean Architecture.
