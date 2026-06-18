import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { LanguageService } from '../../core/language.service';

interface Pattern { name: string; where: string; why: string; }
interface AboutCopy {
  lead: string; demoTitle: string; viewDemo: string; sourceCode: string;
  scopeTitle: string; scope: string[];
  archTitle: string; archIntro: string; archBullets: string[];
  patternsTitle: string; patternsHead: [string, string, string]; patterns: Pattern[];
  authTitle: string; auth: string[];
  dataTitle: string; data: string[];
  workflowTitle: string; workflow: string[];
  perfTitle: string; perf: string[];
  testTitle: string; test: string[];
  tradeTitle: string; trade: string[];
  technical: string;
}

const STACK = ['Angular 20', 'TypeScript', 'Tailwind v4', '.NET 9', 'EF Core', 'SQL Server', 'JWT + RBAC', 'MediatR'];

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  template: `
    <article class="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <header class="mb-10">
        <p class="font-mono text-xs text-civic-700 uppercase tracking-widest mb-3">About this project · CivicDesk</p>
        <h1 class="text-3xl sm:text-4xl font-extrabold text-civic-900 mb-3">CivicDesk</h1>
        <p class="text-lg text-ink-700">{{ c().lead }}</p>

        <div class="flex flex-wrap gap-2 mt-5">
          @for (s of stack; track s) { <span class="badge bg-civic-50 text-civic-800 border border-civic-100">{{ s }}</span> }
        </div>

        <div class="flex flex-wrap gap-3 mt-6">
          <a routerLink="/services" class="btn-primary"><lucide-icon name="external-link" class="w-4 h-4" /> {{ c().viewDemo }}</a>
          <a href="https://github.com/LuisGxz/CivicDesk" target="_blank" rel="noopener" class="btn-secondary"><lucide-icon name="github" class="w-4 h-4" /> {{ c().sourceCode }}</a>
        </div>

        <!-- demo credentials -->
        <div class="card p-5 mt-6">
          <p class="font-bold text-sm text-ink-900 mb-3">{{ c().demoTitle }}</p>
          <div class="grid sm:grid-cols-3 gap-3 text-sm">
            <div class="rounded-lg bg-ink-50 p-3"><p class="font-bold text-civic-800">{{ lang.role('Citizen') }}</p><p class="font-mono text-xs text-ink-700 mt-1">citizen@civicdesk.gov</p><p class="font-mono text-xs text-ink-500">Citizen123!</p></div>
            <div class="rounded-lg bg-ink-50 p-3"><p class="font-bold text-civic-800">{{ lang.role('Officer') }}</p><p class="font-mono text-xs text-ink-700 mt-1">officer@civicdesk.gov</p><p class="font-mono text-xs text-ink-500">Officer123!</p></div>
            <div class="rounded-lg bg-ink-50 p-3"><p class="font-bold text-civic-800">{{ lang.role('Supervisor') }}</p><p class="font-mono text-xs text-ink-700 mt-1">supervisor@civicdesk.gov</p><p class="font-mono text-xs text-ink-500">Supervisor123!</p></div>
          </div>
        </div>
      </header>

      <section class="mb-9">
        <h2 class="text-xl font-extrabold text-civic-900 mb-3">{{ c().scopeTitle }}</h2>
        <ul class="space-y-2">@for (s of c().scope; track s) { <li class="flex gap-2.5 text-ink-700"><lucide-icon name="check" class="w-5 h-5 text-ok-700 shrink-0 mt-0.5" /><span>{{ s }}</span></li> }</ul>
      </section>

      <section class="mb-9">
        <h2 class="text-xl font-extrabold text-civic-900 mb-3">{{ c().archTitle }}</h2>
        <p class="text-ink-700 mb-4">{{ c().archIntro }}</p>
        <div class="card p-5 font-mono text-xs text-ink-700 overflow-x-auto mb-4">
          <pre class="whitespace-pre">{{ diagram }}</pre>
        </div>
        <ul class="space-y-2">@for (b of c().archBullets; track b) { <li class="flex gap-2.5 text-ink-700"><lucide-icon name="chevron-right" class="w-5 h-5 text-civic-700 shrink-0 mt-0.5" /><span>{{ b }}</span></li> }</ul>
      </section>

      <section class="mb-9">
        <h2 class="text-xl font-extrabold text-civic-900 mb-3">{{ c().patternsTitle }}</h2>
        <div class="card overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-ink-50 text-left text-xs uppercase text-ink-500 tracking-wide">
              <tr><th class="px-4 py-3 font-bold">{{ c().patternsHead[0] }}</th><th class="px-4 py-3 font-bold">{{ c().patternsHead[1] }}</th><th class="px-4 py-3 font-bold">{{ c().patternsHead[2] }}</th></tr>
            </thead>
            <tbody class="divide-y divide-ink-100">
              @for (p of c().patterns; track p.name) {
                <tr><td class="px-4 py-3 font-semibold text-ink-900">{{ p.name }}</td><td class="px-4 py-3 text-ink-700">{{ p.where }}</td><td class="px-4 py-3 text-ink-700">{{ p.why }}</td></tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      @for (block of blocks(); track block.title) {
        <section class="mb-9">
          <h2 class="text-xl font-extrabold text-civic-900 mb-3">{{ block.title }}</h2>
          <ul class="space-y-2">@for (item of block.items; track item) { <li class="flex gap-2.5 text-ink-700"><lucide-icon [name]="block.icon" class="w-5 h-5 text-civic-700 shrink-0 mt-0.5" /><span>{{ item }}</span></li> }</ul>
        </section>
      }

      <div class="card p-5 bg-civic-50 border-civic-100">
        <p class="text-sm text-ink-700">{{ c().technical }}
          <a href="https://github.com/LuisGxz/CivicDesk/blob/master/docs/TECHNICAL.md" target="_blank" rel="noopener" class="font-bold text-civic-700 hover:underline">docs/TECHNICAL.md →</a>
        </p>
      </div>
    </article>
  `
})
export class AboutComponent {
  readonly lang = inject(LanguageService);
  readonly stack = STACK;
  readonly diagram = `Angular 20 SPA  ──HTTPS/JWT──▶  .NET minimal API
  (signals, i18n)                  │
                                   ├─ MediatR (command/query) + FluentValidation
                                   ├─ Domain (ServiceApplication state machine)
                                   ├─ EF Core ─▶ SQL Server
                                   └─ Append-only AuditLog + ApplicationEvent`;

