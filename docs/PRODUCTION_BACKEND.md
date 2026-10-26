# Production Backend Requirements

**Reference architecture for taking the Marowa Store concept from frontend demonstration to a live service.**

> **Status:** This document is a design reference. No API, database, authentication service or server-side workflow is implemented in this repository. The demonstration is a static frontend with browser-local data only.

---

## 1. Scope and non-goals

### In scope for a production system

- Public catalogue and product detail pages backed by a real database.
- Server-side search, filtering, sorting and pagination.
- Real staff authentication and role-based access control.
- Product, category, brand, image and publication management.
- Stock movements, thresholds, reservations and stock-take corrections.
- Quotation requests with immutable line snapshots, server-calculated indicative totals and status history.
- Inquiry handling and notification delivery.
- Audit logging, operational monitoring, backups and restore procedures.
- Privacy, consent and retention controls suitable for customer data in Kenya.

### Explicit non-goals for the first release

- Card processing or mobile-money collection. If payments are added later, use a PCI-compliant payment service provider; never store card data.
- Full ERP/accounting integration in v1.
- Customer accounts and saved wishlists, unless separately justified.
- Multi-branch inventory transfers in the first increment (the schema can support branches later).
- Automated price negotiation or credit approval.

---

## 2. Guiding principles

1. **The server owns truth.** Prices, totals, stock, statuses and permissions are computed or checked server-side. The browser is untrusted input.
2. **Quotation first.** A request is a record of customer intent, not an order. Prices remain explicitly indicative until a staff member confirms them.
3. **Unknown is not zero.** Nullable price/stock means “needs confirmation”; zero means zero.
4. **Immutable line snapshots.** If a product name or price changes later, an old quotation still shows what the customer saw.
5. **Least privilege.** Public, customer and staff capabilities are separated by route and role.
6. **Auditability.** Every privileged mutation leaves an actor, timestamp, before/after state and request context.
7. **Failure is visible.** Storage, notification and database failures must surface as honest errors, not silent success.

---

## 3. Reference architecture

```text
                         Internet
                            │
                     ┌──────▼──────┐
                     │ CDN / WAF   │  TLS, caching, bot rules
                     └──────┬──────┘
                            │
                     ┌──────▼─────────┐
                     │ Nginx / proxy  │  HSTS, request limits, static assets
                     └──────┬─────────┘
                            │
              ┌─────────────▼──────────────┐
              │ Node.js + Express API      │
              │  - public catalogue        │
              │  - quotation/inquiry       │
              │  - admin auth/RBAC         │
              │  - uploads metadata        │
              └──────┬─────────┬───────────┘
                     │         │
        ┌────────────▼───┐  ┌──▼─────────────┐
        │ PostgreSQL     │  │ Redis (optional)│
        │ primary +      │  │ rate limits,    │
        │ read replica   │  │ sessions, jobs  │
        └────────┬───────┘  └────────────────┘
                 │
        ┌────────▼────────┐      ┌──────────────────┐
        │ Object storage  │      │ Email / WhatsApp │
        │ product images  │      │ notification     │
        └─────────────────┘      │ provider / queue │
                                 └──────────────────┘
```

Recommended baseline:

| Layer | Choice | Notes |
| --- | --- | --- |
| Runtime | Node.js 22 LTS | Pin with `.nvmrc` / container image. |
| API | Express 5 (or Fastify) | Small, explicit middleware stack. |
| Database | PostgreSQL 16+ | `NUMERIC` money/quantity, transactions, JSONB specs. |
| Access | `pg` + Kysely/Drizzle/Prisma | Parameterised queries only; no string SQL. |
| Sessions | PostgreSQL or Redis | Opaque tokens, hashed at rest. |
| Validation | Zod or Joi | Shared schemas, strict unknown-key rejection. |
| Passwords | Argon2id | Per-user salt, tuned memory/time cost. |
| Reverse proxy | Nginx or managed load balancer | TLS termination, body limits, HSTS. |
| Images | S3-compatible object storage + CDN | Strip metadata, generate derivatives. |
| Jobs | BullMQ + Redis, or managed queue | Email/WhatsApp, retries, dead-letter queue. |
| Monitoring | Structured logs + error tracker + uptime checks | Request IDs propagated end-to-end. |

