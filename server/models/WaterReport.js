const mongoose = require('mongoose');

const WATER_SOURCES = ['river', 'well', 'hand_pump', 'tap', 'pond', 'other'];
const ISSUE_TYPES = [
  'dirty_water',
  'bad_smell',
  'flood_contamination',
  'broken_water_source',
  'suspected_contamination',
  'other',
];
const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const waterReportSchema = new mongoose.Schema(
  {
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true,
    },
    village: {
      type: String,
      required: [true, 'Village is required'],
      trim: true,
    },
    latitude: { type: Number },
    longitude: { type: Number },
    waterSource: {
      type: String,
      enum: { values: WATER_SOURCES, message: 'Invalid water source' },
      required: [true, 'Water source is required'],
    },
    issueType: {
      type: String,
      enum: { values: ISSUE_TYPES, message: 'Invalid issue type' },
      required: [true, 'Issue type is required'],
    },
    severity: {
      type: String,
      enum: { values: SEVERITIES, message: 'Invalid severity' },
      default: 'MEDIUM',
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

waterReportSchema.index({ village: 1, createdAt: -1 });
waterReportSchema.index({ district: 1, createdAt: -1 });
waterReportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('WaterReport', waterReportSchema);
