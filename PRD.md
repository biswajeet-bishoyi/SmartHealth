# PRD — SmartHealthNE 2.0
### AI-Assisted Community Health Surveillance & Early Warning Platform for Rural Northeast India
**Prepared for:** Smart India Hackathon (SIH) prototype
**Status:** Draft v2.0 — builds directly on v1.0
**Document owner:** Product/Engineering

> **Core framing, stated once and enforced everywhere in this document:**
> Risk scores, predictions, vulnerability scores, and explanations produced by this system are
> **public-health surveillance and decision-support indicators — not medical diagnoses, not
> personalized medical advice, and not clinically validated outputs.** All prototype weights,
> thresholds, and forecasting models are explicitly labeled as **prototype/experimental** until a
> public-health authority validates them.

---

## 1. Overview

SmartHealthNE 2.0 is a community health surveillance and early-warning platform purpose-built for
rural Northeast India, centered on **water-related illness detection and response coordination**.
It preserves the full architecture of v1.0 (reporting → risk engine → human verification →
approval → alert → analytics) and extends it into a layered decision-support system: it now
**predicts** likely escalation, **explains** why risk is rising, incorporates **environmental and
water-source intelligence**, scores **community vulnerability**, recommends **response actions**,
supports **resource allocation**, and offers a **what-if simulator** for administrators — all while
keeping a human in the loop before anything reaches the public.

**Explicit non-goals (unchanged from v1.0, restated):**
- Not a hospital/patient management system
- Not a diagnostic tool — no individual disease diagnosis, ever
- Not a treatment or prescription system
- Not a billing/payment/hospital-operations system
- Not a system that publicly exposes individually identifiable health data

---

## 2. Executive Summary

Water-borne disease outbreaks in rural NE India are frequently detected too late because there is
no structured channel connecting community symptom reports, water-quality signals, and
environmental conditions (rainfall/flood) to a verified, actionable early warning. SmartHealthNE
2.0 closes that loop end-to-end:

**Detect → Predict → Verify → Decide → Respond → Alert → Learn**

It ingests community reports (app, offline, voice, and an SMS/IVR-ready channel architecture),
fuses them with water-source and environmental signals, computes an auditable, explainable risk
score, forecasts near-term escalation with a transparent statistical model, surfaces a
vulnerability-weighted priority list and recommended response plan to health authorities, and only
then — after Health Worker verification and National Admin approval — broadcasts a location-aware,
multilingual alert to the community. Every step is logged for audit.

---

## 3. Problem Statement

Rural NE Indian communities lack early warning for water-borne disease outbreaks. Symptom clusters
(diarrhea, vomiting, dehydration) tied to contaminated water sources go unnoticed until an outbreak
is already underway because:

- There is no structured channel for community members to report symptoms/water issues, especially
  for low-literacy, low-connectivity users
- Health workers have no aggregated, real-time, explainable view of village-level risk
- There is no verification pipeline between raw reports and public alerts, so both false alarms and
  unverified panic are risks
- Current signals are not connected to environmental context (rainfall, flooding) or to *who is
  most vulnerable*, so responses are not well-prioritized
- There is no forward-looking (predictive) view — authorities only see risk after it has already
  materialized
- There is no structured way to turn "risk is high" into "here is what to do about it"

---

## 4. Product Vision

> **AI-assisted community health surveillance, environmental risk monitoring, outbreak prediction,
> and early-warning response coordination for rural Northeast India — built to support, not
> replace, human public-health decision-makers.**

The platform detects unusual health and environmental signals, predicts likely escalation, explains
*why* risk is increasing, routes every high-risk signal through human verification, supports
government decision-making with prioritization and simulation tools, coordinates response actions,
and communicates approved warnings back to affected communities — in their language, on low-end
devices, with or without connectivity.

Five pillars, all traceable to v1.0 features:

| Pillar | Core capability |
|---|---|
| **Community Intelligence** | Symptom + water reporting, voice reporting, SMS/IVR-ready, offline-first |
| **Environmental Intelligence** | Water-source monitoring, rainfall/flood signals, contamination risk |
| **AI/Public-Health Intelligence** | Current risk, trend, prediction, explainability, clustering, vulnerability |
| **Decision Support** | Response recommendations, resource allocation, what-if simulation, timeline |
| **Human Governance** | Health Worker verification, National Admin approval, RBAC, full audit trail |

---

## 5. Goals

1. Let community members report symptoms/water issues in under a minute on a low-end device with
   poor connectivity, including by voice
2. Automatically compute an auditable, explainable village-level risk score after every report
3. Forecast near-term risk escalation (3–7 day horizon) with a transparent, prototype-labeled
   statistical model and a stated confidence level
4. Fuse environmental (rainfall/flood) and water-source signals into risk and prediction
5. Score community vulnerability separately from risk, to support prioritization
6. Route HIGH/CRITICAL current or predicted risk through Health Worker verification and (when
   required) National Admin approval before any public alert
7. Recommend concrete response actions and support resource assignment/tracking
8. Give admins a what-if simulator that never touches production data
9. Deliver real-time, location-aware, multilingual alerts to affected communities once approved
10. Give admins a state/district/village analytics, map, and timeline view for resource planning
11. Maintain an immutable audit trail across the entire detect→alert pipeline

---

## 6. Non-Goals

- Individual disease diagnosis or personalized medical advice
- Clinical/EHR-grade patient records
- Treatment recommendations or prescriptions
- Payment, billing, or hospital-operations features
- Claiming medically validated predictive accuracy for the prototype forecasting model
- Building production-grade telecom (SMS/IVR) integration in the prototype (architecture only)
- Deep-learning/ML models where a transparent statistical model is sufficient and more explainable

---

## 7. Target Users & Personas

Same three roles as v1.0, with expanded needs driven by the new capabilities.

| Role | Description | Key Needs (v1.0) | New needs (2.0) |
|---|---|---|---|
| **COMMUNITY_MEMBER** | Rural resident, may have low digital literacy | Simple UI, large buttons, local language, offline | Voice reporting, SMS/IVR path, plain-language alerts with clear guidance |
| **HEALTH_WORKER** | Local/regional health staff | Review queue, verification, trends, real-time alerts | Predicted hotspots, outbreak timeline, recommended response actions, water-source risk view |
| **NATIONAL_ADMIN** | Public-health administrator | Analytics, map, alert approval, user management | Prediction analytics, vulnerability & resource dashboards, what-if simulator, configuration + audit log |