Do not expose PostgreSQL or Redis to the public internet.

---

## 4. Data model

The reference DDL is in [`backend/schema.sql`](../backend/schema.sql). The main entities are:

```text
users ──< sessions
  │
  └──< audit_logs

categories ──< products >── brands
                    │
                    └──< inventory_movements

quotations ──< quotation_items
     │              │
     │              └── product_id (nullable snapshot link)
     └── status history / notes

inquiries
settings
document_counters
```

### Core rules

- `products.price` is `NUMERIC(12,2) NULL`. `NULL` means “confirm price”; it must never be coerced to zero.
- `products.stock_qty` is `NUMERIC(12,3) NULL`. `NULL` means “not configured”; `0` means out of stock.
- `stock_status` is derived from quantity and threshold, not independently editable.
- All stock changes write an `inventory_movements` row. The product quantity is a cached current value, reconciled from the ledger.
- Quotation and inquiry references are generated inside a transaction using `document_counters` with row locking to prevent duplicates.
- Quotation items store `sku_snapshot`, `name_snapshot`, `unit_snapshot`, `unit_price`, `qty` and `line_total`; historical documents must not change when a product is edited.
- Soft-delete products (`deleted_at`) rather than deleting rows referenced by historical quotations.
- `audit_logs` is append-only for application roles; restrict deletion to a controlled maintenance path.
- Store timestamps in UTC (`timestamptz`); render in `Africa/Nairobi` at the edge.

### Derived stock status

```sql
CASE
  WHEN p.stock_qty IS NULL THEN 'contact'
  WHEN p.stock_qty <= 0 THEN 'out-of-stock'
  WHEN p.stock_qty <= COALESCE(p.low_stock_threshold, 0) THEN 'low-stock'
  ELSE 'in-stock'
END
```

Expose this through a view or API serializer. Never accept `stock_status` from a client.

---

## 5. API surface (reference)

All endpoints are HTTPS-only. Public endpoints are rate-limited by IP and route. Admin endpoints require an authenticated staff session and permission checks.

