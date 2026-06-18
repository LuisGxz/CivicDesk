# CivicDesk — Technical deep-dive

> Companion to the README, written for the technical interviewer. Covers scope, stack, architecture,
> the workflow engine, security, data integrity, performance, testing and conscious trade-offs.

## 1. Scope

CivicDesk is a **municipal citizen-services portal**. Residents browse a catalog of services, file an
application through a config-driven form, upload supporting documents, and follow an honest status
timeline. City staff work the other side: officers pull cases from a queue and move them through an
**enforced approval workflow**; supervisors assign work and read an immutable audit trail. Three roles,
bilingual EN/ES end-to-end, and a guided demo layer so a first-time visitor is never lost.

## 2. Stack

| Layer | Choice | Version |
|-------|--------|---------|
| Front | Angular (standalone + signals), Tailwind v4, lucide | 20 |
| API | ASP.NET Core minimal API | .NET 9 (LTS-style targeting) |
| Mediation | MediatR (CQRS) + FluentValidation | 12 / 11 |
| Data | EF Core + SQL Server | 9 |
| Auth | JWT + rotating refresh, ASP.NET Identity PBKDF2 | — |
| Tests | xUnit + FluentAssertions + SQLite; Playwright | — |
| Deploy | Azure App Service (F1) + Azure SQL (serverless free) + GitHub Pages | — |

## 3. Architecture

Clean Architecture on the back end:

```
CivicDesk.Domain          entities + the application state machine + domain exceptions (no dependencies)
CivicDesk.Application      MediatR commands/queries, DTOs, validation, interfaces (depends on Domain)
CivicDesk.Infrastructure   EF Core, JWT, hashing, seeding, audit logger (depends on Application)
CivicDesk.Api             minimal-API endpoints, auth wiring, exception→ProblemDetails (depends on Infrastructure)
```

The SPA is a standalone Angular app: lazy-loaded feature routes, signal-based services, an HTTP
interceptor that attaches the bearer token and transparently refreshes it, and a CSS-first Tailwind v4
design system.

A deliberate naming note: the aggregate is `ServiceApplication`, not `Application` — the latter collides
with the `CivicDesk.Application` layer namespace, a classic Clean-Architecture gotcha.

## 4. The workflow engine (the heart of the domain)

Status lives on the aggregate and is `private set`. Controllers never assign it — they call domain
methods that enforce the only legal transitions:

```
Draft ──Submit──▶ Submitted ──StartReview──▶ UnderReview ──Approve──▶ Approved (terminal)
                       ▲                          │  │  └────────────Reject──▶ Rejected (terminal)
                       └──ResubmitAfterInfo──── NeedsInfo ◀─RequestInfo─┘
```

Every transition appends an **immutable `ApplicationEvent`** to the aggregate — this *is* the
citizen-facing timeline, so the history can never drift from reality. Invalid moves throw a
`DomainException` (→ HTTP 422). `Submit` additionally requires at least one document; the submit handler
re-checks that every *required* document slot is filled (→ 409 with the missing labels).

| Pattern | Where | Why |
|---------|-------|-----|
| State machine | `ServiceApplication` | Illegal status moves are impossible. |
| CQRS (MediatR) | Application handlers | One isolated, testable unit per use case. |
| Repository via `IAppDbContext` | Infra ↔ App | Handlers depend on an abstraction; tests use SQLite. |
| Pipeline behavior | `ValidationBehavior` | Cross-cutting validation, once. |
| Config-driven UI | `FormField` / `RequiredDocument` | New services need data, not form code. |
| Append-only ledger | `AuditLog` / `ApplicationEvent` | Tamper-evident trail for the gov audit story. |

## 5. Config-driven forms

