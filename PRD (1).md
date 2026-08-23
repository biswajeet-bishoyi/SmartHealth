# PRD — SmartHealthNE
### Smart Community Health Monitoring & Early Warning System
**Prepared for:** Smart India Hackathon (SIH) prototype
**Status:** Draft v1.0

---

## 1. Overview

SmartHealthNE is a community health reporting and early-warning platform for rural
Northeast India, focused on **water-related illness detection**, not general hospital
management or medical diagnosis.

The system ingests community-submitted symptom and water-quality reports, runs them
through a transparent, configurable **risk-scoring engine**, and routes high-risk
signals through a human verification chain (Health Worker → National Admin) before
broadcasting alerts back to the community in real time.

**Explicit non-goals:**
- Not a hospital/patient management system
- Not a diagnostic tool — risk scores are public-health monitoring indicators only,
  never a disease diagnosis or personalized medical advice

---

## 2. Problem Statement

Rural NE Indian communities often lack early warning for water-borne disease
outbreaks. Symptom clusters (diarrhea, vomiting, dehydration) tied to contaminated
water sources go unnoticed until an outbreak is already underway, because:

- There's no structured channel for community members to report symptoms/water
  issues
- Health workers have no aggregated, real-time view of village-level risk
- There's no verification pipeline between raw reports and public alerts, so false
  alarms and unverified panic are both risks

## 3. Goals

- Let community members report symptoms and water issues in under a minute, on a
  low-end mobile device, with poor connectivity
- Automatically compute a village-level risk score after every report
- Route HIGH/CRITICAL risk signals through Health Worker verification and (when
  required) National Admin approval before any public alert
- Deliver real-time alerts to affected communities once approved
- Give admins a state/district-level analytics and map view for resource planning

## 4. Non-Goals

- Individual disease diagnosis
- Clinical/EHR-grade patient records
- Treatment recommendations
- Payment, billing, or hospital-operations features

---

## 5. Users & Roles

| Role | Description | Key Needs |
|---|---|---|
| **COMMUNITY_MEMBER** | Rural resident, may have low digital literacy | Extremely simple mobile UI, large buttons, local-language support, works offline |
| **HEALTH_WORKER** | Local/regional health staff | Review queue, verification tools, village trend charts, real-time new-report alerts |
| **NATIONAL_ADMIN** | Public-health administrator | Cross-region analytics, map, alert approval, user management |

RBAC is enforced **server-side** on every route — frontend route guards are UX only,
never the security boundary.

---

## 6. Core User Flow (End-to-End)

```
Community Member
  → Health/Symptom Report
  → Backend Validation
  → Database Storage
  → Risk Analysis Engine
  → Potential Risk Detection
  → Health Worker Review
  → Verification
  → National Admin Approval
  → Real-Time Community Alert
  → Awareness / Preventive Action
  → Analytics
```

---

## 7. Functional Requirements

### 7.1 Authentication & Authorization
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- JWT (`userId`, `role`) + bcrypt password hashing
- Middleware: `requireAuth`, `requireRole(role)`
- No plaintext passwords, ever

### 7.2 User Model
Fields: `name, email, phone, password, role, state, district, village, language,
createdAt, updatedAt`. Indexed on role/location for query performance.

### 7.3 Health Reporting
- `POST /api/reports`
- Fields: `userId, state, district, village, latitude, longitude, symptoms,
  duration, affectedPeople, waterSource, waterIssues, description, status,
  createdAt, verifiedBy, verifiedAt`
- Symptoms: `diarrhea, vomiting, fever, abdominal_pain, dehydration, other`
- Status lifecycle: `PENDING → VERIFIED / REJECTED`
- **Reports describe symptoms/observations only — never a diagnosis label**

### 7.4 Water Issue Reporting
- Separate endpoint/model: `location, village, district, waterSource, issueType,
  severity, description, reportedBy, createdAt`
- Issue types: `dirty_water, bad_smell, flood_contamination,
  broken_water_source, suspected_contamination, other`
- Feeds directly into the risk engine's water score

### 7.5 Early Warning / Risk Engine
Location: `server/services/riskEngine.js`

```
riskScore = symptomScore * 0.40
          + growthScore  * 0.25
          + waterScore   * 0.20
          + clusterScore * 0.15
```

All components normalized 0–100. Weights and thresholds are **configurable**, not
hard-coded, and explicitly labeled as prototype/public-health parameters — not
medically validated values.

| Score | Level |
|---|---|
| 0–30 | LOW |
| 31–60 | MEDIUM |
| 61–80 | HIGH |
| 81–100 | CRITICAL |

**Component logic:**
- **Symptom score** — concentration of recent reports, weighted higher for
  diarrhea/vomiting/dehydration, configurable weights
- **Growth score** — `(current 7-day - previous 7-day) / previous * 100`, with
  safe handling when previous = 0
- **Water score** — driven by dirty/contaminated/flood-affected water reports,
  location-specific
- **Cluster score** — geographic concentration by village/district (and optional
  lat/long) within a configurable time window; avoid expensive geo algorithms

Risk assessments are stored per location with full component breakdown and
`calculatedAt` timestamp for auditability.

### 7.6 Automatic Risk Detection Pipeline
On every new report: validate → save → recalculate location risk → store
assessment → determine level → if HIGH/CRITICAL, create a **potential alert** and
notify Health Workers in real time. **No automatic report bypasses human
verification before reaching the community.**

