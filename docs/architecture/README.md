# PrivGuard — Privacy Compliance & Data Governance Platform

## Overview

PrivGuard is an open-source privacy compliance automation platform. It helps organizations manage GDPR, CCPA, LGPD, and other privacy regulations through automated Data Subject Request (DSR) handling, consent management, data mapping, and Privacy Impact Assessment (PIA) generation.

## Functional Requirements

1. **Consent Management**: Collect, store, and manage user consent preferences with granular purpose categories
2. **Data Subject Requests (DSR)**: Automated intake, verification, and fulfillment of access, deletion, portability, and correction requests
3. **Data Mapping**: Automated discovery and mapping of personal data across systems via connectors
4. **Privacy Impact Assessment (PIA)**: Template-driven risk assessment workflows with approval chains
5. **Policy Engine**: Enforce retention policies, anonymization rules, and consent-based data usage restrictions
6. **Reporting & Audit**: Generate compliance reports, consent dashboards, and breach notification workflows
7. **Connectors**: Pre-built integrations for databases (PostgreSQL, MySQL, MongoDB), SaaS (Salesforce, HubSpot), cloud storage (S3, GCS)
8. **API & Webhooks**: REST API for all operations; webhooks for integration with external systems

## Non-Functional Requirements

1. **Security**: AES-256 encryption at rest, TLS 1.3 in transit, field-level encryption for PII
2. **Compliance**: SOC 2 Type II ready, ISO 27001 aligned, ePrivacy Directive compliant cookie handling
3. **Scalability**: Handle 1M DSRs/year, 10M consent records, 100+ connectors
4. **Auditability**: Immutable audit logs, tamper-evident logging with hash chains
5. **Accessibility**: WCAG 2.1 AA compliant consent banners and dashboards

## Architecture

### High-Level Design

```
┌──────────────────┐
│   Consent Banner │  (JavaScript snippet for websites)
└────────┬─────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│              PrivGuard Core Platform              │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────┐ │
│  │  Consent    │  │    DSR      │  │   Data    │ │
│  │  Manager    │  │  Orchestrator│  │   Catalog  │ │
│  └─────────────┘  └─────────────┘  └───────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────┐ │
│  │    PIA      │  │   Policy    │  │  Report   │ │
│  │   Engine    │  │   Engine    │  │  Builder  │ │
│  └─────────────┘  └─────────────┘  └───────────┘ │
└─────────────────────────────────────────────────┘
         │
    ┌────┴────┬──────────┬──────────┐
    ▼         ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│PostgreSQL│ │   S3   │ │Elastic │ │Connectors│
│(Primary) │ │(Vault) │ │Search  │ │(Workers) │
└────────┘ └────────┘ └────────┘ └────────┘
```

### Components

1. **Consent Manager**: Cookie banner generation, preference storage, purpose-based consent tracking
2. **DSR Orchestrator**: Workflow engine for intake → verify → execute → notify pipeline
3. **Data Catalog**: Graph-based data mapping (Neo4j or PostgreSQL with pg_graphql)
4. **PIA Engine**: Template system, risk scoring, approval workflows
5. **Policy Engine**: Rule evaluation for retention, deletion, and anonymization schedules
6. **Connector Framework**: Plugin architecture for data system integrations
7. **Audit Vault**: Append-only log store with cryptographic integrity

## Technology Stack

- **Backend**: Node.js 20+ / TypeScript, NestJS framework
- **Database**: PostgreSQL 15+ (primary), Neo4j (data mapping graph)
- **Queue**: BullMQ (Redis-based) for async DSR processing
- **Storage**: MinIO (S3-compatible) for encrypted PII vault
- **Search**: Elasticsearch for data catalog search
- **Frontend**: Next.js 14, Tailwind CSS, Radix UI
- **Banner**: Vanilla JS snippet (< 10KB gzipped)

## ADRs

### ADR-001: Why a workflow engine for DSR instead of hardcoded flows

DSR fulfillment varies wildly by regulation (GDPR vs CCPA vs LGPD) and by company process. A workflow engine (using BPMN-like JSON definitions) allows:
- Custom approval chains per request type
- Integration steps (call Salesforce API, run SQL query, notify Slack)
- Retry logic and compensation (undo partially completed deletions)
- Audit trail of every step

### ADR-002: Why graph database for data mapping

Personal data flows form a natural graph:
- User → Email → Salesforce Account → Zendesk Ticket
- Understanding lineage requires graph traversal
- Neo4j provides native graph queries; PostgreSQL with recursive CTEs is alternative for simpler deployments

### ADR-003: Why field-level encryption for PII vault

Regulations require data minimization. If database is compromised:
- Encrypted fields are useless without application keys
- Supports key rotation per data subject
- Allows "crypto-shredding" (delete key = delete data, for right-to-erasure)

## Data Model (Core)

### Consents Table
- `id`, `data_subject_id`, `purpose` (marketing | analytics | functional | personalization)
- `status` (granted | denied | withdrawn)
- `granular_preferences` (JSONB)
- `ip_address`, `user_agent`, `timestamp`, `proof` (cryptographic hash)

### DSR_Requests Table
- `id`, `type` (access | deletion | portability | correction)
- `status` (pending | verifying | processing | completed | rejected)
- `data_subject_id`, `regulation` (gdpr | ccpa | lgpd)
- `workflow_instance_id`, `deadline_at`

### Data_Mappings Table
- `id`, `system`, `entity_type`, `field_name`
- `pii_classification` (email | name | ip | custom)
- `retention_period_days`, `anonymization_strategy`
- `relationships` (JSONB graph edges)

## Risks & Mitigation

1. **Crypto-Shredding vs Recovery**: Maintain encrypted backup keys in HSM for disaster recovery while supporting deletion
2. **False Positive DSRs**: Multi-factor verification (email + SMS + ID document) for high-risk requests
3. **Connector Drift**: Versioned connector schemas; automated health checks; fallback to manual queue

## Roadmap

### Phase 1 (MVP) — Weeks 1-3
- Consent banner generator + preference API
- Basic DSR intake and tracking
- Simple dashboard
- PostgreSQL-only data catalog

### Phase 2 — Weeks 4-6
- DSR workflow engine with approval chains
- PIA template system
- 3 connectors (PostgreSQL, MySQL, REST API generic)
- Audit logging with integrity hashes

### Phase 3 — Weeks 7-10
- Data mapping graph visualization
- Advanced connectors (Salesforce, HubSpot, S3)
- Policy engine (retention schedules)
- Breach notification workflows
- Enterprise features (SSO, multi-tenant)

## Funding Appeal

The global privacy software market is projected to reach $25B by 2028. Enterprises spend $500K-$2M annually on OneTrust and BigID. An open-source alternative with enterprise support model (similar to Mattermost or GitLab) can capture significant market share, especially in EU where privacy is regulated and developers demand transparency.

Target sponsors: EU Horizon Programme, Mozilla Foundation, privacy-focused VCs (Data Grail, Ethyca alumni), GDPR consulting firms.