### Public

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/products` | Published products; query: `q`, `category`, `brand`, `stock`, `price`, `featured`, `sort`, `page`, `pageSize`. |
| `GET` | `/api/products/:slug` | Published product detail. |
| `GET` | `/api/categories` | Departments with published counts. |
| `GET` | `/api/brands` | Brands with published counts. |
| `POST` | `/api/quotations` | Create a demonstration/real quotation request; strict validation, honeypot + rate limit. |
| `POST` | `/api/inquiries` | Create an inquiry; strict validation, honeypot + rate limit. |
| `GET` | `/api/health` | Liveness/readiness only; no sensitive detail. |

### Authentication

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Email + password; Argon2id verification; rate limit; optional 2FA challenge. |
| `POST` | `/api/auth/logout` | Revoke current session. |
| `POST` | `/api/auth/2fa/verify` | TOTP challenge for staff. |
| `GET` | `/api/auth/me` | Current session and permissions. |
| `POST` | `/api/auth/password/forgot` | Always return the same response; send single-use, short-lived token. |
| `POST` | `/api/auth/password/reset` | Consume token; revoke existing sessions. |

### Admin (permission-gated)

| Method | Path | Permission |
| --- | --- | --- |
| `GET` | `/api/admin/overview` | `dashboard:read` |
| `GET` | `/api/admin/products` | `catalogue:read` |
| `POST` | `/api/admin/products` | `catalogue:write` |
| `PATCH` | `/api/admin/products/:id` | `catalogue:write` |
| `POST` | `/api/admin/products/:id/publish` | `catalogue:publish` |
| `DELETE` | `/api/admin/products/:id` | `catalogue:delete` |
| `GET` | `/api/admin/inventory` | `inventory:read` |
| `POST` | `/api/admin/inventory/:productId/movements` | `inventory:write` |
| `GET` | `/api/admin/quotations` | `quotations:read` |
| `GET` | `/api/admin/quotations/:id` | `quotations:read` |
| `PATCH` | `/api/admin/quotations/:id/status` | `quotations:write` |
| `PATCH` | `/api/admin/quotations/:id/notes` | `quotations:write` |
| `GET` | `/api/admin/inquiries` | `inquiries:read` |
| `PATCH` | `/api/admin/inquiries/:id` | `inquiries:write` |
| `GET` | `/api/admin/settings` | `settings:read` |
| `PATCH` | `/api/admin/settings` | `settings:write` |
| `GET` | `/api/admin/audit` | `audit:read` |

Use cursor pagination for large audit logs; offset pagination is acceptable for the small product catalogue.

### Response conventions

- JSON only; never reflect raw SQL errors.
- `400` validation with field-level errors.
- `401` unauthenticated; `403` authenticated but forbidden.
- `404` for unknown or unpublished resources (avoid leaking draft existence).
- `409` for conflicts (duplicate SKU/reference).
- `422` for business-rule failures (e.g. invalid status transition).
- `429` with `Retry-After` for limits.
- Include a request ID in responses and logs.

---

## 6. Authentication, sessions and RBAC

### Passwords

- Hash with **Argon2id** (memory ≥ 64 MB, iterations ≥ 3, parallelism ≥ 1; tune to hardware).
- Minimum 12 characters, block known-breached passwords, no forced composition rules.
- Never log passwords, reset tokens or session tokens.
- Optional TOTP 2FA for owner/admin roles; require it for destructive actions in mature deployments.

### Sessions

- Opaque random token (≥ 256 bits), stored hashed in `sessions`.
- Cookie: `HttpOnly; Secure; SameSite=Lax` (or `Strict` if cross-site flows allow).
- Rotate session ID on login and privilege change.
- Idle timeout (e.g. 30 minutes) and absolute timeout (e.g. 12 hours).
- Revoke all sessions on password reset, role change or suspected compromise.
- Do not use JWTs in `localStorage` for staff sessions.

### Roles

| Permission | Owner | Manager | Sales | Stock | Viewer |
| --- | --- | --- | --- | --- | --- |
| Dashboard read | ✓ | ✓ | ✓ | ✓ | ✓ |
| Catalogue read | ✓ | ✓ | ✓ | ✓ | ✓ |
| Catalogue write/publish | ✓ | ✓ | — | — | — |
| Catalogue delete | ✓ | — | — | — | — |
| Inventory read | ✓ | ✓ | ✓ | ✓ | ✓ |
| Inventory write | ✓ | ✓ | — | ✓ | — |
| Quotations read | ✓ | ✓ | ✓ | — | ✓ |
| Quotations status/notes | ✓ | ✓ | ✓ | — | — |
| Inquiries read/write | ✓ | ✓ | ✓ | — | — |
| Settings read | ✓ | ✓ | — | — | — |
| Settings write | ✓ | — | — | — | — |
| Audit read | ✓ | — | — | — | — |
| User management | ✓ | — | — | — | — |

Enforce permissions server-side on every route. The table is a starting point; final roles should follow the store's actual duties and separation of duties.

### Bootstrap

Create the first owner through a one-time CLI or migration, not a public signup form. Do not ship default credentials.

---

## 7. Validation and business rules

Validate on the server even when the client also validates.

### Quotation creation

- `customerName`: 2–120 characters, trimmed, control characters rejected.
- `phone`: normalize to E.164; accept Kenyan formats; store display form separately if needed.
- `email`: optional but syntactically valid; lower-case for lookup.
- `projectType`, `neededBy`, `preferredBranch`: allow-listed values.
- `projectDescription`: 15–4000 characters; plain text; reject HTML.
- `items`: 1–100 lines; each with product ID, quantity `> 0` and `<= 9999`, optional note ≤ 500 characters.
- Reject unknown fields and unexpected content types.
- Re-read every product server-side; never trust client prices, names or SKUs.
- If a product is unpublished/deleted at submission, reject or return a field-level conflict.
- Consent flag must be explicitly true; record consent text version and timestamp.
- Honeypot field, timing check, CAPTCHA/Turnstile for abuse, and IP/phone rate limits.
- Generate reference transactionally, e.g. `MRW-Q-2026-0007`.

### Status transitions

Allowed quotation statuses: `New`, `Under Review`, `Awaiting Customer`, `Quoted`, `Closed`, `Cancelled`.

Recommended transitions:

```text
New ──> Under Review ──> Quoted ──> Closed
  │          │              │
  └──────────┴──────────────┴──> Cancelled
                 └──> Awaiting Customer ──> Quoted