---

## 8. User Roles & RBAC

Unchanged core rule from v1.0, **non-negotiable**:

> RBAC is enforced **server-side** on every route. Frontend route guards are UX convenience only,
> never the security boundary.

Roles: `COMMUNITY_MEMBER`, `HEALTH_WORKER`, `NATIONAL_ADMIN`. A future `REGIONAL_ADMIN` (state/district
scoped) is reserved for Phase 2 (see §44 Roadmap) but not implemented in the prototype.

Middleware: `requireAuth`, `requireRole(role)`, plus a new `requireOwnershipOrRole()` helper for
config/audit endpoints restricted to National Admin.

---

## 9. Core User Journeys

### 9.1 Community reporting journey (preserved + extended)
Report by form → optional voice input → optional offline queue → sync → validation → storage.

### 9.2 Detection & prediction journey (new)
```
New report / water report / environmental event
   → Risk Engine recalculates current risk (symptom + growth + water + cluster
     + environmental + vulnerability-weighted priority)
   → Explanation Service generates a component breakdown
   → Prediction Service forecasts 3–7 day trajectory with confidence + fallback
   → If current HIGH/CRITICAL or predicted HIGH/CRITICAL → potential alert created
   → Health Worker notified in real time
```

### 9.3 Verification & response journey (extended)
```
Health Worker reviews report + explanation + prediction + vulnerability
   → Verify / Reject / Escalate
   → Response Recommendation Engine proposes an action plan
   → Admin views Resource Priority Dashboard, assigns resources
   → Admin reviews potential alert → Approve / Reject
   → Alert broadcast (Socket.IO) to targeted community
   → Timeline, map, analytics update live
   → Audit log records every step
```

### 9.4 Decision-support journey (new)
Admin opens What-if Simulator → adjusts hypothetical inputs (e.g., "+10 diarrhea reports",
"water source contaminated") → sees projected risk change using the real risk engine on a
sandboxed copy of inputs → no production data is modified.

---

## 10. Product Architecture

**Style:** modular monolith (Node.js/Express backend, React frontend), not microservices — this
matches v1.0's technology direction and is appropriate at prototype scale. Business logic lives
exclusively in `server/services/`; controllers stay thin; models stay data-only.

```
Client (React PWA)
   ├─ Community UI (mobile-first, offline-capable, voice-capable)
   ├─ Health Worker Dashboard (desktop/tablet/mobile)
   └─ National Admin Dashboard (desktop/tablet/mobile)
        │  REST (JSON) + Socket.IO (real-time)
        ▼
Express API (server/)
   ├─ routes/        → thin controllers, RBAC middleware
   ├─ services/       → risk engine, prediction, environmental, vulnerability,
   │                    explanation, response recommendation, resource allocation,
   │                    simulation, timeline, audit, data-quality, channel adapters
   ├─ models/         → Mongo/Mongoose schemas
   ├─ middleware/      → auth, RBAC, validation, rate limiting, error handling
   ├─ socket/          → Socket.IO event emitters/handlers
   └─ seed/            → synthetic demo data generator
        │
        ▼
MongoDB (primary store) — indexed on role/location/time
```

External integrations (weather, SMS, IVR, speech-to-text) are implemented as **abstraction/adapter
interfaces** with mock providers in the prototype, swappable for real providers later without
touching business logic.

---

## 11. Functional Requirements (Preserved from v1.0)

### 11.1 Authentication & Authorization
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- JWT (`userId`, `role`) + bcrypt password hashing
- Middleware: `requireAuth`, `requireRole(role)`
- No plaintext passwords, ever

### 11.2 User Model
`name, email, phone, password, role, state, district, village, language, createdAt, updatedAt`.
Indexed on role/location for query performance.

### 11.3 Health Reporting
- `POST /api/reports`
- Fields: `userId, state, district, village, latitude, longitude, symptoms, duration,
  affectedPeople, waterSource, waterIssues, description, status, createdAt, verifiedBy,
  verifiedAt, sourceChannel` *(new: tracks APP / VOICE / SMS / IVR / OFFLINE_SYNC)*
- Symptoms: `diarrhea, vomiting, fever, abdominal_pain, dehydration, other`
- Status lifecycle: `PENDING → VERIFIED / REJECTED`
- Reports describe symptoms/observations only — **never** a diagnosis label

### 11.4 Water Issue Reporting
- `location, village, district, waterSource, issueType, severity, description, reportedBy,
  createdAt, sourceChannel`
- Issue types: `dirty_water, bad_smell, flood_contamination, broken_water_source,
  suspected_contamination, other`
- Feeds the risk engine's water score and, new in 2.0, the persistent **Water Source Profile**

### 11.5 Alert System, Real-Time Layer, Awareness Module, Map & Analytics, Multilingual, PWA/Offline
All preserved from v1.0 §7.5–7.13 and expanded in §12–§23 below.

---

## 12. Risk Engine (Extended)

Location: `server/services/riskEngine.js` (extended, not replaced).

**Current-risk formula (unchanged core, v1.0):**
```
currentRiskScore = symptomScore * 0.40
                  + growthScore  * 0.25
                  + waterScore   * 0.20
                  + clusterScore * 0.15
```

**New decision layer (2.0), applied after current risk is computed:**
```
priorityScore = currentRiskScore   * riskWeight
              + environmentalRisk  * environmentalWeight
              + vulnerabilityScore * vulnerabilityWeight
```
All weights are stored in a `RiskConfig` document, editable only by National Admin, and every
change is audited. Defaults: `riskWeight=0.6, environmentalWeight=0.2, vulnerabilityWeight=0.2`.
These are **prototype defaults, not medically validated**, and are labeled as such in the UI.

All components normalized 0–100. Thresholds (unchanged):

| Score | Level |
|---|---|
| 0–30 | LOW |
| 31–60 | MEDIUM |
| 61–80 | HIGH |
| 81–100 | CRITICAL |

**Component logic (preserved):**
- **Symptom score** — concentration of recent reports, weighted higher for diarrhea/vomiting/
  dehydration, configurable weights
- **Growth score** — `(current 7-day − previous 7-day) / previous * 100`, safe handling when
  previous = 0 (fallback to a fixed low baseline score, never divide-by-zero crash)
