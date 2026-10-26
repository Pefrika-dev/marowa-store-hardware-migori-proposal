# Marowa Store — Digital Commerce & Hardware Management Concept

**An independent frontend proposal for a hardware store in Migori Town, Kenya.**

Prepared by **Thomas Hondo Chacha — Software Engineer**  
Digital Commerce Concept Designed & Developed by Thomas Hondo Chacha — Software Engineer.

> **Important:** This is an independent demonstration project. It was not commissioned, approved, reviewed or operated by Marowa Store. Product names, prices, stock levels, quotations, inquiries, charts and customer records are **sample demonstration data**. The site has no backend, no real authentication, no payment processing and no connection to the store's records. See [Credits & disclaimer](credits.html) and [Production backend requirements](docs/PRODUCTION_BACKEND.md).

---

## 1. The proposal in one page

Marowa Store is a hardware, tools and building-materials retailer in Migori Town, next to Bansi Wholesale. A typical customer enquiry is rarely a single item: it is a list of materials for a roof, a bathroom, a shop fit-out or a repair job. That creates three practical problems:

1. **Discovery** — customers cannot see what is available before travelling to the counter.
2. **Bulk requests** — a phone call or WhatsApp message is a poor container for 20 product lines, quantities and project notes.
3. **Stock visibility** — staff need a clear view of what is published, what is low, what is out of stock and what still needs a physical count.

This concept explores a quotation-first digital commerce experience: browse a structured catalogue, build a multi-line request, save it locally, and review it in a back-office demonstration. There is deliberately **no checkout and no payment**, because a real hardware quotation still depends on confirmed stock, delivery terms, credit arrangements and current pricing.

The result is a complete, responsive, static frontend that can be evaluated immediately, plus a documented reference architecture for the production system that would be required before it could serve real customers.

### What this project demonstrates

- A premium storefront with a 25-product sample catalogue across nine departments.
- Search, department/brand/availability/price-state filters, sorting and pagination.
- Product pages with gallery, specifications, stock states, quantity controls and cart/quote actions.
- A multi-line quotation builder with project details, validation, review, local reference and printable demo request.
- A cart that persists in the browser and converts into a quotation request.
- A contact form that saves a local demonstration inquiry without pretending to send it.
- A substantial admin demonstration: live metrics, product CRUD, inventory updates, quotation and inquiry queues, status/notes, CSS charts, settings, export/import and reset.
- Honest labelling at every step: demo ribbon, sample-data notices, demonstration references, print stamps and a full credits/disclaimer page.
- A clear security and production-requirements document, so the gap between prototype and live deployment is not hidden.

### What this project is not

- It is **not** an official Marowa Store website.
- It is **not** production software and must not be presented as such.
- It does **not** authenticate administrators. The demo access code is public and exists only to separate the storefront from the admin demonstration.
- It does **not** send email, WhatsApp messages, SMS or orders.
- It does **not** process payments, hold card data, reserve stock or create real quotations.
- It does **not** use a database or API. All state lives in the browser's `localStorage`.
- It does **not** contain verified store prices, stock or product photography.

The only real business details used are the contact details supplied for this proposal: phone **0716 865 976**, email **marowastores@gmail.com**, and location **Migori Town, next to Bansi Wholesale**.

---

## 2. Run the demonstration

### Requirements

- **Node.js 18 or newer** (built and tested with Node **v24.14.1**, npm **11.11.0**).
- Any modern Chromium, Firefox or Safari browser.

No dependencies are installed and there is no build step.

### Start

From the project directory:

```powershell
npm start
```

Then open:

```text
http://localhost:5500
```

`npm run dev` runs the same static server. To stop it, press `Ctrl+C` in the terminal.

### Demo access code

The admin demonstration is behind a **demo-only gate**:

```text
MAROWA-DEMO
```

The code is intentionally visible on the login page. It is not authentication, it is not secret, and it does not protect any real data. The session is stored in `sessionStorage`, expires after two hours, and ends when the tab closes.