A `ServiceType` owns an ordered set of `FormField`s (text / textarea / number / date / select / checkbox,
with required + min/max/maxLength/options) and `RequiredDocument` slots. The API returns this config; the
SPA renders the entire application form generically from it. Adding a new municipal service is a *data*
change — no new components, no new endpoints. Validation rules are enforced server-side and mirrored
client-side, with errors returned **per field** (`ProblemDetails.errors`) so the form shows exactly
what's wrong.

## 6. Authentication & security

- **JWT** access tokens (15 min, HS256, claims sub/email/name/role) + **rotating refresh tokens** stored
  only as SHA-256 hashes; the SPA refreshes transparently through the HTTP interceptor.
- **Lockout** after 5 failed attempts; identical error for unknown-email and wrong-password so accounts
  can't be enumerated.
- **RBAC**: policy `Staff` (Officer | Supervisor) gates the officer area; `Supervisor` gates assignment,
  the staff directory and the audit trail. Endpoints declare the policy; the SPA mirrors it with route
  guards (defense in depth — the server is authoritative).
- **PBKDF2** password hashing (ASP.NET Identity). **Rate limiting** on `/auth` (10/min). `ForwardedHeaders`
  so the limiter sees the real client IP behind Azure's gateway.
- All errors flow through one `GlobalExceptionHandler` → RFC 7807 ProblemDetails; nothing internal leaks,
  and infrastructure failures (status 0/5xx/429) get honest, category-specific messages — never
  "check your credentials".

## 7. Data integrity

- **Optimistic concurrency** (`RowVersion`) on applications — a real `rowversion` on SQL Server, a plain
  concurrency token on SQLite for tests (the per-provider trap, handled in `OnModelCreating`).
- **Atomic action + audit**: the audit logger queues its row on the same change tracker, so an action and
  its audit entry commit (or roll back) together — an audit entry never exists without its action.
- **Append-only enforcement**: `SaveChanges` rejects any update/delete of `AuditLog` or `ApplicationEvent`.
- Client-assigned GUID keys with `ValueGenerated.Never`, so EF never mis-classifies a child insert reached
  through a tracked parent's navigation as an update.

## 8. Performance

- Lazy-loaded routes and standalone components — each view ships only what it needs.
- Officer inbox is **server-side filtered + paginated**, ordered so the oldest submitted case never
  starves; indexes on `(Status, AssignedOfficerId)`, `CitizenId`, and unique `ReferenceNumber`.
- Session restored once at startup (`provideAppInitializer`) so guarded views skip the 401→refresh
  round-trip on reload.

## 9. Testing

- **24 backend tests** (xUnit + FluentAssertions): the state machine (every transition + guard), user
  lockout, auth handlers, the full create→upload→submit→claim→approve flow, dynamic-form validation, and
  inbox RBAC — all on in-memory SQLite.
- An **HTTP smoke** run validates the whole API against real SQL Server (catalog, 3-role login, citizen
  flow, the full officer cycle including request-info/resubmit, RBAC 403s, hidden internal comments).
- **3 Playwright E2E** journeys (citizen file→submit→track, officer take→approve, bilingual /about) assert
  **zero `console.error`/`pageerror`** — Angular pipe/template bugs fail the suite.

## 10. Conscious trade-offs

- **Documents are stored as bytes in the database** (10 MB cap, PDF/JPG/PNG). Simple and self-contained
  for a free-tier demo; production would use blob storage + signed URLs and stream uploads.
- **Notifications are in-app only.** The timeline says "we'll email you"; wiring real email/SMS would go
  through a queue + outbox in production.
- **The fee is presentational.** The gov fee model is shown and snapshotted on the application, but no
  payment is charged — a real deployment would integrate the municipal payment gateway at submit.
- **No soft-delete / archival.** Terminal applications stay queryable; a real system would archive after
  a retention window.

## What I'd build next

Real document storage + virus scanning; a notification outbox (email/SMS); SLA timers and escalation when
a case sits too long; a public, paginated audit explorer for supervisors; and per-department routing so
submitted cases auto-assign to the right queue.