  readonly c = computed<AboutCopy>(() => this.lang.isEs() ? ES : EN);
  readonly blocks = computed(() => {
    const c = this.c();
    return [
      { title: c.authTitle, items: c.auth, icon: 'shield-check' },
      { title: c.dataTitle, items: c.data, icon: 'badge-check' },
      { title: c.workflowTitle, items: c.workflow, icon: 'list-checks' },
      { title: c.perfTitle, items: c.perf, icon: 'sparkles' },
      { title: c.testTitle, items: c.test, icon: 'check' },
      { title: c.tradeTitle, items: c.trade, icon: 'circle-alert' }
    ];
  });
}

const EN: AboutCopy = {
  lead: 'A citizen-services portal where residents apply for municipal services through config-driven forms, upload documents and track an honest status timeline — while officers work a queue with an enforced approval workflow, and every action lands in an immutable audit trail.',
  demoTitle: 'Demo accounts — sign in as any role', viewDemo: 'Open the demo', sourceCode: 'Source code',
  scopeTitle: 'Scope',
  scope: [
    'Public catalog of 6 municipal services, each with its own dynamic form and required documents.',
    'Citizen flow: a 3-step application stepper (details → documents → review), document upload with type/size validation, and a vertical status timeline.',
    'Officer flow: a filtered, paginated inbox; take a case; request changes; approve or reject — each transition enforced by a domain state machine.',
    'Supervisor flow: assign cases to staff and read the full audit trail.',
    'Three roles (citizen / officer / supervisor), bilingual EN/ES throughout, and a guided demo layer.'
  ],
  archTitle: 'Architecture',
  archIntro: 'Clean Architecture on the back end (Domain / Application / Infrastructure / API) with a thin minimal-API surface; a standalone, signal-based Angular SPA on the front.',
  archBullets: [
    'The Application aggregate (ServiceApplication) owns the status lifecycle — controllers never mutate status directly; they call domain methods that enforce the legal transitions.',
    'Commands and queries flow through MediatR; a FluentValidation pipeline behavior validates every request before the handler runs.',
    'Forms are data-driven: a service defines its FormFields and RequiredDocuments, and the SPA renders the form generically from that config.',
    'The audit log and the application timeline are append-only — the DbContext rejects any update or delete of those rows.'
  ],
  patternsTitle: 'Design patterns',
  patternsHead: ['Pattern', 'Where', 'Why'],
  patterns: [
    { name: 'State machine', where: 'ServiceApplication transitions', why: 'Illegal status moves are impossible; the workflow is the single source of truth.' },
    { name: 'CQRS (MediatR)', where: 'Application layer handlers', why: 'Each use case is one isolated, testable command/query.' },
    { name: 'Repository via IAppDbContext', where: 'Infrastructure ↔ Application', why: 'Handlers depend on an abstraction; tests run on in-memory SQLite.' },
    { name: 'Pipeline behavior', where: 'ValidationBehavior', why: 'Cross-cutting validation without repeating it in every handler.' },
    { name: 'Config-driven UI', where: 'FormField / RequiredDocument', why: 'New services need data, not new form code.' },
    { name: 'Append-only ledger', where: 'AuditLog / ApplicationEvent', why: 'A tamper-evident trail — required for the gov audit story.' }
  ],
  authTitle: 'Authentication & security',
  auth: [
    'JWT access tokens (15 min) with rotating, hashed refresh tokens; the SPA refreshes transparently via an HTTP interceptor.',
    'Account lockout after 5 failed attempts; the same error for unknown email and wrong password so accounts can\'t be enumerated.',
    'RBAC with three roles — policy "Staff" gates the officer area, "Supervisor" gates assignment and the audit trail.',
    'Passwords hashed with ASP.NET Identity PBKDF2; rate limiting on /auth; ProblemDetails errors that never leak internals.'
  ],
  dataTitle: 'Data integrity',
  data: [
    'Optimistic concurrency (RowVersion) on applications — two officers can\'t silently overwrite each other.',
    'Required-field and document rules are validated server-side, mirrored client-side, and returned per-field on a 400.',
    'A submission is atomic: the status change and its audit entry are saved in the same transaction.',
    'Client-assigned GUID keys, configured so EF never mis-classifies child inserts.'
  ],
  workflowTitle: 'Workflow & audit',
  workflow: [
    'Draft → Submitted → UnderReview ⇄ NeedsInfo → Approved | Rejected, each transition appending an immutable timeline event the citizen can see.',
    'Internal officer notes are never returned to citizen-facing endpoints.',
    'Every meaningful action (created, submitted, claimed, approved, document reviewed…) is recorded with actor, IP and timestamp.'
  ],
  perfTitle: 'Performance',
  perf: [
    'Lazy-loaded routes and standalone components; the SPA ships only what each view needs.',
    'Server-side filtering + pagination on the officer inbox; indexed status/assignee/reference columns.',
    'Session restored once at startup so guarded views skip the 401→refresh round-trip.'
  ],
  testTitle: 'Testing',
  test: [
    '24 backend tests: the state machine, lockout, auth handlers, and a full create→upload→submit→claim→approve flow on SQLite.',
    'Dynamic-form validation and inbox RBAC covered; an end-to-end HTTP smoke runs against real SQL Server.',
    'A Playwright E2E exercises the citizen and officer journeys with zero console errors.'
  ],
  tradeTitle: 'Conscious trade-offs',
  trade: [
    'Documents are stored as bytes in the database (capped at 10 MB) — simple and self-contained for a demo; production would use blob storage + signed URLs.',
    'Notifications are surfaced in-app only; email/SMS would be wired through a queue in production.',
    'The payment step is presentational — the gov fee model is shown but not charged.'
  ],
  technical: 'A deeper technical write-up — patterns, the workflow engine, security and trade-offs — lives in'
};

