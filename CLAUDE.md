# CLAUDE.md — SmartHealthNE 2.0 Build Specification

This file is the authoritative instruction set for any AI coding agent (Claude Code or otherwise)
implementing SmartHealthNE 2.0. It complements `PRD.md` — read that first for *what* to build; this
file defines *how* to build it, and the non-negotiable rules that must never be violated regardless
of what a later prompt asks for.

---

## 1. Project Context

SmartHealthNE 2.0 is a community health surveillance and early-warning platform for rural
Northeast India, focused on water-related illness. It is **not** a diagnostic tool, **not** a
hospital-management system, and **not** a system that gives personalized medical advice. It ingests
community symptom/water reports (app, offline, voice, and a mock SMS/IVR channel), computes an
explainable, auditable public-health risk score, forecasts near-term escalation with a transparent
statistical model, incorporates water-source and environmental (rainfall/flood) intelligence and a
community vulnerability score, recommends response actions and resource assignments, and — only
after Health Worker verification and National Admin approval — broadcasts a location-aware,
multilingual alert to the affected community in real time. Every step is audited.

Full functional detail lives in `PRD.md`. This document governs implementation behavior.

---

## 2. Core Principles (Non-Negotiable)

1. **No medical diagnosis.** Never generate, label, or imply an individual disease diagnosis or
   personalized treatment/medication advice, anywhere in the codebase — UI copy, API responses,
   seed data, comments, or AI-generated text.
2. **Human-in-the-loop.** No code path may set an `Alert` to `BROADCAST` without a recorded
   Health Worker verification followed by a recorded National Admin approval. This must be enforced
   in the service layer, not just the UI.
3. **Explainability.** Every `RiskAssessment` and `Prediction` must have a linked, deterministic
   `RiskExplanation` whose components sum (within rounding) to the total score. Never emit a bare
   score with no explanation available.
4. **Privacy.** Public/community/map/analytics endpoints return aggregates or role-appropriate
   detail only — never individually identifiable health data to an unauthorized role. Follow the
   data-visibility matrix in PRD.md §33 exactly.
5. **Auditability.** Every sensitive action (verify, reject, approve, broadcast, assign resource,
   change configuration) must call `auditService.record(...)`. Audit records are never updated or
   deleted through normal application code paths.
