# PrivGuard

Open-source Privacy Compliance & Data Governance Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)

## Overview

PrivGuard helps organizations manage GDPR, CCPA, LGPD, and other privacy regulations through automated Data Subject Request (DSR) handling, consent management, and audit logging.

## Features

- **Consent Management** — Granular purpose-based consent collection with marketing, analytics, functional, and personalization categories
- **DSR Workflow Engine** — Automated state transitions for access, deletion, portability, and correction requests
- **Audit Logging** — Immutable audit trails for every DSR state change
- **Consent Portal** — Embeddable consent banner and admin dashboard with statistics
- **REST API** — Full-featured NestJS API with validation, health checks, and statistics endpoints
- **Deadline Tracking** — Visual deadline alerts for overdue and approaching DSR deadlines
- **Accessibility** — WCAG-aligned consent banners with keyboard navigation and ARIA labels

## Quick Start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Build all packages

```bash
pnpm build
```

### 3. Start the services

```bash
# Terminal 1: Start the API
pnpm --filter @privguard/api start

# Terminal 2: Start the Consent Portal
pnpm --filter @privguard/consent-portal dev
```

The API will be available at `http://localhost:3001` and the portal at `http://localhost:3000`.

## Architecture

```
                    +------------------+
                    |  Consent Banner  |
                    |  (Embed Script)  |
                    +--------+---------+
                             |
                             v
+-----------------------------------------------------------+
|                    PrivGuard Core Platform                  |
|  +----------------+  +----------------+  +-------------+  |
|  |   Consent      |  |     DSR        |  |   Health    |  |
|  |   Manager      |  |  Orchestrator    |  |   Check     |  |
|  +----------------+  +----------------+  +-------------+  |
|  +----------------+  +----------------+  +-------------+  |
|  |   Statistics   |  |   Audit Log    |  |   Portal    |  |
|  |   Engine       |  |   Vault        |  |   Dashboard |  |
|  +----------------+  +----------------+  +-------------+  |
+-----------------------------------------------------------+
                             |
              +--------------+--------------+
              |                             |
              v                             v
    +-------------------+         +-------------------+
    |  SQLite (Consents)|         |  SQLite (DSRs)    |
    +-------------------+         +-------------------+
```

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check — returns `{ status: "ok", version: "0.1.0" }` |
| POST | `/consents` | Create a consent record |
| GET | `/consents` | List all consents (optional filters: `dataSubjectId`, `purpose`) |
| GET | `/consents/stats` | Consent statistics by purpose and status |
| GET | `/consents/:id` | Get a single consent |
| PATCH | `/consents/:id` | Update consent status |
| POST | `/dsr` | Create a DSR request |
| GET | `/dsr` | List all DSR requests (optional filters: `status`, `type`) |
| GET | `/dsr/stats` | DSR statistics by type and status |
| GET | `/dsr/:id` | Get a single DSR request |
| PATCH | `/dsr/:id/status` | Update DSR status |

### Error Responses

All errors return a consistent JSON structure:

```json
{
  "error": "Bad Request",
  "message": "Invalid state transition from completed to pending. Allowed: none",
  "statusCode": 400
}
```

## Consent Banner Embed Guide

Add the consent banner to any website by including the React component or using a direct HTML snippet:

```html
<!-- Minimal embed snippet -->
<div id="privguard-consent"></div>
<script>
  (function() {
    const banner = document.createElement('div');
    banner.innerHTML = `
      <div style="position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:1px solid #e5e7eb;padding:1.5rem;z-index:9999;">
        <p>We use cookies to enhance your experience.</p>
        <button onclick="acceptAll()">Accept All</button>
        <button onclick="rejectAll()">Reject All</button>
      </div>
    `;
    document.body.appendChild(banner);

    function acceptAll() {
      fetch('http://localhost:3001/consents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataSubjectId: 'visitor-123',
          purpose: 'marketing',
          status: 'granted'
        })
      });
      banner.style.display = 'none';
    }

    function rejectAll() {
      fetch('http://localhost:3001/consents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataSubjectId: 'visitor-123',
          purpose: 'marketing',
          status: 'denied'
        })
      });
      banner.style.display = 'none';
    }
  })();
</script>
```

For production, use the React component from `@privguard/consent-portal`:

```tsx
import { ConsentBanner } from '@privguard/consent-portal/components/consent-banner';

<ConsentBanner
  apiUrl="https://api.yourdomain.com"
  dataSubjectId="user-123"
/>
```

## DSR Workflow

```
         +---------+
         | pending |
         +----+----+
              |
      +-------+-------+
      |               |
      v               v
+----------+    +----------+
|verifying |    | rejected |
+----+-----+    +----------+
     |
     v
+----------+    +----------+
|processing|    | rejected |
+----+-----+    +----------+
     |
     v
+----------+    +----------+
|completed |    | rejected |
+----------+    +----------+
```

### State Transitions

| From | To | Action |
|------|-----|--------|
| pending | verifying | Start verification |
| pending | rejected | Reject request |
| verifying | processing | Begin fulfillment |
| verifying | rejected | Reject request |
| processing | completed | Fulfill request |
| processing | rejected | Reject request |

### Deadline Enforcement

The engine tracks deadlines and flags overdue requests. The dashboard highlights:
- **Red badge** — Deadline has passed
- **Amber badge** — Deadline within 3 days
- **No badge** — Deadline is more than 3 days away

## Configuration

### API Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | API server port |
| `DATABASE_PATH` | `./privguard.sqlite` | SQLite database file for consents |
| `DSR_DATABASE_PATH` | `./privguard-dsr.sqlite` | SQLite database file for DSRs |

### Consent Portal Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | PrivGuard API base URL |

## Project Structure

```
privguard/
├── packages/
│   ├── api/                    # NestJS REST API
│   │   ├── src/
│   │   │   ├── consent/        # Consent module (controller, service, DTOs)
│   │   │   ├── dsr/            # DSR module (controller, service, DTOs)
│   │   │   ├── health/         # Health check endpoint
│   │   │   ├── common/         # Filters, pipes, interceptors
│   │   │   ├── database/       # SQLite database module
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   └── package.json
│   ├── consent-portal/         # Next.js 14 app
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── admin/      # Admin dashboard & stats pages
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   └── components/
│   │   │       ├── consent-banner.tsx
│   │   │       ├── dsr-dashboard.tsx
│   │   │       └── consent-stats-dashboard.tsx
│   │   └── package.json
│   └── engine/                 # DSR workflow engine
│       ├── src/
│       │   ├── dsr-workflow.service.ts
│       │   ├── types.ts
│       │   └── index.ts
│       └── package.json
├── docs/
│   └── architecture/
│       └── README.md
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
└── README.md
```

## Roadmap

- [x] Consent banner generator + preference API
- [x] Basic DSR intake and tracking
- [x] Simple dashboard with statistics
- [x] SQLite-only data catalog
- [ ] DSR workflow engine with approval chains
- [ ] PIA template system
- [ ] Connectors (PostgreSQL, MySQL, REST API)
- [ ] Audit logging with integrity hashes
- [ ] Data mapping graph visualization
- [ ] Policy engine (retention schedules)
- [ ] Breach notification workflows

## Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create a branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes** with clear commit messages
4. **Run the build** (`pnpm build`) to ensure everything compiles
5. **Open a Pull Request** with a detailed description

Please ensure your code:
- Passes TypeScript strict mode (`noImplicitAny`, `strictNullChecks`)
- Does not use `as any` or `@ts-ignore`
- Follows the existing code style and conventions
- Includes appropriate aria-labels for UI changes

## License

[MIT](LICENSE)

---

Built with privacy in mind.