- **Water score** — driven by dirty/contaminated/flood-affected water reports, location-specific
- **Cluster score** — geographic concentration by village/district (and optional lat/long) within
  a configurable time window; deliberately avoids expensive geo algorithms at prototype scale

Every `RiskAssessment` stores: overall score, level, **all component scores**, **weight
contribution per component**, timestamp, data window used, location, **model/version**, and a
link to its generated `RiskExplanation` — for full auditability.

---

## 13. Predictive Intelligence

**Purpose:** estimate whether a location is likely to see increasing risk in a configurable
near-term window (default 3–7 days), so authorities can act *before* an outbreak peaks.

**Explicit framing shown wherever a prediction appears:**
> Experimental / public-health forecasting model. Not a medically validated diagnostic or
> epidemiological prediction system.

**Inputs (Tier 1 statistical, prototype):**
- Recent (7-day) symptom report volume and trend
- 14-day and 30-day historical trend
- Rate-of-increase (delta between consecutive windows)
- Water contamination report volume
- Water-source risk (from Water Source Intelligence, §15)
- Environmental risk (rainfall/flood signal, §14)
- Geographic clustering strength
- Historical seasonal pattern for that village (if ≥1 prior season of data exists)
- Village vulnerability score (used as a modifier, not a driver)
- Report density (reports per estimated population)

**Model approach (Level 1–2 of the AI/ML layering, §37):** deterministic weighted trend
extrapolation + simple linear/exponential smoothing over the above signals, **not** a black-box
ML model. Output includes an explicit **confidence score** derived from data sufficiency (number
of historical data points, recency, variance).

**Output shown to Health Worker / Admin:**
```
Current Risk:     HIGH — 67
Predicted Risk:   CRITICAL — 82
Prediction Window: 3–7 days
Confidence:       78%
Model:            statistical-trend-v1 (prototype)
```

**Safe fallback:** when historical data is insufficient (e.g., <5 reports or <7 days of history
for a village), the system returns `insufficientData: true`, a null/low-confidence prediction, and
a human-readable reason (e.g., "Not enough historical data for this village yet") instead of a
fabricated number.

**Required components:**
- Prediction service (`server/services/predictionEngine.js`)
- Prediction API (`/api/predictions`)
- `Prediction` data model: location, predictedScore, predictedLevel, currentScore, currentLevel,
  windowDays, confidence, modelVersion, inputsSnapshot, generatedAt, evaluatedAgainstActualAt,
  actualOutcome (nullable, filled in retrospectively)
- Historical prediction tracking + **prediction-vs-actual evaluation** endpoint/report so admins
  can see how well past predictions matched reality (transparency, not a claim of accuracy)
- Explainability: predictions link to the same explanation structure as current risk (§16)

**Architecture note:** the prediction service is built behind an interface
(`IForecastModel.predict(inputs)`) so a real ML model can later be swapped in (Level 4, §37)
without changing callers.

---

## 14. Environmental Intelligence

**Causal chain modeled by the system:**
```
Rainfall → Flood/environmental risk → Water-source contamination risk
   → Symptom increase → Community risk → Early warning
```

**Signals supported:**
- Rainfall (mm, intensity, event flag for "heavy rainfall")
- Flood risk / flood occurrence (boolean/severity)
- Environmental contamination risk (derived)
- Seasonal risk indicator (e.g., monsoon-season multiplier)

**Prototype implementation:**
- `EnvironmentalObservation` model: location, state/district/village, observationType
  (`RAINFALL`, `FLOOD`, `CONTAMINATION_RISK`), value/severity, source (`MOCK_SEED`,
  `MANUAL_ENTRY`, `EXTERNAL_API` — future), observedAt, createdAt
- Weather **ingestion abstraction** (`IWeatherProvider.getObservations(location, range)`) with a
  `MockWeatherProvider` implementation seeded with realistic rainfall/flood events for demo
  villages; no specific third-party weather API is hard-coded, so a real provider (e.g., IMD data)
  can be plugged in later behind the same interface
- `environmentalRiskService.js` converts raw observations into a normalized 0–100
  `environmentalRisk` score per location/time-window, feeding both the risk engine (§12) and the
  prediction engine (§13)
- Environmental events appear on the Outbreak Timeline (§20) and the map's Environmental/Flood
  layer (§21)

---

## 15. Water Source Intelligence

Expands water *reports* (transactional) into persistent **Water Source Profiles** (an entity with
history), addressing "which water sources are becoming risk hotspots?"

**`WaterSource` model:**
`name, type (tube_well | hand_pump | river | pond | piped_supply | other), village, district,
state, latitude, longitude, connectedPopulation, status (ACTIVE | INVESTIGATION_REQUIRED |
CLOSED), currentRiskScore, currentRiskLevel, historicalRiskSnapshots[], lastInspectionAt,
lastInspectionResult, createdAt, updatedAt`

**Derived/aggregated fields (computed, not stored redundantly where avoidable):**
- Total reports linked to this source
- Contamination-specific report count
- Trend (reports over time)

Example presentation (Health Worker / Admin water source detail view):
```
Community Well #2 — XYZ Village
Type: Tube Well
Current Risk: HIGH
Reports: 12   Contamination Reports: 5
Connected Population: 430
Last Inspection: 4 days ago
Status: Investigation Required
```

**Capabilities:**
- `waterSourceService.js` links incoming `WaterReport`s to a `WaterSource` (by location match or
  explicit selection at report time)
- Recomputes source-level risk whenever a new linked report arrives
- Surfaces a ranked "risk hotspot" list to Health Worker/Admin
- Adds a dedicated **Water Source layer** to the map
- Inspections and test results can be logged by Health Workers (`lastInspectionAt`,
  `lastInspectionResult`, free-text + status change), fully audited

---

## 16. Vulnerability Engine (Community Vulnerability Score)

**Distinguishes two separate questions, never conflated:**

| Concept | Question it answers |
|---|---|
| **Risk** | What is happening or likely to happen? |
| **Vulnerability** | How severely could this community be affected if it does happen? |

**`VulnerabilityProfile` model (one per village, admin-configurable factors):**
`village, district, state, population, householdCount, waterSourceDependencyScore,
priorIncidentCount, floodSusceptibility, sanitationIndicator, distanceToHealthFacilityKm,
cleanWaterAccessScore, environmentalExposureScore, vulnerabilityScore, componentBreakdown,
lastUpdatedBy, updatedAt`