6. **Accessibility.** Community-facing UI must remain simple: large tap targets, minimal text,
   local language, works with poor connectivity, no technical jargon (no "risk score", "growth
   score", etc. shown to `COMMUNITY_MEMBER` role).
7. **Offline-first.** Community reporting must work fully offline and sync idempotently later; no
   report may be silently lost.
8. **Honesty about prototype status.** Any simulated/mocked capability (weather, SMS, IVR, speech-
   to-text, ML prediction) must be clearly labeled in both code comments/config (`isMock: true` /
   provider name) and user-facing UI ("prototype/experimental", "simulated data") — never presented
   as production-grade or medically validated.

---

## 3. Technology Stack

- **Frontend:** React (PWA), service worker for offline; i18n library for EN/HI/AS/BN
- **Backend:** Node.js + Express, modular monolith
- **Database:** MongoDB via Mongoose
- **Auth:** JWT (`userId`, `role` claims) + bcrypt password hashing
- **Real-time:** Socket.IO
- **Mapping:** Leaflet + OpenStreetMap tiles
- **Validation:** express-validator (or equivalent) at the route layer + Mongoose schema validation
  at the model layer (defense in depth)
- **Security middleware:** Helmet, CORS, express-rate-limit
- **Testing:** Jest (+ Supertest for API tests)

Do not introduce microservices, message queues, or a different database engine unless explicitly
instructed — the modular monolith is intentional for prototype scope.

---

## 4. Repository Structure

```
frontend/
  src/
    community/
    health-worker/
    admin/
    shared/
      components/
      i18n/
      offlineQueue/
    App.jsx
server/
  controllers/
  services/
    riskEngine.js
    predictionEngine.js
    environmentalRiskService.js
    vulnerabilityService.js
    waterSourceService.js
    explanationService.js
    responseRecommendationService.js
    resourceService.js
    simulationService.js
    timelineService.js
    dataQualityService.js
    auditService.js
    notificationService.js
    channels/
      IChannelAdapter.js
      smsChannelAdapter.js
      ivrChannelAdapter.js
    weather/
      IWeatherProvider.js
      mockWeatherProvider.js
    speech/
      ISpeechToTextProvider.js
      mockSpeechToTextProvider.js
  models/
  middleware/
    auth.js
    requireRole.js
    validate.js
    rateLimit.js
    errorHandler.js
  routes/
  socket/
  seed/
  utils/
shared/
  constants.js        (risk levels, symptom enums, status enums — single source of truth)
```

**Rule:** controllers only parse/validate request shape, call one or more services, and shape the
response. All business logic — scoring, thresholds, recommendations, audit writes — lives in
`server/services/`. No service imports from `controllers/`.

---

## 5. Coding Standards

- **Naming:** camelCase for variables/functions, PascalCase for Mongoose models/React components,
  UPPER_SNAKE_CASE for enums/constants (defined once in `shared/constants.js`, imported everywhere
  — never re-declare `HIGH`/`CRITICAL`/etc. as string literals in multiple files)
- **API conventions:** every response is `{ success: true, data }` or `{ success: false, message }`;
  never leak stack traces or raw Mongoose errors in production responses
- **Error handling:** centralized `errorHandler` middleware; services throw typed errors
  (`ValidationError`, `NotFoundError`, `ForbiddenError`) caught once at the top
- **Validation:** validate at the route boundary (shape/types) **and** rely on Mongoose schema
  validation (data integrity) — do not skip either layer
- **Database access:** only through models/service layer; no raw queries in controllers or React
  components
- **Service architecture:** each service exports pure-ish functions taking explicit inputs
  (location, time window, config) rather than reaching into global state, so they are unit-testable
  and reusable by the simulator (§20 in PRD.md) without side effects
- **State management (frontend):** React state/context per role area; no browser
  localStorage/sessionStorage for sensitive data — use secure httpOnly cookies or in-memory token
  handling per your auth setup
- **Type safety:** use JSDoc typedefs or TypeScript (if the project is set up with TS) for all
  service function signatures, especially risk/prediction inputs and outputs

---

## 6. Security Rules

- **Never trust frontend RBAC.** Every protected route must call `requireAuth` +
  `requireRole(...)` server-side. Frontend route guards are UX only.
- **Never expose secrets.** No API keys, DB URIs, or JWT secrets in source, comments, or committed
  `.env` files. Use environment variables, documented in `.env.example` with placeholder values.
- **Validate and sanitize all input**, including nested report fields, before persisting.
- **Protect admin/configuration routes** with `requireRole('NATIONAL_ADMIN')`; every config change
  must be written to `AuditLog` before/after values.
- **Avoid PII exposure**: map/public/analytics endpoints must aggregate; never return raw
  `HealthReport` documents to `COMMUNITY_MEMBER` beyond their own reports.
- **No stack traces in production** error responses; log full errors server-side only.
- **Rate-limit** auth and report-submission endpoints to mitigate abuse.

---

## 7. Risk Engine Rules

Implement in `server/services/riskEngine.js`:

```
currentRiskScore = symptomScore*0.40 + growthScore*0.25 + waterScore*0.20 + clusterScore*0.15
priorityScore     = currentRiskScore*riskWeight + environmentalRisk*environmentalWeight
                     + vulnerabilityScore*vulnerabilityWeight
```

- Weights and thresholds come from a `RiskConfig` document (defaults documented in PRD.md §12),
  never hard-coded numbers scattered through the codebase — one config lookup, cached and
  invalidated on admin update.
- `growthScore` must safely handle `previousWindowCount === 0` (return a fixed low baseline, never
  divide by zero).
- `clusterScore` must use a simple, cheap geographic bucket (village/district grouping, optional
  lat/long proximity within a bounded radius) — do not implement expensive geospatial clustering
  algorithms at prototype scale.
- Every call must persist a `RiskAssessment` with: all component scores, weights used, model
  version string (e.g., `risk-engine-v1`), timestamp, data window, and location — then call
  `explanationService` to generate and link a `RiskExplanation`.
- The risk engine function must be callable with an **injected input snapshot** (not just "read
  current DB state") so `simulationService` can call the identical logic without mutating
  production data.

---

## 8. Prediction Rules

Implement in `server/services/predictionEngine.js` behind an `IForecastModel` interface.

- Prototype model: deterministic weighted trend extrapolation over 7/14/30-day windows +
  environmental/water/vulnerability modifiers — not a black-box ML model.
- Always compute and store a **confidence score** based on data sufficiency (report count, history
  length, variance). Confidence must be genuinely derived, not a hard-coded placeholder.
- **Fallback rule:** if a location has fewer than the configured minimum reports/history (default:
  5 reports or 7 days), return `{ insufficientData: true, prediction: null, reason: <human
  readable> }` instead of fabricating a number.
- Store `modelVersion` and `inputsSnapshot` on every `Prediction` for reproducibility/audit.
- Never label prediction output as medically validated; UI copy and API doc comments must say
  "experimental/prototype forecasting model."
- Provide a prediction-vs-actual evaluation job/endpoint that compares past predictions to
  subsequently observed `RiskAssessment` levels for the same location/window — store the result on
  the `Prediction` record (`actualOutcome`, `evaluatedAgainstActualAt`), for transparency only.

---

## 9. Explainability Rules

- `explanationService.js` must derive its breakdown **from the same stored inputs** the risk engine
  used for that specific `RiskAssessment`/`Prediction` — never a separate/divergent recalculation
  that could disagree with the score it's explaining.
- Every explanation component has: `label` (plain language, e.g., "Increase in diarrhea reports"),
  `contribution` (signed number), and optionally `rawValue`/`weight` for admin drill-down.
  Component contributions must sum to the total score within rounding tolerance (±1).
- `GET /api/risk/:id/explanation` and `GET /api/predictions/:id/explanation` must return this
  structure; no risk/prediction detail view may render without it available (return a clear
  "explanation unavailable" state rather than omitting silently, if generation ever fails — and
  treat that as a bug to fix, not an acceptable end state).

---

## 10. Human Verification Rules

- `Alert.status` transitions are guarded by a state machine implemented in
  `server/services/alertService.js` (or equivalent): `PENDING_REVIEW → VERIFIED → APPROVED →
  BROADCAST`, or `REJECTED`/`EXPIRED` at any point before `BROADCAST`.
- Only a `HEALTH_WORKER` action can move `PENDING_REVIEW → VERIFIED`.
- Only a `NATIONAL_ADMIN` action can move `VERIFIED → APPROVED` and `APPROVED → BROADCAST`.
- No service — including the risk engine, prediction engine, or any scheduled job — may call the
  alert-broadcast function directly. Write an automated test asserting this (see §13).
- The same rule applies to predictive alerts: a HIGH/CRITICAL prediction can create a *potential*
  alert or notification, never an approved/broadcast one.

---

## 11. Offline Rules

- Each offline-queued submission gets a client-generated `localId` (UUID) used as an idempotency
  key on sync; the server must upsert-by-`localId` (or reject as duplicate) rather than blindly
  inserting, to prevent duplicate reports on retry.
- Sync states: `PENDING → SYNCING → SYNCED` or `FAILED` (with `retryCount` and `errorState`); the
  UI must reflect these states, never silently drop a failed item.
- On successful sync, store the returned `serverId` alongside the local record so the UI can
  reconcile.
- Voice reports queued offline follow the same `localId` idempotency rule once transcription is
  available (may transcribe on-device or on reconnect, per implementation choice — document which).

---

## 12. API Rules

- Base pattern: `{ success: true, data }` / `{ success: false, message }` for every endpoint,
  including error responses — no inconsistent shapes.
- RESTful resource naming matches PRD.md §40's API surface; do not invent alternate route prefixes.
- Every list endpoint supports pagination and location/date filtering where the underlying data
  volume could grow (reports, alerts, timeline events, audit log).
- Mutating endpoints affecting risk-sensitive state (verify, approve, assign, configure) must be
  behind `requireAuth` + `requireRole` and must write an audit record before returning success.

---

## 13. Database Rules

- Index every model on the fields used for its primary query patterns: location fields
  (state/district/village), `createdAt`, and `status`/`role` where applicable.
- All models include `createdAt`/`updatedAt` (Mongoose timestamps option).
- Define explicit relationships via ObjectId refs (e.g., `HealthReport.userId → User`,
  `RiskAssessment.locationId`, `ResponsePlan.riskAssessmentId → RiskAssessment`) — do not duplicate
  large nested documents where a reference is sufficient.
- Validation (required fields, enums for status/type fields) lives in the Mongoose schema, not only
  in route-level validators.
- Status/lifecycle fields use the exact enum values documented in PRD.md (e.g., `PENDING_REVIEW |
  VERIFIED | APPROVED | BROADCAST | REJECTED | EXPIRED` for alerts) — sourced from
  `shared/constants.js`.

---

## 14. Real-Time Rules

Implement all events listed in PRD.md §39 via Socket.IO, scoped to the right audience (e.g.,
`NEW_HEALTH_REPORT`/`RISK_LEVEL_UPDATED` to Health Worker/Admin rooms; `NEW_ALERT`/
`ALERT_BROADCAST` to the relevant community/location room). Do not add events without a concrete UI
consumer. Emit events from the service layer immediately after the triggering write succeeds (not
from controllers), so behavior is consistent regardless of entry point (API vs. seed script vs.
scheduled job).

---

## 15. Testing Strategy

- **Unit tests:** every service in `server/services/`, especially `riskEngine`
  (`growthScore` divide-by-zero case, threshold boundaries), `predictionEngine` (insufficient-data
  fallback), `explanationService` (components sum to total)
- **Integration tests:** report submission → risk recalculation → explanation generation, end to
  end within the service layer
- **API tests (Supertest):** each route's success and RBAC-denied paths (401/403 for wrong role)
- **RBAC tests:** explicit test matrix — every route × every role, asserting only intended roles
  succeed
- **Risk-engine tests:** known-input → known-output fixtures for each component and the combined
  score/level mapping
- **Prediction tests:** sufficient-data and insufficient-data fixtures, confidence calculation
- **Offline sync tests:** duplicate submission with same `localId` does not create two reports
- **Human-in-the-loop test:** assert no code path can set `Alert.status = 'BROADCAST'` without
  prior `VERIFIED` and `APPROVED` states recorded, with actor/timestamp present
- **End-to-end demo test:** scripted run of the full Demo Scenario in PRD.md §42 against the seeded
  dataset, asserting each stage's expected state transition

---

## 16. Seed Data

`server/seed/` must generate, deterministically and idempotently (safe to re-run):

- Demo users for all three roles (documented demo credentials, local dev only)
- 50+ health reports and 20+ water reports across multiple villages/districts/states, with varied
  timestamps to support trend/growth calculations
- Multiple `WaterSource` records with varied risk/inspection status, linked to relevant reports
- `EnvironmentalObservation` records including at least one rainfall spike and one flood event,
  time-correlated with a risk escalation in one village
- `VulnerabilityProfile` records with varied scores across villages
- Enough historical data (including ≥1 prior season, if seasonal prediction inputs are implemented)
  for at least one village to produce a non-fallback `Prediction`
- Pending-verification reports, at least one approved historical `Alert`, and at least one
  `ResponsePlan` with `ResourceAssignment`s in different states
- `TimelineEvent`s consistent with the above (generated as a side effect of seeding writes, not
  hand-authored separately, to avoid drift)
- One clean, reliable **golden-path scenario** matching PRD.md §42 exactly, isolated to its own
  village so the live demo doesn't collide with other seeded noise

All seed data must be clearly commented/labeled as fictional/synthetic.

---

## 17. Definition of Done

A feature is **not** done until all of the following are true:

- [ ] RBAC enforced server-side on every new/changed route, with a passing RBAC test
- [ ] Business logic lives in `server/services/`, not in controllers or React components
- [ ] Every risk/prediction output has a linked, deterministic explanation
- [ ] Every simulated/mocked capability is clearly labeled as prototype/mock in UI and code
- [ ] No alert reaches `BROADCAST` without a recorded verify+approve trail (test-covered)
- [ ] Every sensitive action writes an `AuditLog` entry
- [ ] No PII/individually-identifiable health data is exposed beyond the data-visibility matrix
      (PRD.md §33)
- [ ] Offline submissions are idempotent (`localId`) and never silently lost
- [ ] All dashboard/analytics numbers come from a live DB query — zero hard-coded stats
- [ ] Relevant unit/integration/API tests added and passing
- [ ] i18n strings added for all four launch languages (no hard-coded UI copy)
- [ ] Community-facing UI for the feature avoids technical risk-engine terminology
- [ ] Demo Scenario (PRD.md §42) still passes end-to-end after the change
