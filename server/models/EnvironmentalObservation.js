const mongoose = require('mongoose');

/**
 * EnvironmentalObservation
 * ------------------------
 * Stores rainfall, flood, and environmental contamination signals per location.
 * Source can be MOCK_SEED (prototype), MANUAL_ENTRY, or EXTERNAL_API (future).
 *
 * PROTOTYPE DISCLAIMER: Environmental data in this prototype is mock/seed data.
 * Real integration (e.g., IMD weather data) is a Phase 2 dependency.
 */
const environmentalObservationSchema = new mongoose.Schema({
  village:  { type: String, required: true, index: true },
  district: { type: String, required: true, index: true },
  state:    { type: String },

  observationType: {
    type: String,
    enum: ['RAINFALL', 'FLOOD', 'CONTAMINATION_RISK'],
    required: true,
    index: true,
  },

  value: { type: Number },         // Numeric value (e.g., rainfall in mm)
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'LOW',
  },

  description: { type: String },
  isHeavyRainfall: { type: Boolean, default: false },
  isFloodEvent:    { type: Boolean, default: false },

  source: {
    type: String,
    enum: ['MOCK_SEED', 'MANUAL_ENTRY', 'EXTERNAL_API'],
    default: 'MOCK_SEED',
    required: true,
  },

  // isMock must always be labeled for prototype transparency
  isMock: { type: Boolean, default: true },

  observedAt: { type: Date, required: true, index: true },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

environmentalObservationSchema.index({ village: 1, district: 1, observedAt: -1 });

module.exports = mongoose.model('EnvironmentalObservation', environmentalObservationSchema);
