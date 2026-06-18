# CivicDesk — Estado de fases

> Portal de trámites ciudadanos (gov). Leer al iniciar sesión de trabajo.
> Vara de calidad: **FinPulse** (NO NEGOCIABLE — ver PORTFOLIO_PROJECTS.md §2 "Quality gate").

| Fase | Alcance | Estado |
|------|---------|--------|
| F1 | Fundaciones backend (Clean Arch, dominio + máquina de estados, EF Core + migración, docker SQL, seed realista) | ✅ |
| F2 | Auth (JWT + refresh rotativo + lockout + RBAC 3 roles) + auditoría inmutable | ✅ |
| F3 | Catálogo de servicios + solicitudes + formularios dinámicos + documentos | ✅ |
| F4 | Flujo del funcionario (máquina de estados, bandeja, asignación, comentarios, verificación docs) | ✅ |
| F5 | Frontend base (scaffold Angular, sistema de diseño cívico, i18n EN/ES, auth UI, shell) | ⬜ |
| F6 | Frontend features (catálogo, stepper dinámico, upload, timeline, bandeja funcionario, demo guiada) | ⬜ |
| F7 | Pulido y entrega (/about, TECHNICAL, README, CI, deploy Azure + Pages, E2E prod, card portfolio) | ⬜ |

## Log
- 2026-06-18 · **F1–F4 ✅** Backend completo y verificado end-to-end contra SQL Server real.
  - **F1**: solución Clean Architecture (Domain/Application/Infrastructure/Api + tests). Dominio: `ServiceApplication` (aggregate root, renombrado para evitar la colisión con el namespace `Application`) con máquina de estados Draft→Submitted→UnderReview⇄NeedsInfo→Approved|Rejected, cada transición añade un `ApplicationEvent` (timeline público inmutable); `ServiceType`/`FormField`/`RequiredDocument` (catálogo config-driven), `ApplicationDocument` (bytes en DB, límite 10MB, PDF/JPG/PNG), `ApplicationComment` (internas vs visibles al ciudadano), `AuditLog` (append-only). EF Core + `InitialCreate`, RowVersion por-proveedor (rowversion en SQL Server, concurrency token en SQLite para tests), DbContext con guard append-only (rechaza update/delete de AuditLog y ApplicationEvent). Docker SQL (puerto 14333). Seed: 5 usuarios (3 roles), 6 servicios, 26 campos dinámicos, 8 solicitudes cubriendo los 5 estados, 16 eventos de timeline, 19 documentos.
  - **F2**: JWT (HS256, claims sub/email/name/role) + refresh rotativo SHA-256 + lockout (5 intentos/15min) + RBAC (policies `Staff`=Officer|Supervisor, `Supervisor`) + rate limiting `/auth` (10/min) + ForwardedHeaders. Auditoría: `IAuditLogger` añade la fila en el mismo SaveChanges de la acción (atomicidad acción↔auditoría), stamp de actor+IP desde `ICurrentUser`.
  - **F3**: catálogo público (`GET /services`, `/services/{slug}` con campos+docs), solicitudes del ciudadano (crear draft con validación dinámica por campo → ProblemDetails con `errors` por campo, subir documento multipart con validación tipo/tamaño y reemplazo por slot, submit con check de docs requeridos, resubmit tras NeedsInfo, listar/detalle, descarga de documento con check de propiedad).
  - **F4**: bandeja del funcionario (filtros status/mine/service/search + paginación, drafts nunca visibles), detalle con notas internas, claim (StartReview), request-info, approve, reject, comentarios, verificación de documentos; supervisor: asignación, directorio de staff, trail de auditoría; stats por estado para el dashboard. Concurrencia optimista vía RowVersion.
  - **Tests**: 24 verdes (máquina de estados, lockout, auth handlers con SQLite, flujo completo create→upload→submit→claim→approve, validación dinámica, RBAC del inbox). **Smoke HTTP** contra SQL Server: catálogo (6), login 3 roles, flujo ciudadano completo (create→upload×2→submit), ciclo funcionario (claim→request-info→resubmit→reclaim→approve, timeline de 6 eventos), RBAC (officer 403 en audit, supervisor 200), comentarios internos ocultos al ciudadano, auditoría registrada por acción.

## Cómo correr (dev)
- DB: `docker compose up -d` (SQL Server en `localhost,14333`, credenciales dev en compose). Connection string en `appsettings.Development.json` apunta a `localhost` (Windows auth); para Docker usar la env `ConnectionStrings__Default` o `--connection` con `Server=localhost,14333;User Id=sa;Password=CivicDesk_Dev!2026;...`.
- La API migra y siembra el demo automáticamente al arrancar en Development (`SeedDemoData=true`).
- `dotnet run --project backend/CivicDesk.Api --urls http://localhost:5280`
- Tests: `dotnet test backend/CivicDesk.sln`
- **Cuentas demo**: citizen@civicdesk.gov / Citizen123! · officer@civicdesk.gov / Officer123! · supervisor@civicdesk.gov / Supervisor123!