```

Reject invalid transitions with `422`. Record actor, timestamp and optional reason in status history.

### Inventory

- Stock updates use a transaction and row lock (`SELECT … FOR UPDATE`).
- Record a movement reason: `stock_in`, `sale`, `adjustment`, `return`, `damage`, `recount`, `reservation_release`.
- Prevent negative stock unless an explicit “allow negative” policy is enabled and audited.
- Reservations should expire; do not permanently decrement stock for unpaid quotations unless business policy says so.
- Reconcile current quantity to the ledger in a scheduled check.

### Totals

- Calculate line totals with decimal arithmetic in the API, not floating point in the browser.
- Store money as `NUMERIC(12,2)`; round only at defined boundaries.
- “Confirm price” lines contribute `NULL`, not zero, and must be excluded from indicative totals with an explicit count.
- Store the currency code with the quotation.

---

## 8. Security controls

Map controls to OWASP ASVS/Top 10 during implementation and review.

### Transport and headers

- TLS 1.2+ only; redirect HTTP to HTTPS; HSTS with a deliberate max-age.
- `Content-Security-Policy` with nonces/hashes; no `unsafe-inline` scripts; restrict `connect-src` to the API.
- `X-Content-Type-Options: nosniff`.
- `X-Frame-Options: DENY` or CSP `frame-ancestors 'none'`.
- `Referrer-Policy: strict-origin-when-cross-origin`.
- `Permissions-Policy` denying camera, microphone and geolocation unless needed.
- Strict CORS allow-list for any separate admin origin.

### Application

- Parameterised queries/ORM; never concatenate SQL.
- Output encoding for HTML, attributes and JSON.
- CSRF protection for cookie-based mutations: synchroniser token or double-submit with `SameSite`.
- Rate limits on login, quotation, inquiry, password reset and search.
- Login throttling by IP **and** account; generic error messages; alert on distributed attempts.
- Account lockout or progressive delay; avoid user enumeration.
- File upload: allow-list MIME + magic-byte check, size limit, random filename, strip EXIF, re-encode images, serve from a separate origin/CDN.
- SSRF protection if fetching remote images.
- No secrets in the frontend, repository or logs.
- Dependency pinning, lockfiles, `npm audit`/SCA in CI, timely patching.
- Admin routes protected by role checks, not just hidden UI.
- Destructive actions require confirmation and produce audit records.
- Export endpoints stream with authorization checks; no unbounded “download everything” for low-privilege users.

### Logging and privacy

- Log request ID, actor ID, route, status, latency and safe metadata.
- Redact passwords, tokens, full phone/email where not required, and message bodies.
- Do not log raw card data (never collected) or government identifiers.
- Retain audit logs per policy; restrict access.
- Alert on repeated 401/403/429 spikes, mass deletions, export volume and failed jobs.

### Email and WhatsApp

- Send from a verified domain with SPF, DKIM and DMARC.
- Treat all customer input as plain text in email templates.
- Queue notifications; retry with backoff; cap attempts; expose dead-letter jobs.
- Do not include internal notes in customer messages.
- WhatsApp integration should use an approved business provider and template policy.

---

## 9. File and image handling

- Store originals and derivatives in object storage, not on the application filesystem.
- Limit uploads (e.g. 5 MB), accept JPEG/PNG/WebP only, verify magic bytes.
- Re-encode to remove EXIF/GPS and normalize orientation.
- Generate responsive sizes (e.g. 400/800/1200 px) and serve via CDN.
- Use content hashes or UUID filenames; never trust user-supplied filenames.
- Keep an `image_alt` field and require it for published product photography.
- Scan uploads with malware detection if the deployment accepts files from untrusted staff devices.
- Back up object storage with versioning/lifecycle rules.

---

## 10. Backups, availability and disaster recovery

### Targets (example; agree with the store)

- **RPO:** 15 minutes for transactional data.
- **RTO:** 4 hours for full service restoration.

### Practices

- PostgreSQL continuous archiving / WAL to object storage, plus daily full backups.
- Encrypt backups at rest; restrict restore access.
- Retain daily backups for 30 days, weekly for 12 weeks, monthly for 12 months (adjust to policy).
- Test restores quarterly into an isolated environment; record results.
- Object storage versioning and soft-delete protection.
- Run database and application in a managed platform with automated failover if budget allows.
- Health checks: liveness (process), readiness (database reachable), and a separate synthetic check for the quotation flow.
- Graceful shutdown; drain connections; run migrations before traffic in a controlled step.
- Use a staging environment with anonymised or synthetic data.

---

## 11. Deployment and CI/CD

Recommended flow:

```text
pull request
  → lint + type check + unit/integration tests
  → dependency and secret scan
  → build immutable artifact/container
  → deploy to staging
  → migrations (reviewed, backward-compatible)
  → smoke/e2e tests
  → manual approval
  → production rolling/blue-green deploy
  → post-deploy verification
