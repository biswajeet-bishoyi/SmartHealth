/**
 * resourceService.js
 * ------------------
 * Resource + ResourceAssignment CRUD and tracking.
 * Every assignment action is audited via auditService.
 */

const { Resource, ResourceAssignment } = require('../models/Resource');
const auditService = require('./auditService');

// ─── Resources ───────────────────────────────────────────────────────────────

const createResource = async (data) => Resource.create(data);

const getResources = async (filter = {}) => {
  const query = {};
  if (filter.type)   query.type   = filter.type;
  if (filter.status) query.currentAssignmentStatus = filter.status;
  return Resource.find(query).sort({ type: 1, name: 1 }).lean();
};

// ─── Assignments ─────────────────────────────────────────────────────────────

const assignResource = async ({ resourceId, responsePlanId, village, district, state, assignedBy }) => {
  const resource = await Resource.findById(resourceId);
  if (!resource) throw Object.assign(new Error('Resource not found'), { statusCode: 404 });

  const assignment = await ResourceAssignment.create({
    resourceId, responsePlanId,
    village, district, state,
    assignedBy,
    status: 'ASSIGNED',
    assignedAt: new Date(),
  });

  // Update resource status
  resource.currentAssignmentStatus = 'ASSIGNED';
  await resource.save();

  await auditService.record({
    actorId: assignedBy,
    actorRole: 'NATIONAL_ADMIN',
    action: 'RESOURCE_ASSIGNED',
    entityType: 'ResourceAssignment',
    entityId: assignment._id,
    newValue: { resourceId, village, district },
    village, district,
  });

  return assignment;
};

const updateAssignment = async (assignmentId, { status, notes }, adminId) => {
  const assignment = await ResourceAssignment.findById(assignmentId);
  if (!assignment) throw Object.assign(new Error('Assignment not found'), { statusCode: 404 });

  const prev = { status: assignment.status };
  assignment.status = status;
  if (notes) assignment.notes = notes;
  if (status === 'COMPLETED') {
    assignment.completedAt = new Date();
    // Free the resource
    await Resource.findByIdAndUpdate(assignment.resourceId, { currentAssignmentStatus: 'AVAILABLE' });
  }
  await assignment.save();

  await auditService.record({
    actorId: adminId,
    actorRole: 'NATIONAL_ADMIN',
    action: 'RESOURCE_ASSIGNMENT_UPDATED',
    entityType: 'ResourceAssignment',
    entityId: assignment._id,
    previousValue: prev,
    newValue: { status },
    village: assignment.village,
    district: assignment.district,
  });

  return assignment;
};

const getAssignments = async ({ village, district, status, page = 1, limit = 20 } = {}) => {
  const query = {};
  if (village)  query.village  = village;
  if (district) query.district = district;
  if (status)   query.status   = status;
  const skip = (page - 1) * limit;
  const [assignments, total] = await Promise.all([
    ResourceAssignment.find(query)
      .populate('resourceId', 'name type capacity')
      .populate('assignedBy', 'name')
      .sort({ assignedAt: -1 })
      .skip(skip).limit(limit).lean(),
    ResourceAssignment.countDocuments(query),
  ]);
  return { assignments, total };
};

/**
 * Resource Priority Dashboard data — combines risk, vulnerability, and assignments.
 */
const getPriorityDashboard = async (riskAssessments) => {
  const dashboard = [];
  for (const ra of riskAssessments) {
    const activeAssignments = await ResourceAssignment.find({
      village: ra.village,
      district: ra.district,
      status: { $in: ['ASSIGNED', 'IN_TRANSIT', 'ON_SITE'] },
    }).populate('resourceId', 'name type').lean();

    dashboard.push({
      village:           ra.village,
      district:          ra.district,
      state:             ra.state,
      riskScore:         ra.riskScore,
      riskLevel:         ra.riskLevel,
      priorityScore:     ra.priorityScore || ra.riskScore,
      vulnerabilityScore:ra.vulnerabilityScore || 0,
      activeAssignments,
      assignmentCount: activeAssignments.length,
    });
  }
  // Sort by priorityScore desc
  return dashboard.sort((a, b) => b.priorityScore - a.priorityScore);
};

module.exports = {
  createResource, getResources,
  assignResource, updateAssignment, getAssignments,
  getPriorityDashboard,
};
