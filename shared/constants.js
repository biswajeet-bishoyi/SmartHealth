// shared/constants.js
/**
 * Central source of truth for enums, constants, and configuration values.
 * Import this file wherever needed; never re-declare values.
 */

// Risk levels (matching PRD.md §12)
export const RISK_LEVELS = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

// Symptom types (from PRD.md symptom enums)
export const SYMPTOM_TYPES = {
  DIARRHEA: 'diarrhea',
  VOMITING: 'vomiting',
  DEHYDRATION: 'dehydration',
  FEVER: 'fever',
  STOMACH_PAIN: 'stomachPain'
};

// Report statuses (from PRD.md)
export const REPORT_STATUS = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED'
};

// Alert statuses (from PRD.md state machine)
export const ALERT_STATUS = {
  PENDING_REVIEW: 'PENDING_REVIEW',
  VERIFIED: 'VERIFIED',
  APPROVED: 'APPROVED',
  BROADCAST: 'BROADCAST',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED'
};

// User roles
export const USER_ROLES = {
  COMMUNITY_MEMBER: 'COMMUNITY_MEMBER',
  HEALTH_WORKER: 'HEALTH_WORKER',
  NATIONAL_ADMIN: 'NATIONAL_ADMIN'
};

// Water quality ratings (example)
export const WATER_QUALITY = {
  SAFE: 'safe',
  CONTAMINATED: 'contaminated',
  UNKNOWN: 'unknown'
};

// Time windows for calculations (days)
export const TIME_WINDOWS = {
  DAILY: 1,
  WEEKLY: 7,
  BIWEEKLY: 14,
  MONTHLY: 30
};

// Risk engine default weights (from PRD.md §12)
// symptomScore*0.40 + growthScore*0.25 + waterScore*0.20 + clusterScore*0.15
export const RISK_WEIGHTS = {
  SYMPTOM: 0.40,
  GROWTH: 0.25,
  WATER: 0.20,
  CLUSTER: 0.15
};

// Priority score weights (riskWeight + environmentalWeight + vulnerabilityWeight)
export const PRIORITY_WEIGHTS = {
  RISK: 0.60,      // currentRiskScore weight in priorityScore
  ENVIRONMENTAL: 0.20,
  VULNERABILITY: 0.20
};

// Minimum data thresholds for predictions
export const PREDICTION_THRESHOLDS = {
  MIN_REPORTS: 5,
  MIN_HISTORY_DAYS: 7
};

// Default confidence baseline
export const CONFIDENCE_BASELINE = {
  LOW_DATA: 40,    // <3 reports
  MEDIUM_DATA: 70, // 3-9 reports
  HIGH_DATA: 90    // >=10 reports
};