### Opening the files directly

The frontend is plain HTML, CSS and classic deferred scripts, with no bundler. Opening `index.html` directly from disk may work in some browsers, but browser security rules for `localStorage`, downloads and pop-ups vary by `file://` context. Use `npm start` for consistent behaviour and all tested features.

### Resetting the demo

Open **Admin → Settings → Reset demo data**. This restores the original 25 sample products, five sample quotations, three sample inquiries, default settings and clears the cart/quotation list. Export a JSON snapshot first if you want to keep your changes.

---

## 3. Suggested evaluation walkthrough

1. **Home** — read the demo ribbon and sample-data notices; open a featured product.
2. **Catalogue** — search for `drill`, filter by **Power Tools**, then by **Low stock**; change sort to price ascending; move to page 2.
3. **Product detail** — open *Cordless Drill Driver*; change quantity and add to both cart and quotation list. Open *Wall Light Switch* to see an out-of-stock state, and *Adjustable Spanner 250mm* to see a genuinely unconfigured price.
4. **Cart** — change a quantity, remove a line, then **Convert to quotation**.
5. **Quotation** — add project and contact details; submit once with missing fields to see validation; then submit valid details and print the stamped demonstration request.
6. **Contact** — save a demonstration inquiry; use the separate real phone, WhatsApp and email links.
7. **Admin** — open **Admin demo**, enter `MAROWA-DEMO`, then:
   - edit a product and change its price/stock;
   - add a product, then delete it;
   - update inventory and watch the dashboard metrics change;
   - open a quotation, change status and add an internal note;
   - open an inquiry and change its status;
   - review analytics charts;
   - turn **Show indicative prices** off and check the storefront/cart/quotation again;
   - export JSON, then reset the demonstration.
8. **Responsive** — resize from 1440 px down to 360 px; use the mobile filter drawer and menu.

---

## 4. Feature summary

### Storefront

- Premium visual system: deep charcoal/navy, white, construction orange, neutral grays, strong editorial typography.
- Responsive header, demo ribbon, global search dialog, cart/quote counts, mobile navigation.
- Home page with hero, category grid, featured products, quotation explainer, workflow, principles and demo boundaries.
- Nine departments and nine sample brands.
- 25 sample products: 23 published, two deliberately unpublished drafts for admin-state testing.
- Product cards with local image, brand, SKU, unit, sample price or “Confirm price”, stock badge, add-to-cart and add-to-quote actions.
- Full catalogue filtering:
  - text search across name, SKU, brand and category;
  - department and brand;
  - stock state (`in-stock`, `low-stock`, `out-of-stock`, `contact`);
  - price state (`priced`, `confirm`);
  - featured-only;
  - sort by featured, name, price ascending/descending, stock;
  - pagination with configurable page size;
  - active filter chips, clear-all, empty state, URL query persistence.
- Product detail pages with breadcrumb, image, gallery note, description, specifications, category, brand, SKU, unit, stock explanation, related items and unpublished-state handling.
- Cart with quantity controls, removal, clear, indicative totals, persistence, and conversion into the quotation list.
- Quotation builder with line quantities/notes, project/contact form, validation, consent, live summary/review, local save, reference generation and printable demo request.
- Contact page with local demo form and separate real contact actions.
- Credits/disclaimer page covering image licences, fonts, sample data and the independent-project boundary.
- Custom 404-like product state for unknown IDs.
- SEO metadata, Open Graph/Twitter tags, sitemap, robots, favicon and a conservative `WebSite` structured-data block on the home page.

### Admin demonstration

