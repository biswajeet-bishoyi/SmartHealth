const mongoose = require('mongoose');

/**
 * Resource
 * --------
 * A deployable public-health resource (worker, team, supply).
 */
const resourceSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['HEALTH_WORKER', 'WATER_TESTING_TEAM', 'INSPECTION_TEAM', 'AWARENESS_TEAM', 'SUPPLY_PACK', 'EMERGENCY_RESPONSE_TEAM'],
    required: true,
    index: true,
  },
  name:     { type: String, required: true },
  capacity: { type: Number, default: 1 },   // e.g. number of people in a team

  currentAssignmentStatus: {
    type: String,
    enum: ['AVAILABLE', 'ASSIGNED', 'IN_TRANSIT', 'ON_SITE'],
    default: 'AVAILABLE',
    index: true,
  },

  homeDistrict: { type: String, index: true },
  homeState:    { type: String },

  notes: { type: String },
}, { timestamps: true });

/**
 * ResourceAssignment
 * ------------------
 * Tracks a Resource deployed to a location as part of a ResponsePlan.
 */
const resourceAssignmentSchema = new mongoose.Schema({
  resourceId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true, index: true },
  responsePlanId:{ type: mongoose.Schema.Types.ObjectId, ref: 'ResponsePlan', index: true },

  village:  { type: String, required: true, index: true },
  district: { type: String, required: true, index: true },
  state:    { type: String },

  assignedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedAt:   { type: Date, default: Date.now },

  status: {
    type: String,
    enum: ['ASSIGNED', 'IN_TRANSIT', 'ON_SITE', 'COMPLETED'],
    default: 'ASSIGNED',
    index: true,
  },

  completedAt: { type: Date },
  notes:       { type: String },
}, { timestamps: true });

resourceAssignmentSchema.index({ village: 1, district: 1, status: 1 });

const Resource           = mongoose.model('Resource', resourceSchema);
const ResourceAssignment = mongoose.model('ResourceAssignment', resourceAssignmentSchema);

module.exports = { Resource, ResourceAssignment };
