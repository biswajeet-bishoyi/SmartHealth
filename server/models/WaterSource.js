const mongoose = require('mongoose');

/**
 * WaterSource
 * -----------
 * Persistent entity representing a physical water source (well, pump, river, etc.)
 * Linked to WaterReports and has its own risk score that updates on new reports.
 */
const riskSnapshotSchema = new mongoose.Schema({
  riskScore: { type: Number },
  riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
  snappedAt: { type: Date, default: Date.now },
  reportCount: { type: Number },
}, { _id: false });

const waterSourceSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  type: {
    type: String,
    enum: ['tube_well', 'hand_pump', 'river', 'pond', 'piped_supply', 'well', 'tap', 'other'],
    required: true,
  },

  village:  { type: String, required: true, index: true },
  district: { type: String, required: true, index: true },
  state:    { type: String },

  latitude:  { type: Number },
  longitude: { type: Number },

  connectedPopulation: { type: Number, default: 0 },

  status: {
    type: String,
    enum: ['ACTIVE', 'INVESTIGATION_REQUIRED', 'CLOSED'],
    default: 'ACTIVE',
    index: true,
  },

  currentRiskScore: { type: Number, default: 0 },
  currentRiskLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'LOW',
  },

  historicalRiskSnapshots: [riskSnapshotSchema],

  lastInspectionAt:     { type: Date },
  lastInspectionResult: { type: String },  // Free text + inspector notes
  lastInspectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Aggregated (computed, not stored redundantly — see waterSourceService)
  totalReportCount:         { type: Number, default: 0 },
  contaminationReportCount: { type: Number, default: 0 },

  description: { type: String },
}, { timestamps: true });

waterSourceSchema.index({ village: 1, district: 1 });
waterSourceSchema.index({ currentRiskScore: -1 });

module.exports = mongoose.model('WaterSource', waterSourceSchema);