- Demo-only gate with visible access code and a clear “not authentication” warning.
- Hash-routed views: Overview, Products, Inventory, Quotations, Inquiries, Analytics, Settings.
- **Overview:** published product count, low/out-of-stock signals, open requests, indicative pipeline, six-month quotation chart, status donut, recent requests, low-stock list, activity log and department snapshot — all computed from local data.
- **Products:** search/filter, product table, add/edit dialog, publish/unpublish, featured flag, price/stock/threshold, image path and alt text, validation, delete confirmation.
- **Inventory:** stock metrics, filter table, stock update dialog, reason/note, automatic status derivation and activity logging.
- **Quotations:** search/status filters, queue table, detail dialog, status and internal notes, line snapshot, printable stamped quotation.
- **Inquiries:** search/status filters, detail dialog, status and internal notes.
- **Analytics:** computed CSS bar charts for requests by month, category stock value, request funnel and brand spread; stock donut.
- **Settings:** business details, currency, page size, low-stock threshold, reference prefixes, indicative-price visibility, storage meter, JSON export/download, import, reset.
- All admin actions persist to `localStorage` and update the interface through a small store subscription.

---

## 5. Demonstration data model

The demo state is stored under:

```text
marowa.demo.state.v1
```

The session gate is stored under:

```text
marowa.demo.session.v1
```

The state includes:

- products (with demo-only IDs, SKUs, categories, brands, units, prices, stock quantities, thresholds, specs, images, publication state);
- categories and brands;
- cart lines;
- quotation list lines;
- saved demonstration quotations with references, customer/project details, line snapshots and internal status/notes;
- demonstration inquiries;
- settings;
- an activity log.

All writes go through `js/store.js`. If storage is unavailable, the store falls back to in-memory state for the current tab and warns the user.

### Stock semantics

The demo deliberately distinguishes:

| State | Meaning |
| --- | --- |
| **In stock** | Quantity is known and above the low-stock threshold. |
| **Low stock** | Quantity is known and at or below the threshold. |
| **Out of stock** | Quantity is explicitly `0`. |
| **Confirm availability** | Quantity is not configured; this is not the same as zero. |

“Confirm price” similarly means the sample price is intentionally unconfigured — not free and not zero.

---

## 6. Technology

- **HTML5** — semantic static pages, no client-side framework.
- **CSS** — hand-written token system, Grid/Flexbox, custom properties, responsive breakpoints, reduced-motion and print styles.
- **JavaScript** — ES2015+ classic scripts under a single `window.Marowa` namespace; no bundler and no runtime dependencies.
- **Storage** — versioned browser `localStorage` with defensive parsing, validation, fallbacks, export/import and reset.
- **Node.js** — a small static file server with MIME handling, traversal protection, security headers, HEAD support and correct caching.
- **Fonts** — self-hosted Archivo, Inter and IBM Plex Mono (SIL Open Font License 1.1).
- **Images** — local, compressed, illustrative stock/freely licensed photography; no runtime third-party image requests.
- **Icons** — original inline SVG set in `js/icons.js`.

There is **no Express API, no database, no ORM, no authentication library and no payment SDK** in this repository. Those are documented as production requirements, not implemented here.

---

## 7. Project structure

```text
.
├─ index.html                  Home
├─ products.html               Catalogue
├─ product-details.html        Product detail
├─ categories.html             Departments
├─ brands.html                 Brands
├─ quotation.html              Quotation builder
├─ cart.html                   Cart
├─ contact.html                Contact and local inquiry
├─ credits.html                Credits, licences, disclaimer
├─ login.html                  Demo-only admin gate
├─ admin.html                  Admin demonstration shell
├─ css/
│  ├─ style.css                Storefront design system and pages
│  └─ admin.css                Admin shell, tables, charts, dialogs
├─ js/
│  ├─ config.js                Business/demo/SEO configuration
│  ├─ data.js                  Categories, brands, sample products
│  ├─ store.js                 Local state, validation, CRUD, persistence
│  ├─ icons.js                 Inline SVG icon set
│  ├─ app.js                   Shared UI, navigation, cards, search, print
│  ├─ products.js              Catalogue filtering/sorting/pagination
│  ├─ product-details.js       Product page rendering
│  ├─ cart.js                  Cart rendering and conversion
│  ├─ quotation.js             Quotation builder and printable request
│  ├─ contact.js               Local inquiry form
│  ├─ auth.js                  Demo session gate (not authentication)
│  └─ admin.js                 Admin views, metrics, CRUD, charts
├─ assets/
│  ├─ img/                     Local photography and placeholder
│  ├─ fonts/                   Self-hosted WOFF2 files
│  └─ favicon.svg              Original placeholder mark
├─ server.js                   Static server, port 5500
├─ package.json                npm start / npm run dev
├─ robots.txt
├─ sitemap.xml                 Placeholder host — replace before deployment
├─ docs/
│  └─ PRODUCTION_BACKEND.md    Reference production architecture
├─ backend/
│  ├─ schema.sql               Reference PostgreSQL schema
│  └─ .env.example             Reference environment variables
├─ tools/                      Image provenance/preparation utilities
└─ assets/candidates/          Source-image provenance and manifests
```

