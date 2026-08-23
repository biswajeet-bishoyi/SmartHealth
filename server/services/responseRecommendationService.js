/**
 * responseRecommendationService.js
 * ---------------------------------
 * Generates ResponsePlans from an action template library.
 * Templates keyed by risk level, water source status, and vulnerability.
 *
 * DISCLAIMER: Recommendations are operational public-health actions only.
 * Never personalized medical treatment advice.
 */

const ResponsePlan = require('../models/ResponsePlan');

// Action template library — indexed by template key
const ACTION_TEMPLATES = {
  DEPLOY_HEALTH_WORKERS: {
    templateRef: 'DEPLOY_HEALTH_WORKERS',
    description: 'Deploy health workers to the affected area for field assessment',
    priority: 1,
    resourceRequirement: '2 health workers',
  },
  WATER_TESTING_TEAM: {
    templateRef: 'WATER_TESTING_TEAM',
    description: 'Send water-quality testing team to collect samples from all water sources',
    priority: 1,
    resourceRequirement: '1 water-testing team',
  },
  INSPECT_WATER_SOURCES: {
    templateRef: 'INSPECT_WATER_SOURCES',
    description: 'Inspect and test all high-risk water sources in the village',
    priority: 2,
    resourceRequirement: '1 inspection team',
  },
  DISTRIBUTE_SUPPLIES: {
    templateRef: 'DISTRIBUTE_SUPPLIES',
    description: 'Distribute ORS (oral rehydration salts) and chlorination tablets to households',
    priority: 2,
    resourceRequirement: '1 supply pack',
  },
  COMMUNITY_WARNING: {
    templateRef: 'COMMUNITY_WARNING',
    description: 'Issue community-level water-safety advisory and public guidance',
    priority: 2,
    resourceRequirement: '1 awareness team',
  },
  INCREASED_MONITORING: {
    templateRef: 'INCREASED_MONITORING',
    description: 'Increase monitoring frequency to daily check-ins for the next 7 days',
    priority: 3,
    resourceRequirement: '1 health worker',
  },
  CLOSE_WATER_SOURCE: {
    templateRef: 'CLOSE_WATER_SOURCE',
    description: 'Temporarily close contaminated water source pending inspection results',
    priority: 1,
    resourceRequirement: 'Coordination with local authority',
  },
  EMERGENCY_RESPONSE: {
    templateRef: 'EMERGENCY_RESPONSE',
    description: 'Dispatch emergency response team for rapid on-site assessment',
    priority: 1,
    resourceRequirement: '1 emergency response team',
  },
  FACILITY_ALERT: {
    templateRef: 'FACILITY_ALERT',
    description: 'Alert nearest healthcare facility to prepare for potential case intake',
    priority: 1,
    resourceRequirement: 'Coordination with district health office',
  },
};

/**
 * Select action templates based on risk level, water source status, and vulnerability.
 */
const selectActions = (riskLevel, hasWaterContamination = false, vulnerabilityLevel = 'LOW') => {
  const actions = [];

  if (riskLevel === 'CRITICAL') {
    actions.push(ACTION_TEMPLATES.EMERGENCY_RESPONSE);
    actions.push(ACTION_TEMPLATES.DEPLOY_HEALTH_WORKERS);
    actions.push(ACTION_TEMPLATES.FACILITY_ALERT);
    actions.push(ACTION_TEMPLATES.WATER_TESTING_TEAM);
    actions.push(ACTION_TEMPLATES.DISTRIBUTE_SUPPLIES);
    actions.push(ACTION_TEMPLATES.COMMUNITY_WARNING);
  } else if (riskLevel === 'HIGH') {
    actions.push(ACTION_TEMPLATES.DEPLOY_HEALTH_WORKERS);
    actions.push(ACTION_TEMPLATES.WATER_TESTING_TEAM);
    actions.push(ACTION_TEMPLATES.DISTRIBUTE_SUPPLIES);
    actions.push(ACTION_TEMPLATES.COMMUNITY_WARNING);
    actions.push(ACTION_TEMPLATES.INCREASED_MONITORING);
  } else if (riskLevel === 'MEDIUM') {
    actions.push(ACTION_TEMPLATES.INCREASED_MONITORING);
    actions.push(ACTION_TEMPLATES.COMMUNITY_WARNING);
  }

  if (hasWaterContamination) {
    if (!actions.find(a => a.templateRef === 'INSPECT_WATER_SOURCES')) {
      actions.push(ACTION_TEMPLATES.INSPECT_WATER_SOURCES);
    }
    if (!actions.find(a => a.templateRef === 'CLOSE_WATER_SOURCE')) {
      actions.push(ACTION_TEMPLATES.CLOSE_WATER_SOURCE);
    }
  }

  // Sort by priority
  return actions.sort((a, b) => a.priority - b.priority);
};

/**
 * Create a ResponsePlan for a location when risk reaches HIGH or CRITICAL.
 */
const createPlan = async ({ riskAssessmentId, village, district, state, riskLevel, hasWaterContamination, vulnerabilityLevel }) => {
  // Only create plans for HIGH or CRITICAL
  if (!['HIGH', 'CRITICAL'].includes(riskLevel)) return null;

  // Avoid duplicate pending plans
  const existing = await ResponsePlan.findOne({
    village, district,
    status: { $in: ['DRAFT', 'REVIEWED', 'IN_PROGRESS'] },
  });
  if (existing) return existing;

  const actions = selectActions(riskLevel, hasWaterContamination, vulnerabilityLevel);

  const plan = await ResponsePlan.create({
    village, district, state,
    riskAssessmentId,
    riskLevel,
    actions,
    status: 'DRAFT',
    createdBySystem: true,
  });

  return plan;
};

/**
 * Get response plans — filterable by location and status.
 */
const getPlans = async ({ village, district, status, page = 1, limit = 20 } = {}) => {
  const query = {};
  if (village)  query.village  = village;
  if (district) query.district = district;
  if (status)   query.status   = status;
  const skip = (page - 1) * limit;
  const [plans, total] = await Promise.all([
    ResponsePlan.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ResponsePlan.countDocuments(query),
  ]);
  return { plans, total };
};

/**
 * Update a response plan (Health Worker review / status update).
 */
const updatePlan = async (planId, updates, reviewerId) => {
  const plan = await ResponsePlan.findById(planId);
  if (!plan) throw Object.assign(new Error('Response plan not found'), { statusCode: 404 });
  Object.assign(plan, updates);
  if (reviewerId) { plan.reviewedBy = reviewerId; plan.reviewedAt = new Date(); }
  await plan.save();
  return plan;
};

module.exports = { createPlan, getPlans, updatePlan, selectActions };