const ES: AboutCopy = {
  lead: 'Un portal de trámites ciudadanos donde los residentes solicitan servicios municipales mediante formularios configurables, suben documentos y siguen una línea de tiempo honesta — mientras los funcionarios trabajan una bandeja con un flujo de aprobación garantizado, y cada acción queda en un trail de auditoría inmutable.',
  demoTitle: 'Cuentas demo — inicia sesión con cualquier rol', viewDemo: 'Abrir la demo', sourceCode: 'Código fuente',
  scopeTitle: 'Alcance',
  scope: [
    'Catálogo público de 6 trámites municipales, cada uno con su formulario dinámico y documentos requeridos.',
    'Flujo del ciudadano: stepper de solicitud en 3 pasos (datos → documentos → revisión), subida de documentos con validación de tipo/tamaño, y línea de tiempo del estado.',
    'Flujo del funcionario: bandeja filtrada y paginada; tomar un caso; solicitar cambios; aprobar o rechazar — cada transición garantizada por una máquina de estados de dominio.',
    'Flujo del supervisor: asignar casos al personal y leer el trail de auditoría completo.',
    'Tres roles (ciudadano / funcionario / supervisor), bilingüe EN/ES en todo, y una capa de demo guiada.'
  ],
  archTitle: 'Arquitectura',
  archIntro: 'Clean Architecture en el backend (Domain / Application / Infrastructure / API) con una superficie de minimal API delgada; un SPA Angular standalone basado en signals en el frontend.',
  archBullets: [
    'El aggregate Application (ServiceApplication) posee el ciclo de estados — los controladores nunca mutan el estado directamente; llaman a métodos de dominio que garantizan las transiciones válidas.',
    'Los comandos y queries fluyen por MediatR; un pipeline de FluentValidation valida cada request antes del handler.',
    'Los formularios son data-driven: un trámite define sus FormFields y RequiredDocuments, y el SPA los renderiza de forma genérica.',
    'El trail de auditoría y la línea de tiempo son append-only — el DbContext rechaza cualquier update o delete de esas filas.'
  ],
  patternsTitle: 'Patrones de diseño',
  patternsHead: ['Patrón', 'Dónde', 'Por qué'],
  patterns: [
    { name: 'Máquina de estados', where: 'Transiciones de ServiceApplication', why: 'Los cambios de estado ilegales son imposibles; el flujo es la única fuente de verdad.' },
    { name: 'CQRS (MediatR)', where: 'Handlers de la capa Application', why: 'Cada caso de uso es un comando/query aislado y testeable.' },
    { name: 'Repositorio vía IAppDbContext', where: 'Infrastructure ↔ Application', why: 'Los handlers dependen de una abstracción; los tests corren en SQLite en memoria.' },
    { name: 'Pipeline behavior', where: 'ValidationBehavior', why: 'Validación transversal sin repetirla en cada handler.' },
    { name: 'UI config-driven', where: 'FormField / RequiredDocument', why: 'Un trámite nuevo necesita datos, no código de formulario.' },
    { name: 'Ledger append-only', where: 'AuditLog / ApplicationEvent', why: 'Un trail a prueba de manipulación — requisito de la historia gov.' }
  ],
  authTitle: 'Autenticación y seguridad',
  auth: [
    'Access tokens JWT (15 min) con refresh tokens rotativos y hasheados; el SPA refresca de forma transparente vía interceptor HTTP.',
    'Bloqueo de cuenta tras 5 intentos fallidos; mismo error para email desconocido y contraseña incorrecta para no enumerar cuentas.',
    'RBAC con tres roles — la policy "Staff" protege el área del funcionario, "Supervisor" protege la asignación y el trail de auditoría.',
    'Contraseñas con PBKDF2 de ASP.NET Identity; rate limiting en /auth; errores ProblemDetails que nunca filtran internos.'
  ],
  dataTitle: 'Integridad de datos',
  data: [
    'Concurrencia optimista (RowVersion) en las solicitudes — dos funcionarios no se sobrescriben en silencio.',
    'Las reglas de campos y documentos requeridos se validan en el server, se espejan en el cliente y se devuelven por campo en un 400.',
    'El envío es atómico: el cambio de estado y su entrada de auditoría se guardan en la misma transacción.',
    'Llaves GUID asignadas en el cliente, configuradas para que EF nunca clasifique mal los inserts hijos.'
  ],
  workflowTitle: 'Flujo y auditoría',
  workflow: [
    'Borrador → Recibida → En revisión ⇄ Requiere acción → Aprobada | Rechazada, cada transición añade un evento inmutable a la línea de tiempo que el ciudadano ve.',
    'Las notas internas del funcionario nunca se devuelven en los endpoints del ciudadano.',
    'Cada acción relevante (creada, enviada, tomada, aprobada, documento revisado…) se registra con actor, IP y fecha.'
  ],
  perfTitle: 'Rendimiento',
  perf: [
    'Rutas lazy y componentes standalone; el SPA carga solo lo que cada vista necesita.',
    'Filtrado y paginación en el servidor para la bandeja; columnas de estado/asignado/referencia indexadas.',
    'La sesión se restaura una vez al arrancar para que las vistas protegidas eviten el round-trip 401→refresh.'
  ],
  testTitle: 'Testing',
  test: [
    '24 tests de backend: la máquina de estados, lockout, handlers de auth y un flujo completo crear→subir→enviar→tomar→aprobar en SQLite.',
    'Validación del formulario dinámico y RBAC de la bandeja cubiertos; un smoke HTTP end-to-end corre contra SQL Server real.',
    'Un E2E con Playwright ejercita los recorridos del ciudadano y del funcionario con cero errores de consola.'
  ],
  tradeTitle: 'Trade-offs conscientes',
  trade: [
    'Los documentos se guardan como bytes en la base de datos (límite 10 MB) — simple y autocontenido para una demo; producción usaría blob storage + URLs firmadas.',
    'Las notificaciones se muestran solo in-app; email/SMS irían por una cola en producción.',
    'El paso de pago es presentacional — se muestra el modelo de tasas gov pero no se cobra.'
  ],
  technical: 'Un análisis técnico más profundo — patrones, el motor de flujo, seguridad y trade-offs — está en'
};