The `tools/` and `assets/candidates/` folders are retained for provenance and regeneration. They are not part of the runtime interface.

---

## 8. Design and content decisions

- **Quotation-first, not checkout-first.** Hardware purchasing depends on confirmation, delivery and credit; a checkout would be dishonest and technically hollow without a backend.
- **No invented prices.** Where a real price was not known, the catalogue says “Confirm price” instead of inventing a number.
- **Unknown is not zero.** Availability can be “Confirm availability” without implying no stock.
- **No fake official branding.** The “M” block is an original typographic placeholder. No official logo, trade dress or internal record is claimed.
- **Illustrative photography.** Images come from Pexels and Wikimedia Commons. The store-interior image is a New Orleans hardware shop and is explicitly captioned as **not** Marowa Store.
- **Sample brand references.** Brand names illustrate filtering and catalogue grouping only; no dealership or endorsement is implied.
- **Visible demo boundary.** A ribbon, notices, demo chips, sample references and print stamps prevent the interface from being mistaken for a live store.

---

## 9. Accessibility and responsive behaviour

Implemented:

- Skip link and semantic landmarks.
- Visible keyboard focus styles.
- Native buttons, links, labels, fieldsets and `dialog` elements.
- Form error text tied to inputs through `aria-describedby`/`aria-invalid`.
- `aria-live` toast region, search results and status labels.
- Mobile menu and filter drawer with `aria-expanded` state and escape/backdrop close.
- Minimum target sizing for icon controls.
- Reduced-motion handling for reveal animations.
- Image alt text on product/category photography, with decorative images marked empty where appropriate.
- Print styles for the quotation request.

Measured responsive checks (see §11) found no document-level horizontal overflow at **360, 390, 768, 1024 and 1440 px** across the tested pages. The admin sidebar is intentionally off-canvas at narrow widths and therefore sits outside the viewport when closed; this is expected, not overflow.

Not yet verified: real screen-reader sessions (NVDA/JAWS/VoiceOver), browser zoom at 200%/400%, forced-colours mode, and physical mobile devices. These are listed as remaining validation work, not claimed as passed.

---

## 10. SEO and metadata

- Unique page titles and descriptions.
- Open Graph and Twitter card metadata.
- Canonical/Open Graph URL support through `js/config.js` when a real `seo.siteUrl` is set.
- `robots.txt` excludes the admin demonstration and login gate.
- `sitemap.xml` is provided with the reserved placeholder host `marowa-concept.example`; replace it with the deployed origin before publishing.
- Home page includes one conservative `WebSite` JSON-LD block describing the independent demonstration. No `Product`, `Offer`, `LocalBusiness` or review markup is emitted, because the data is not verified store data.

---

## 11. Testing actually performed

**Date:** October 2026  
**Environment:** Windows, Node v24.14.1, Chromium-based browser session, local static server on port 5500.

### Static checks