**Score composition:** weighted sum of normalized factors (weights configurable by National Admin,
same audit rules as risk weights). Every score exposes a component breakdown identical in spirit
to risk explainability (§17), so an admin can see *why* a village is scored highly vulnerable, not
just the number.

**Usage:** vulnerability is a modifier/prioritizer, not a direct diagnosis input — it feeds the
`priorityScore` in §12 and the Resource Priority Dashboard (§19), and gets its own **Vulnerability
map layer** (§21).

---

## 17. Explainable AI / Risk Explanation

**Hard rule:** the system never shows a bare number. Every `RiskAssessment` and `Prediction` has a
linked, deterministic, traceable `RiskExplanation`.

Example:
```
Why is this location HIGH risk?
  +22  Increase in diarrhea reports
  +18  Increase in vomiting reports
  +15  Water contamination reports
  +11  Geographic clustering
  +08  Recent rainfall
  ─────
  74   HIGH
```

**Components:**
- `explanationService.js` — computes the explanation **from the same stored data** used by the
  risk engine at calculation time (no separate/divergent logic — the explanation must always sum
  to the score it explains, within rounding)
- `RiskExplanation` model: assessmentId (or predictionId), locationId, components[] (label,
  contribution, rawValue, weight), totalScore, level, generatedAt
- Explainable Risk API: `GET /api/risk/:id/explanation`, `GET /api/predictions/:id/explanation`
- UI: drill-down component breakdown on Health Worker and Admin dashboards, expressed in plain
  language, never raw variable names, for non-technical reviewers

---

## 18. Response Recommendation Engine

When a location becomes HIGH or CRITICAL (current or predicted), the system generates a
**Recommended Response Plan** — explicitly public-health *operational* recommendations, never
personalized medical advice.

Example:
```
Village: XYZ    Risk: CRITICAL
Recommended actions:
  1. Deploy 2 health workers
  2. Send water-testing team
  3. Inspect high-risk water sources
  4. Distribute public-health supplies (ORS, chlorination tablets)
  5. Issue community warning
  6. Prioritize nearest healthcare facility
  7. Increase monitoring frequency
```

**Components:**
- `responseRecommendationService.js` — selects from a library of **action templates** keyed by
  risk level, water-source status, and vulnerability, rather than free-form generation, so
  recommendations are consistent and auditable
- `ResponsePlan` model: locationId, riskAssessmentId, riskLevel, actions[] (template ref,
  description, priority, resourceRequirement, assignmentStatus), createdAt, createdBy
  (system-generated, reviewed by Health Worker), status (`DRAFT → REVIEWED → IN_PROGRESS →
  COMPLETED`)
- Health Worker can edit/approve the plan before it becomes actionable; nothing auto-executes

---

## 19. Resource Allocation

**Resource Priority Dashboard** — turns risk + vulnerability + response plans into a prioritized,
actionable list for National Admin.

Example:
| Location | Risk | Vulnerability | Priority | Recommended Resources |
|---|---|---|---|---|
| Village A | Critical | High | P1 | 2 workers + water team |
| Village B | High | Medium | P2 | 1 worker |
| Village C | Medium | Low | P3 | Monitoring |

**Resource types:** health workers, water-testing teams, inspection teams, awareness teams,
public-health supplies, emergency response teams.

**Components:**
- `Resource` model: type, name/identifier, capacity, currentAssignmentStatus, homeLocation
- `ResourceAssignment` model: resourceId, locationId, responsePlanId, assignedBy, assignedAt,
  status (`ASSIGNED → IN_TRANSIT → ON_SITE → COMPLETED`), completedAt, notes
- Admin actions: view recommendations, assign, reassign, track status, mark completed, view full
  response history per location — every action audited

---

## 20. What-If Simulator

A decision-support sandbox for administrators.

Examples:
```
Current Risk: 58 — MEDIUM
Scenario: +10 diarrhea cases
Projected Risk: 74 — HIGH
```
```
Current Risk: 61 — HIGH
Scenario: Water contamination confirmed
Projected Risk: 83 — CRITICAL
```

**Rules (non-negotiable):**
- Uses the **exact same risk engine code path** as production, called with a modified, in-memory
  copy of inputs
- **Never writes to production collections** — runs against a cloned/sandboxed input snapshot
- Every simulation result is clearly labeled `SIMULATION — not a stored assessment`
- Displays before/after scores and an explanation of what changed (reuses §17's explanation
  structure)
- Supports multiple simultaneous hypothetical variables (e.g., +N reports AND water contamination)
- `Simulation` model stores the *request and result* for audit/reference (not as a RiskAssessment),
  with `runBy`, `runAt`, `inputs`, `baselineScore`, `projectedScore`, `explanation`

---

## 21. Outbreak Timeline

A chronological visualization of an emerging event, combining every signal type into one view.

Example:
```
Aug 12 — 2 reports
Aug 14 — 7 reports
Aug 16 — 18 reports
Aug 17 — Water contamination reported
Aug 18 — Risk → HIGH
Aug 18 — Health Worker verification
Aug 18 — Admin approval
Aug 18 — Community alert
```

**Components:**
- `TimelineEvent` / `OutbreakEvent` model: locationId, eventType (`REPORT`, `WATER_EVENT`,
  `ENVIRONMENTAL_EVENT`, `RISK_CHANGE`, `VERIFICATION`, `ALERT`, `RESPONSE_ACTION`), payload
  summary, occurredAt, relatedEntityId
- Populated automatically as a side effect of existing write paths (report creation, verification,
  alert approval, response updates) — not a separately maintained log prone to drift
- Primary UI element on both Health Worker and Admin dashboards for a selected location

---

## 22. Location-Aware Community Alerts

Extends the v1.0 Alert model/workflow with explicit geo-targeting and richer presentation.

**Alert model (extended):** `title, message, riskLevel, state, district, village,
targetAudience, geoRadius (optional), createdBy, approvedBy, status, createdAt, approvedAt,
expiresAt, language, acknowledgedBy[]` *(new: read/acknowledgement tracking where appropriate)*

Status lifecycle (unchanged): `PENDING_REVIEW → VERIFIED → APPROVED → BROADCAST` (or `REJECTED` /
`EXPIRED`). Target audience: `COMMUNITY, HEALTH_WORKER, REGIONAL, NATIONAL`.