### 7.7 Health Worker Verification
- Review queue: pending reports, location/symptom/water-issue detail, village
  trends
- `PATCH /api/health-worker/reports/:id/verify` — records `verifiedBy,
  verifiedAt, status, verificationNotes`
- Can verify, reject, and create/escalate potential alerts

### 7.8 Alert System
Alert model: `title, message, riskLevel, state, district, village,
targetAudience, createdBy, approvedBy, status, createdAt, approvedAt, expiresAt`

Status lifecycle:
`PENDING_REVIEW → VERIFIED → APPROVED → BROADCAST` (or `REJECTED` / `EXPIRED`)

Target audience: `COMMUNITY, HEALTH_WORKER, REGIONAL, NATIONAL`

Admin actions: approve, reject, broadcast, expire.

### 7.9 Real-Time Layer (Socket.IO)
Events: `NEW_HEALTH_REPORT, RISK_LEVEL_UPDATED, NEW_ALERT, ALERT_APPROVED,
ALERT_BROADCAST`. Health Worker dashboards and Community alert views update
live without page refresh.

### 7.10 Awareness Module
`/community/awareness` — categories: Safe Water, Hygiene, Food Safety,
Water-Borne Disease Awareness, Emergency Warning Signs. Content fields: `title,
description, category, language, source, image, createdAt`. Clearly separated
from personalized medical advice.

### 7.11 Map & Analytics
- Leaflet + OpenStreetMap, Northeast India overview, state/district/village
  markers color-coded by risk level, click-through detail (no unnecessary PII)
- Admin analytics: reports by day/week/month/state/district/village, symptom
  distribution, water issue distribution, risk distribution, alert history

### 7.12 Multilingual Support
English, Hindi, Assamese, Bengali at launch; i18n structured for easy addition
of further NE Indian languages. No hard-coded UI strings.

### 7.13 PWA / Offline Mode
Installable PWA. Offline report queue: save locally → "Pending Sync" status →
auto-submit on reconnect → visible sync status. No report loss on connectivity
drop. Lightweight assets, minimal animation.

---

## 8. Non-Functional Requirements

- **Security:** Helmet, CORS, express-rate-limit, input validation, Mongo schema
  validation, no hard-coded secrets, sanitized input, centralized error handler
  with no stack-trace leakage in production
- **Consistency:** all API responses follow `{ success, data }` /
  `{ success: false, message }` shape
- **Accessibility & trust:** government/public-health-grade UI — clean,
  accessible contrast, no gaming-style or flashy visuals
- **Performance:** mobile-first, low-bandwidth friendly, avoid expensive
  clustering algorithms at prototype scale
- **Responsiveness:** community UI mobile-first; health-worker/admin UI works
  desktop/tablet/mobile

---

## 9. Data Model Summary

| Model | Key Fields |
|---|---|
| User | name, email, phone, password, role, state, district, village, language |
| HealthReport | userId, location fields, symptoms, waterSource, waterIssues, status, verifiedBy/At |
| WaterReport | location, waterSource, issueType, severity, reportedBy |
| RiskAssessment | location fields, symptomScore, growthScore, waterScore, clusterScore, riskScore, riskLevel, calculatedAt |
| Alert | title, message, riskLevel, location fields, targetAudience, createdBy, approvedBy, status, timestamps |
| AwarenessContent | title, description, category, language, source, image |

---

## 10. API Surface

```
/api/auth
/api/reports
/api/water-reports
/api/risk
/api/alerts
/api/awareness
/api/health-worker
/api/admin
```
Controllers stay thin; business logic lives in `server/services/`.

---

## 11. Demo Scenario (Acceptance Test)

1. Community member logs in and submits a report from a fictional village
2. Additional seeded reports pile in from the same area
3. System detects an unusual increase; risk score → HIGH
4. Health Worker dashboard gets a real-time notification
5. Health Worker opens and verifies the reports
6. A potential alert is generated
7. National Admin sees and approves the alert
8. Community dashboard receives the alert in real time
9. Risk map updates
10. Analytics update

This flow must work reliably end-to-end and is the primary demo/acceptance
criterion.

---

## 12. Demo Accounts (seed data)

- `community@smarthealthne.demo`
- `worker@smarthealthne.demo`
- `admin@smarthealthne.demo`

Documented demo password, local dev only, clearly labeled as demo accounts.
Seed data: 50+ health reports, 20+ water reports, multiple villages/districts,
varied risk levels, historical dates — all fictional/synthetic.

---

## 13. Success Criteria

See the full acceptance checklist in `CLAUDE.md` §"Definition of Done." At a
minimum: RBAC enforced end-to-end, risk engine produces auditable scores, full
alert workflow from detection → verification → approval → broadcast works live,
map/analytics reflect real DB data (no hard-coded stats), offline report queue
does not lose data, and the Demo Scenario in §11 passes without manual
intervention.

## 14. Risks & Open Questions

- **Risk formula validity** — weights are prototype defaults, not clinically
  validated; must be clearly labeled as such throughout UI and docs
- **False positives at low report volume** — cluster/growth scores need safe
  fallback behavior when historical data is sparse
- **Geo-privacy** — public map views must not expose individually identifiable
  health information
- **Language coverage** — only 4 languages at launch; translation quality for
  Assamese/Bengali content should be reviewed by a native speaker before demo