```

- Separate secrets per environment via a secret manager.
- Migrations must be forward-only and safe for rolling deploys (expand/contract pattern).
- Never run destructive schema changes automatically without a backup and approval.
- Pin Node and dependency versions; commit lockfiles.
- Add `/api/health` checks and deployment smoke tests.
- Keep feature flags for risky changes.
- Document rollback for both application and database changes.

---

## 12. Testing strategy

### Automated

- **Unit:** validation, money/quantity rounding, status transitions, reference generation, stock derivation.
- **Integration:** PostgreSQL transactions, unique constraints, quotation creation, inventory ledger, auth/session revocation.
- **API contract:** request/response schemas, permission matrix, error codes.
- **E2E:** public browse → quote; admin login → product/inventory/quote/inquiry flows; price-hidden mode; reset/export.
- **Security:** auth bypass attempts, IDOR, CSRF, rate limits, upload abuse, XSS/SQLi payloads, security headers.
- **Accessibility:** axe or Playwright accessibility checks plus manual screen-reader passes.
- **Load:** catalogue search, quotation submission, admin dashboard at expected and peak concurrency.
- **Backup/restore:** timed restore drill with data-integrity checks.

### Manual before go-live

- Screen readers (NVDA, VoiceOver), keyboard-only navigation and 200% zoom.
- Real devices at 360/390/768/1024/1440 px.
- Print/PDF output for quotations.
- Email/WhatsApp deliverability and template rendering.
- Staff workflow observation at the counter.
- Data-protection review and staff access review.

---

## 13. Migration plan from this demonstration

1. **Freeze the UI contract.** Keep page structure and `Marowa.Store` method names; replace the local store implementation with an API client behind the same interface where practical.
2. **Create the database.** Apply `backend/schema.sql` through a migration tool; seed categories, brands and products from a reviewed CSV.
3. **Build public read endpoints.** Move catalogue filtering/sorting/pagination server-side; keep URL state.
4. **Build quotation and inquiry endpoints.** Add server-side validation, references and notification jobs. Remove client-generated references from production paths.
5. **Replace the demo gate.** Remove `MAROWA-DEMO` and `sessionStorage` sessions; add staff login, 2FA and RBAC.
6. **Move admin mutations.** Implement product CRUD, publish, inventory ledger, queue status/notes and settings with audit logs.
7. **Move images.** Upload to object storage, store paths/alt text, generate derivatives.
8. **Add notifications.** Email to staff/customer and optional WhatsApp; never claim delivery unless the provider accepted it.
9. **Add observability and backups.** Metrics, logs, alerts, restore drill.
10. **Pilot.** Run a controlled staff pilot with real (or shadow) quotations, then review before public launch.
11. **Retire demo data.** Remove the local demo seeding/export/reset paths from production builds.

The frontend's explicit demo labels must remain until every mocked workflow has a real, tested server-side replacement.

---

## 14. Privacy and legal considerations (Kenya)

- **Data Protection Act, 2019 (Kenya):** determine whether the store is a data controller; provide a lawful basis, privacy notice, data-subject access/correction/deletion process, retention schedule and breach response.
- Collect the minimum data needed: name, phone/email, project details, request lines. Avoid sensitive data.
- Record consent for the demo/production distinction and for marketing separately.
- Do not publish customer names, phone numbers or internal notes on public pages.
- Restrict staff access on a need-to-know basis; log access to customer records.
- Define retention (e.g. quotations for accounting/business needs, inquiries for a shorter period) and automate deletion/archiving.
- Cross-border transfers (email/cloud providers) require appropriate safeguards and disclosure.
- Trademark and branding use require the store's permission; sample brand names in the demo are illustrative only.
- Consumer-facing prices, delivery charges and availability claims must be accurate and not misleading.
- If payments are added, use a licensed PSP and comply with PCI DSS scope-reduction requirements. Never store card numbers, CVV or mobile-money PINs.

Have the final privacy notice, terms and retention policy reviewed by a qualified adviser.

---

## 15. Go-live checklist

### Product and data

- [ ] Store has approved the design, copy, brand treatment and claims.
- [ ] Real product data, prices, units, stock and images verified.
- [ ] “Confirm price/availability” states reviewed and staffed.
- [ ] Categories, brands, search synonyms and sort defaults agreed.
- [ ] Quotation statuses and notification recipients agreed.

### Security

- [ ] Staff login, password hashing, 2FA and RBAC tested.
- [ ] Demo access code removed from production.
- [ ] CSRF, rate limits, upload limits and security headers verified.
- [ ] Secrets stored outside the repository; production `.env` access restricted.
- [ ] Dependency and container scans clean or accepted.
- [ ] Penetration/security review completed for the release scope.
- [ ] Audit log retention and access reviewed.

### Operations

- [ ] Backups configured and restore drill passed.
- [ ] Monitoring, alerts and on-call ownership defined.
- [ ] Staging and production separated.
- [ ] Migrations and rollback documented.
- [ ] Incident response and breach notification contacts defined.
- [ ] Uptime and synthetic quotation checks active.

### Legal and customer

- [ ] Privacy notice, terms, delivery and returns policy published.
- [ ] Consent and retention implemented.
- [ ] Accessibility review completed.
- [ ] Real contact details and opening hours verified.
- [ ] Staff trained on quotation follow-up and customer data handling.
- [ ] Demo labels removed only after every workflow is genuinely live.

---

## 16. Minimum acceptance criteria for “production ready”

A release should not be called production-ready until:

1. All public catalogue and quotation data comes from PostgreSQL through the API.
2. Admin access is server-authenticated with tested RBAC and 2FA for privileged roles.
3. Quotation references and totals are generated server-side in transactions.
4. Inventory changes are ledgered and reconcile to current quantities.
5. Notification delivery has retries, monitoring and an honest failure state.
6. Backups have been restored successfully in a drill.
7. Security headers, rate limits, CSRF and validation are verified by tests.
8. Privacy, retention and customer-data processes are documented and staffed.
9. The store has explicitly approved the launch and the content.
10. The demo access code, demo data and “sample only” ambiguity are removed from the production experience.

Until then, this repository should remain labelled as an independent demonstration.