Example community-facing alert:
```
⚠️ WATER SAFETY ALERT — YOUR VILLAGE
Avoid using Community Well #2 until further notice.
Follow approved water-safety guidance.
Issued: 18 Aug, 4:30 PM
Source: Verified public-health alert
```

**Rules:** never individualized medical treatment advice; always shows severity, location, issue,
effective time, expiry, source/authority, preventive guidance, and language. **No automated
pathway bypasses Health Worker verification + Admin approval before broadcast** (§26).

---

## 23. Voice, SMS & IVR Channels

### 23.1 Voice reporting (Tier 3, prototype-priority)
Flow: user taps "🎙 Report by Voice" → speaks naturally (e.g., *"Three people in my house have
vomiting and diarrhea since yesterday"*) → system extracts structured fields → **user confirms
before submission** (no silent auto-submit).

Extracted example:
```
Symptoms: Vomiting, Diarrhea
Affected people: 3
Duration: 1 day
Location: current/selected village
```

**Architecture:**
- Voice input UI component with record/playback
- `ISpeechToTextProvider` abstraction; prototype uses a `MockSpeechToTextProvider` (or a
  browser-native Web Speech API where available) — no hard dependency on a specific paid API
- `voiceExtractionService.js` — structured extraction (rule/keyword-based in the prototype, with
  an interface that supports an NLP model later) from transcript → report fields
- Confirmation screen before write; graceful fallback to the manual form on low confidence or
  extraction failure
- Multilingual: supports the same 4 launch languages where feasible; UI copy in i18n either way

### 23.2 SMS & IVR (Tier 3, architecture-first)
Designed so non-app users can eventually report and receive alerts, without requiring a real
telecom integration for the local prototype.

SMS example: `REPORT DIARRHEA 3 VILLAGE_X`
IVR example: Press 1 (symptoms) / Press 2 (water problem) / Press 3 (hear alerts) / Press 4
(language).

**Architecture:**
- `IChannelAdapter` interface (`receive(rawPayload) → normalizedReport`) with `SmsChannelAdapter`
  and `IvrChannelAdapter` mock implementations that accept simulated inbound payloads via an
  internal `/api/channels/mock-inbound` endpoint (admin/dev only, not public)
- Every channel-originated report is normalized into the **same** `HealthReport`/`WaterReport`
  shape and passes through the **same** validation and risk pipeline as app-originated reports
- `sourceChannel` field on reports records provenance (`APP`, `VOICE`, `SMS`, `IVR`,
  `OFFLINE_SYNC`) for analytics and audit
- Real telecom provider integration is explicitly **Phase 2 / Future** (§44), not required for SIH
  demo

---

## 24. Advanced Map

Expands the existing Leaflet + OpenStreetMap view (Northeast India overview, state/district/
village markers) with selectable layers:

- **Risk layer** (LOW/MEDIUM/HIGH/CRITICAL)
- **Predicted risk layer**
- **Vulnerability layer**
- **Water source layer** (risk-colored, hotspot flags)
- **Environmental/flood layer**
- **Health report density layer**
- **Alert layer** (active/expired)

Filterable by state, district, village, date range, risk, predicted risk, water risk,
environmental risk. Clicking a location shows a concise public-health summary card — aggregated
counts and scores only, **no individually identifiable health information**, matching the
existing PII rule from v1.0.

---

## 25. Advanced Analytics

Dashboards, all sourced from **real database data — no hard-coded statistics**:

- **Current situation:** active high-risk locations, critical locations, new reports today, water
  contamination events, active alerts
- **Trends:** daily/weekly/monthly reports, symptom trends, water issue trends, risk trends,
  environmental trends
- **Prediction:** predicted high-risk locations, forecast horizon, prediction confidence,
  prediction-vs-actual accuracy history (transparency view, not an accuracy claim)
- **Response:** alerts issued, alerts pending approval, resources deployed, response completion
  rate, average verification time, average alert-approval time
- **Geographic:** state / district / village rollups
- **Water:** highest-risk water sources, contamination trends, inspection status

---

## 26. Human-in-the-Loop AI Governance

The system's central architectural guarantee:

```
AI / Risk Engine → Potential Risk → Health Worker → Verification
   → National Admin → Approval → Community Alert
```

For predictive alerts specifically:
```
Prediction → Human Review → Decision
```

**Rule, enforced in code, not just documentation:** no service is permitted to set an `Alert`
status directly to `BROADCAST`. Only an explicit Health-Worker-verification step followed by an
explicit National-Admin-approval action can transition an alert to `APPROVED`/`BROADCAST`. This is
tested (§41 Acceptance Criteria, §"Testing Strategy" in CLAUDE.md).

---

## 27. Community Experience (UX)

Preserved and reinforced from v1.0: large buttons, minimal text, local language, offline support,
low bandwidth, simple icons, clear status, no technical terminology. Complex risk-engine internals
(scores, weights, model versions) are **never** exposed to community users.

Main actions:
- Report Health Issue
- Report Water Problem
- Report by Voice
- View Alerts
- Safety & Awareness
- My Pending Reports (including offline "Pending Sync" status)

---

## 28. Health Worker Dashboard

- **Priority Queue:** critical/high-risk/new reports, water contamination, predicted hotspots
- **Village Overview:** current risk, predicted risk, vulnerability, trend, active alerts,
  water-source risks
- **Verification:** review, verify, reject, notes, escalate
- **Timeline:** outbreak timeline for the selected village
- **Response:** recommended actions, assigned tasks, completion status

---

## 29. National Admin Dashboard

- **Northeast Overview:** state/district risk, predicted hotspots, vulnerability, environmental
  conditions
- **Map:** all layers from §24
- **Alert Center:** pending, verified, approval queue, broadcast history
- **Resource Planning:** priority areas, recommendations, assignments (§19)
- **Analytics:** full historical analysis (§25)
- **What-if Simulator:** §20
- **Configuration:** risk weights, thresholds, time windows, symptom weights, environmental
  weights, vulnerability factors, alert rules — **every change audited**

---

## 30. Awareness Module (Preserved)

`/community/awareness` — categories: Safe Water, Hygiene, Food Safety, Water-Borne Disease
Awareness, Emergency Warning Signs. Fields: `title, description, category, language, source,
image, createdAt`. Clearly separated from personalized medical advice.

---

## 31. Multilingual Support & Accessibility

Launch languages preserved: English, Hindi, Assamese, Bengali; i18n structured for easy addition of
further NE Indian languages, no hard-coded UI strings. Added in 2.0:
- Voice-friendly interaction (§23.1)
- Screen-reader compatibility, high contrast, large tap targets, keyboard navigation
- Simple, low-literacy-appropriate error messages

---

## 32. Offline-First / PWA Architecture

Preserved and extended. Installable PWA; offline queue supports health reports, water reports, and
(where feasible) voice reports. Each offline submission tracks: `localId, createdAt, syncState
(PENDING | SYNCING | SYNCED | FAILED), retryCount, serverId (post-sync), errorState`. Idempotency
key (`localId`) prevents duplicate submissions across retries. UI always shows "Pending Sync" or
"Successfully Synced" — no report silently disappears.

---

## 33. Security & Privacy

All v1.0 requirements preserved: Helmet, CORS, express-rate-limit, input validation, Mongo schema
validation, no hard-coded secrets, sanitized input, centralized error handler with no stack-trace
leakage in production.

**Added in 2.0:**
- Strict RBAC on every new route (predictions, environment, vulnerability, response, resources,
  simulations, timeline, audit, analytics, channels)
- Admin action logging for every configuration change and approval action
- PII minimization on public/map/analytics endpoints — aggregate counts and scores only
- Location privacy: no address-level or individually-identifiable data on public screens
- Encryption at rest for sensitive fields where applicable (deployment-dependent)

**Explicit data-visibility matrix:**

| Data | Community | Health Worker | National Admin | Public (unauthenticated) |
|---|---|---|---|---|
| Own reports | Full | — | — | — |
| Village-level aggregate risk | Level only | Full + explanation | Full + explanation | Level only, aggregated |
| Individual report detail (who/what/where precise) | Own only | Yes (assigned region) | Yes | No |
| Water source profiles | Summary | Full | Full | Summary |
| Predictions | No | Yes | Yes | No |
| Vulnerability scores | No | Yes | Yes | No |
| Resource assignments | No | View | Full | No |
| Audit log | No | No | Yes | No |
| Approved alerts | Yes (own location) | Yes | Yes | Yes (public alert feed only) |

---

## 34. Audit & Traceability

Because this is a public-health/government-facing system, the audit trail is a first-class
feature, not an afterthought.

**Tracked:** report submission (who/when), verification (who/when/decision), alert creation,
approval, rejection, broadcast (who/when), resource assignment (who/when), configuration changes
(who/when/old value/new value), risk-calculation version used, prediction model/version used, and
the underlying data snapshot used for each calculation.

**`AuditLog` model:** `actorId, actorRole, action, entityType, entityId, previousValue, newValue,
metadata, occurredAt`. Written by a dedicated `auditService.js` invoked from every sensitive
service call — never edited or deleted through normal application workflows (append-only at the
application layer).

Admin Audit Log UI: filterable by actor, action type, entity, and date range.

---

## 35. Data Quality / Signal Confidence

Prevents the dashboard from presenting every score as equally reliable.

**Detected issues:** duplicate reports, suspicious repeated submissions, missing location, very
old data, sparse historical data, inconsistent values.

**Output shown alongside a risk score:**
```
Risk: HIGH — 72
Signal confidence: Medium
Reason: Only 6 reports available and historical baseline is limited.
```

**Components:**
- `dataQualityService.js` — computes a `DataQualityAssessment` per risk calculation
- `DataQualityAssessment` model: locationId, riskAssessmentId, confidenceLevel (`LOW | MEDIUM |
  HIGH`), reasons[], reportCount, historicalDataPoints, flaggedDuplicates, generatedAt
- Surfaced in UI next to every risk/prediction score, not buried

---

## 36. Data Model Summary (Full — Preserved + New)

| Model | Key Fields | Status |
|---|---|---|
| User | name, email, phone, password, role, state, district, village, language | Preserved |
| HealthReport | userId, location fields, symptoms, waterSource, waterIssues, status, verifiedBy/At, sourceChannel | Preserved + extended |
| WaterReport | location, waterSource, issueType, severity, reportedBy, sourceChannel | Preserved + extended |
| WaterSource | name, type, village/district/state, connectedPopulation, currentRisk, status, lastInspection | New |
| RiskAssessment | location fields, symptomScore, growthScore, waterScore, clusterScore, environmentalRisk, vulnerabilityScore, priorityScore, riskLevel, weightsUsed, modelVersion, calculatedAt | Preserved + extended |
| RiskExplanation | assessmentId/predictionId, components[], totalScore, level, generatedAt | New |
| Prediction | locationId, currentScore/Level, predictedScore/Level, windowDays, confidence, modelVersion, inputsSnapshot, generatedAt, actualOutcome | New |
| EnvironmentalObservation | location, observationType, value/severity, source, observedAt | New |
| VulnerabilityProfile | village, population, factor fields, vulnerabilityScore, componentBreakdown | New |
| Alert | title, message, riskLevel, location fields, geoRadius, targetAudience, createdBy, approvedBy, status, language, acknowledgedBy[] | Preserved + extended |
| AwarenessContent | title, description, category, language, source, image | Preserved |
| ResponsePlan | locationId, riskAssessmentId, actions[], status | New |
| Resource | type, name, capacity, status, homeLocation | New |
| ResourceAssignment | resourceId, locationId, responsePlanId, status, timestamps | New |
| OutbreakEvent / TimelineEvent | locationId, eventType, payload, occurredAt | New |
| Simulation | runBy, runAt, inputs, baselineScore, projectedScore, explanation | New |
| AuditLog | actorId, actorRole, action, entityType, entityId, previous/newValue, occurredAt | New |
| DataQualityAssessment | locationId, riskAssessmentId, confidenceLevel, reasons[] | New |
| Notification | userId, type, payload, read, createdAt | New (supports real-time UI) |
| VoiceReport / ChannelMetadata | rawTranscript/rawPayload, extractedFields, confidence, channel | New |

All models: appropriate indexes on role/location/time; `createdAt`/`updatedAt` timestamps;
Mongoose schema validation; explicit lifecycle/status enums where applicable.

---

## 37. AI/ML Architecture

Layered, deliberately not forcing deep learning where it isn't justified:

| Level | Capability | Prototype status |
|---|---|---|
| **Level 1** | Rule/configuration-based risk engine (§12) | Implemented |
| **Level 2** | Statistical trend analysis (growth score, historical trend) | Implemented |
| **Level 3** | Predictive forecasting (§13) — statistical extrapolation + confidence | Implemented |
| **Level 4** | Optional ML model (e.g., gradient-boosted classifier on richer feature set) | Documented, not implemented in prototype |

**If/when Level 4 is pursued**, it must specify: inputs/features, output, training data
requirements, evaluation methodology, model versioning, fallback to Level 1–3 on low confidence or
missing features, explainability approach (e.g., feature-importance surfaced the same way as §17),
and known data limitations. **No accuracy claim is made without evidence** — the prediction
evaluation history (§13) is the only accuracy signal shown, and it is always presented as
prototype/experimental.

---

## 38. Technical Architecture

| Layer | Choice | Notes |
|---|---|---|
| Frontend | React (PWA) | Mobile-first; i18n; offline service worker |
| Backend | Node.js + Express | Modular monolith; thin controllers, logic in `server/services/` |
| Database | MongoDB (Mongoose) | Indexed on role/location/time |
| Auth | JWT + bcrypt | RBAC middleware server-side |
| Real-time | Socket.IO | Event list in §39 |
| Mapping | Leaflet + OpenStreetMap | Layered (§24) |
| Offline | Service worker + local queue (IndexedDB or similar) | Idempotent sync (§32) |
| AI/Risk services | In-process Node services (`server/services/`) | Statistical, explainable, versioned |
| External integrations | Adapter interfaces (`IWeatherProvider`, `ISpeechToTextProvider`, `IChannelAdapter`) with mock implementations | Swappable for real providers post-prototype |
| Deployment | Single deployable Node app + MongoDB instance | No microservices at prototype scale |

---

## 39. Real-Time Events (Socket.IO)

Preserved: `NEW_HEALTH_REPORT, RISK_LEVEL_UPDATED, NEW_ALERT, ALERT_APPROVED, ALERT_BROADCAST`

Added:
`NEW_WATER_REPORT, PREDICTION_UPDATED, ENVIRONMENTAL_RISK_UPDATED, NEW_HIGH_RISK_LOCATION,
RESOURCE_ASSIGNED, RESPONSE_UPDATED`

Health Worker and Admin dashboards, and the Community alert view, update live without page
refresh. Events kept intentionally minimal — no event added without a UI consumer.

---

## 40. API Surface

Preserved base + logical extension. Controllers thin; business logic in `server/services/`.

```
/api/auth
/api/reports
/api/water-reports
/api/water-sources        (new)
/api/risk
/api/predictions          (new)
/api/environment          (new)
/api/vulnerability        (new)
/api/alerts
/api/response             (new)
/api/resources            (new)
/api/simulations          (new)
/api/timeline             (new)
/api/awareness
/api/voice                (new)
/api/channels             (new — mock inbound SMS/IVR, admin/dev only)
/api/health-worker
/api/admin
/api/audit                (new)
/api/analytics            (new — or folded into /api/admin/analytics)
```

All responses follow the existing consistency rule: `{ success, data }` or `{ success: false,
message }`.

---

## 41. Seed Data (Expanded Demo Dataset)

All data fictional/synthetic, clearly labeled as such.

- 50+ health reports, 20+ water reports across multiple villages/districts/states
- Multiple water sources with varied risk/inspection status
- Historical trends spanning several weeks, including at least one full prior "season" to support
  seasonal-pattern prediction inputs
- Environmental events (rainfall spikes, a flood event) time-correlated with a risk escalation
- Multiple vulnerability levels across villages
- At least one location with a clear predicted-risk escalation example
- Current HIGH/CRITICAL hotspots and pending-verification cases
- Approved alerts (historical) and resource assignments (some completed, some in progress)
- Timeline events consistent with the above
- **One fully scripted, perfect end-to-end outbreak scenario** reserved specifically for the SIH
  live demo (§42)

Demo accounts (preserved):
- `community@smarthealthne.demo`
- `worker@smarthealthne.demo`
- `admin@smarthealthne.demo`
- Documented demo password, local dev only, clearly labeled as demo accounts

---

## 42. Demo Scenario (Upgraded, Primary Acceptance Test)

1. Community member submits a symptom report from a fictional village
2. Additional reports arrive (seeded/simulated) from the same area
3. A water source in that village receives contamination reports
4. A rainfall/flood environmental event is recorded for that village
5. Risk engine recalculates: current risk rises, driven by symptom + water + environmental signals
6. Explainable AI shows the component breakdown for why risk increased
7. Prediction engine forecasts further escalation over the next 3–7 days with a stated confidence
8. Vulnerability engine flags the village as high-priority (e.g., high water dependency, distance
   from healthcare facility)
9. Health Worker dashboard receives a real-time notification
10. Health Worker opens the case, reviews explanation + prediction + vulnerability, verifies the
    reports
11. System generates a recommended response plan
12. Admin sees the location on the Resource Priority Dashboard (P1)
13. Admin assigns resources (health workers + water-testing team)
14. A potential alert is created
15. National Admin reviews and approves the alert
16. Community receives a location-aware, multilingual alert in real time
17. Map updates across risk, predicted-risk, water, and environmental layers
18. Outbreak timeline updates with every event above, in order
19. Analytics dashboards update (current situation, trends, response)
20. Admin runs a what-if simulation ("+10 more diarrhea cases") on the same village
21. System shows the projected risk change, clearly labeled as a simulation, without touching
    production data
22. Response is marked completed by the assigned Health Worker/team
23. The entire sequence is visible, end-to-end, in the Admin Audit Log

This is the **primary demo/acceptance criterion** and must run reliably without manual database
intervention.

---

## 43. Acceptance Criteria

| Feature | Acceptance criterion |
|---|---|
| Authentication | RBAC cannot be bypassed from the client; every protected route rejects an unauthorized role server-side |
| Reporting | Reports can be submitted online, offline (queued+synced), and via voice; all converge on the same validation/risk pipeline |
| Risk Engine | Produces auditable results: score, level, components, weights, model version, timestamp, data window |
| Prediction | Works with a safe, explicit fallback when data is insufficient; never fabricates a number |
| Explainability | Every RiskAssessment and Prediction has a linked, deterministic explanation that sums to the score |
| Water | Water sources have persistent, queryable profiles with linked reports and inspection history |
| Environment | Environmental signals measurably affect risk/prediction when configured weights are non-zero |
| Vulnerability | Every village has an explainable vulnerability score, distinct from risk |
| Verification | HIGH/CRITICAL current or predicted risk cannot generate a broadcastable alert without Health Worker verification |
| Alerts | No alert reaches `BROADCAST` status without explicit National Admin approval; code-level guard, not just UI |
| Response | Recommended actions generate automatically at HIGH/CRITICAL; resource assignment and status tracking work end-to-end |
| Simulation | What-if runs never write to production collections; results always labeled as simulation |
| Map | Every layer reflects live database data, filterable, no hard-coded markers |
| Analytics | Every number on every dashboard is computed from the database at request time |
| Real-time | Health Worker/Admin/Community views update via Socket.IO without page refresh |
| Offline | No report is lost during connectivity failure; duplicate submissions are prevented via idempotency key |
| Audit | Every sensitive action (verify, approve, reject, broadcast, assign, configure) is recorded in an append-only audit log with actor and timestamp |

---

## 44. Success Metrics

- Demo Scenario (§42) completes end-to-end without manual intervention
- 100% of protected routes enforce RBAC server-side (verified by automated RBAC test suite)
- 100% of `RiskAssessment`/`Prediction` records have a linked explanation
- 0 alerts reach `BROADCAST` without a recorded verification + approval trail
- 0 report loss in simulated offline→online transitions during testing
- All dashboard figures traceable to a live DB query (spot-checked, no hard-coded values found)

---

## 45. Risks & Open Questions

- **Risk/prediction formula validity** — all weights are prototype defaults, not clinically
  validated; must remain clearly labeled throughout UI and docs
- **False positives at low report volume** — cluster/growth/prediction scores need safe fallback
  behavior when historical data is sparse (addressed via Data Quality/Signal Confidence, §35, and
  prediction fallback, §13)
- **Geo-privacy** — public map views must not expose individually identifiable health information
  (addressed via §33 data-visibility matrix)
- **Language coverage** — only 4 languages at launch; translation quality for Assamese/Bengali
  content should be reviewed by a native speaker before demo
- **Environmental data source** — prototype uses mock/seed rainfall data; real integration (e.g.,
  IMD) is a Phase 2 dependency and its data quality/availability is unverified for this prototype
- **Voice extraction accuracy** — rule/keyword-based extraction is a prototype approximation, not a
  validated NLP system; always requires user confirmation before submission
- **SMS/IVR reliance on real telecom providers** — explicitly out of scope for the local prototype;
  architecture is integration-ready but untested against a live carrier

---

## 46. Future Roadmap

- **REGIONAL_ADMIN** role scoped to state/district
- Real weather-provider integration (e.g., IMD data) behind the existing `IWeatherProvider`
  interface
- Real SMS/IVR telecom integration behind the existing `IChannelAdapter` interface
- Real speech-to-text provider behind the existing `ISpeechToTextProvider` interface
- Level 4 ML forecasting model (see §37) with a formal training/evaluation pipeline, only after
  sufficient real-world data exists and a public-health partner can validate it
- Expanded language coverage across additional Northeast Indian languages
- Formal validation of risk/vulnerability weights with public-health domain experts
- Community alert acknowledgement analytics (delivery/read-rate reporting to authorities)

---

## 47. Feature Coverage Matrix

| Feature | PRD Section | MVP | SIH Demo | Phase 2 | Future |
|---|---|---|---|---|---|
| Auth (JWT/bcrypt/RBAC) | §11.1, §8 | ✅ | ✅ | | |
| User model | §11.2 | ✅ | ✅ | | |
| Health reporting (app) | §11.3 | ✅ | ✅ | | |
| Water issue reporting | §11.4 | ✅ | ✅ | | |
| Current risk engine (symptom/growth/water/cluster) | §12 | ✅ | ✅ | | |
| Health Worker verification | §26, §28 | ✅ | ✅ | | |
| National Admin approval | §26, §29 | ✅ | ✅ | | |
| Alert workflow (PENDING→BROADCAST) | §22 | ✅ | ✅ | | |
| Real-time (Socket.IO core events) | §39 | ✅ | ✅ | | |
| Map (base risk layer) | §24 | ✅ | ✅ | | |
| Analytics (core dashboards) | §25 | ✅ | ✅ | | |
| Awareness module | §30 | ✅ | ✅ | | |
| Multilingual (4 languages) | §31 | ✅ | ✅ | | |
| PWA / offline queue | §32 | ✅ | ✅ | | |
| Explainable AI (risk explanation) | §17 | | ✅ | | |
| Predictive intelligence | §13 | | ✅ | | |
| Environmental intelligence (mock) | §14 | | ✅ | | |
| Water source intelligence (profiles) | §15 | | ✅ | | |
| Vulnerability engine | §16 | | ✅ | | |
| Enhanced risk engine (env + vulnerability layer) | §12 | | ✅ | | |
| Response recommendation engine | §18 | | ✅ | | |
| Resource allocation dashboard | §19 | | ✅ | | |
| Outbreak timeline | §21 | | ✅ | | |
| Location-aware alerts (targeting) | §22 | | ✅ | | |
| Advanced map (all layers) | §24 | | ✅ | | |
| Advanced analytics (prediction/response/water) | §25 | | ✅ | | |
| Audit log | §34 | | ✅ | | |
| Data quality / signal confidence | §35 | | ✅ | | |
| What-if simulator | §20 | | ✅ | | |
| Voice reporting | §23.1 | | ✅ | | |
| SMS architecture (mock) | §23.2 | | | ✅ | |
| IVR architecture (mock) | §23.2 | | | ✅ | |
| Prediction-vs-actual evaluation history | §13, §25 | | | ✅ | |
| REGIONAL_ADMIN role | §8, §46 | | | ✅ | |
| Real weather provider integration | §14, §46 | | | | ✅ |
| Real SMS/IVR telecom integration | §23.2, §46 | | | | ✅ |
| Real speech-to-text provider | §23.1, §46 | | | | ✅ |
| Level 4 ML forecasting model | §37, §46 | | | | ✅ |
| Community alert acknowledgement analytics | §46 | | | | ✅ |
| Formal weight validation with domain experts | §45, §46 | | | | ✅ |