- `node --check` passed for all 13 JavaScript files (12 browser scripts plus `server.js`).
- No mojibake/replacement-character corruption found in project text files after the final edits.
- HTML was manually inspected for broken nesting during development; no automated HTML validator was run.

### HTTP smoke checks

| Check | Result |
| --- | --- |
| `GET /` | `200`, `text/html` |
| `GET /products.html` | `200`, `text/html` |
| `GET /js/app.js` | `200`, `text/javascript`, `Cache-Control: no-cache` |
| `GET /assets/favicon.svg` | `200`, `image/svg+xml` |
| `GET /missing-page.html` | `404` |
| `POST /` | `405` |
| `HEAD /` | `200` |

### Storefront interaction checks

- Home rendered 8 featured cards and 9 departments; no broken local images; no console errors.
- Catalogue showed 23 published listings, 9 per page across 3 pages.
- Power Tools filter returned 3 products; adding Low stock returned 1.
- “Clear all” restored 23 results.
- Price-ascending sort produced ordered demo prices; page 2 changed results and URL state.
- Product detail for *Cordless Drill Driver* rendered title, gallery, KSh 6,850 sample price, 12-unit stock and 4 related products.
- Quantity 2 was added to both cart and quotation list; header counts updated.
- Cart quantity increased from 2 to 3; indicative total updated; conversion cleared the cart and merged quantities into the quotation list.
- Quotation with empty fields produced field-level errors and focused the first invalid field.
- Valid quotation save produced reference `MRW-Q-2026-0006`, cleared the quotation list, hid the builder and displayed the confirmation.
- Printable demo request HTML was generated (5,667 characters) with the demonstration stamp, customer details and hidden-price state.
- Contact form produced a name error on empty submit; a valid save produced demo reference `MRW-I-2026-0004`.
- When **Show indicative prices** was turned off, catalogue cards, product pages, search results, cart lines, cart total, quotation lines, quotation review, summary and print output hid or replaced the amounts.

### Admin checks

- Unauthenticated `/admin.html` redirected to `login.html?next=admin.html`.
- Wrong code produced the expected error; `MAROWA-DEMO` opened the admin.
- End-session cleared the session and redirected to the login demonstration.
- Overview computed 23 published products, 5 low/out-of-stock signals, open request count, pipeline value, a 12-bar six-month chart, a status donut and five department status bars.
- Product search, category/status filters, edit, create, duplicate-SKU validation, publish/unpublish and delete paths worked. A created test product persisted, appeared in the table, survived a cancelled delete, and was removed after the delete was confirmed.
- Inventory low-stock and out-of-stock filters returned the correct records. Updating quantity recalculated stock state and metrics; saving a blank quantity set “Not configured”. A negative quantity was blocked by form validation.
- Delete, reset, clear-cart and clear-quotation confirmations were exercised with both cancel and confirm. Their promise resolution was made independent of native dialog close-event timing after testing exposed an unreliable path.
- Confirmation dialogs were retested after the fix: delete removed the record, reset restored seed data, and both cart and quotation list clearing persisted.
- Quotation status changed to “Under Review” with an internal note and persisted.
- Inquiry status changed to “In Progress” with an internal note and persisted.
- Analytics rendered 9 category bars, 9 brand bars, 5 funnel bars, a stock donut with 4 legend rows and 9 value bars.
- Settings saved page size and price visibility; storefront reflected both.
- JSON export produced a valid snapshot of roughly 49 KB containing `exportedAt`, `note` and `state` with 25 products. Invalid import was rejected; pasted and file-upload imports both restored data.
- Reset restored the original counts, settings, cart/quotation list and removed test records.

### Responsive checks

A temporary same-origin iframe harness measured nine pages at five widths: **360, 390, 768, 1024 and 1440 px** — 45 page/width combinations.

