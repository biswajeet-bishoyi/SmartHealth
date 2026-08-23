const mongoose = require('mongoose');

const SYMPTOMS = ['diarrhea', 'vomiting', 'fever', 'abdominal_pain', 'dehydration', 'skin_rash', 'fatigue', 'other'];
const WATER_SOURCES = ['river', 'well', 'community_well', 'hand_pump', 'tap', 'tap_water', 'pond', 'other'];
const WATER_ISSUES = ['dirty_water', 'bad_smell', 'flood_contamination', 'suspected_contamination', 'no_issue'];
const STATUSES = ['PENDING', 'VERIFIED', 'REJECTED'];
const SOURCE_CHANNELS = ['APP', 'VOICE', 'SMS', 'IVR', 'OFFLINE_SYNC'];

const healthReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    // Location fields
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
    latitude: {
      type: Number,
      min: [-90, 'Invalid latitude'],
      max: [90, 'Invalid latitude'],
    },
    longitude: {
      type: Number,
      min: [-180, 'Invalid longitude'],
      max: [180, 'Invalid longitude'],
    },
    // Report content (observations only — NOT a diagnosis)
    symptoms: {
      type: [String],
      enum: { values: SYMPTOMS, message: 'Invalid symptom: {VALUE}' },
      validate: {
        validator: (arr) => arr && arr.length > 0,
        message: 'At least one symptom must be reported',
      },
    },
    duration: {
      type: Number, // days
      min: [0, 'Duration cannot be negative'],
      max: [365, 'Duration seems too long'],
    },
    affectedPeople: {
      type: Number,
      min: [1, 'Affected people must be at least 1'],
      max: [10000, 'Value seems too large'],
      default: 1,
    },
    waterSource: {
      type: String,
      enum: { values: WATER_SOURCES, message: 'Invalid water source' },
    },
    waterIssues: {
      type: [String],
      enum: { values: WATER_ISSUES, message: 'Invalid water issue: {VALUE}' },
      default: ['no_issue'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    // Workflow status
    status: {
      type: String,
      enum: { values: STATUSES, message: 'Invalid status' },
      default: 'PENDING',
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: {
      type: Date,
    },
    verificationNotes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    // Tracks the channel through which this report was submitted (PRD §11.3)
    sourceChannel: {
      type: String,
      enum: { values: SOURCE_CHANNELS, message: 'Invalid source channel' },
      default: 'APP',
    },
    // For offline-queued reports: idempotency key (client-generated UUID)
    localId: {
      type: String,
      sparse: true,
      index: true,
    },
    // Link to water source entity if identified at report time
    waterSourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WaterSource',
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
healthReportSchema.index({ village: 1, createdAt: -1 });
healthReportSchema.index({ district: 1, createdAt: -1 });
healthReportSchema.index({ state: 1, createdAt: -1 });
healthReportSchema.index({ status: 1 });
healthReportSchema.index({ userId: 1 });
healthReportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('HealthReport', healthReportSchema);