- **No document-level horizontal overflow** was found at any tested width.
- **No broken images** were found.
- Storefront, quotation, cart, contact, credits, login and admin all loaded with the expected page content.
- The 390 px filter drawer opened at `top: 0`, closed off-screen, and kept `aria-expanded` in sync.
- The mobile menu opened, exposed six primary links, and closed.
- At 1000 px the header quote control was initially an empty pill after its label was hidden; this was fixed by adding a visible clipboard icon and an accessible label, then retested.

### Not tested / not claimed

- Automated unit, integration or end-to-end test suites (none are included).
- Real screen-reader sessions.
- Safari, Firefox, Edge or mobile device testing.
- The native print dialog itself (the printable HTML was generated and inspected; the OS print dialog was not automated).
- The final on-disk destination of browser downloads (the export code path ran and produced valid JSON in the page).
- Production-scale performance, load, penetration or backup/restore testing.
- Real payment, email, WhatsApp, SMS or server-side workflows — they do not exist in this frontend.

---

## 12. Known limitations

1. **No backend.** Data is per-browser and can be cleared. Two devices do not share records.
2. **No real authentication.** The demo gate is cosmetic and public by design.
3. **No real inventory.** Stock is a local number; it does not reserve, decrement on order or synchronise.
4. **No real quotation delivery.** Saving creates a local record only.
5. **No payments or checkout.** This is intentional.
6. **Sample data.** Prices, stock, product descriptions and specifications are illustrative. Some are deliberately unconfigured to demonstrate “confirm” states.
7. **Illustrative imagery.** Photographs are stock/freely licensed images, not the store's products or premises.
8. **Placeholder SEO host.** `sitemap.xml` and `js/config.js` use reserved/example values until a real domain is configured.
9. **Demo access code in client code.** Unsuitable for production; replace with server-side authentication.
10. **No automated test suite.** Validation was performed through syntax checks, HTTP checks and scripted browser interactions.

---

## 13. Production requirements

Before this interface could serve real customers, it would need at minimum:

- a Node.js/Express API with server-side validation;
- PostgreSQL with migrations, transactions and backups;
- real authentication, password hashing (Argon2id/bcrypt), sessions and RBAC;
- CSRF protection, rate limiting, secure headers, audit logging;
- server-calculated prices/totals and a stock-movement ledger with reservations;
- email/WhatsApp notification workers and delivery tracking;
- secure image upload/storage;
- privacy notice, consent, retention and data-subject processes under Kenya's Data Protection Act;
- monitoring, error tracking, staging, CI/CD and restore drills;
- legal review of branding, trademarks, pricing and delivery claims.

The full reference architecture, API sketch, schema rationale, security controls and go-live checklist are in **[docs/PRODUCTION_BACKEND.md](docs/PRODUCTION_BACKEND.md)**. A reference PostgreSQL schema is in **[backend/schema.sql](backend/schema.sql)**, and environment placeholders are in **[backend/.env.example](backend/.env.example)**.

---

## 14. Credits

Photography, font licences, the independent-project disclaimer and the “not an official store” statement are documented on **[credits.html](credits.html)**.

- Photography: Pexels licence and Wikimedia Commons licences (individual attribution on the credits page).
- Fonts: Archivo (Omnibus-Type), Inter (Rasmus Andersson), IBM Plex Mono (IBM) — SIL Open Font License 1.1, self-hosted.
- Icons and interface code: original work for this concept.
- Business contact details: supplied for this proposal — phone `0716 865 976`, email `marowastores@gmail.com`, Migori Town, next to Bansi Wholesale.

---

## 15. Developer credit and licence

**Digital Commerce Concept Designed & Developed by Thomas Hondo Chacha — Software Engineer.**

The source code and original design are provided as an unlicensed proposal for evaluation. They may not be represented as commissioned work or deployed as an official Marowa Store service without the store's agreement and a production review. Photographs and fonts remain subject to their own licences. See `credits.html` and `package.json` (`"license": "UNLICENSED"`).

---

*Independent demonstration. Sample data only. No order, payment, reservation or message is created or transmitted.*
