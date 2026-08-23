const mongoose = require('mongoose');

const communityQuerySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    village: {
      type: String,
      default: 'Majuli Village',
      trim: true,
    },
    district: {
      type: String,
      default: 'Kamrup',
      trim: true,
    },
    state: {
      type: String,
      default: 'Assam',
      trim: true,
    },
    category: {
      type: String,
      enum: ['water', 'water_safety', 'disease', 'symptoms', 'emergency', 'treatment', 'general'],
      default: 'general',
    },
    question: {
      type: String,
      required: [true, 'Question content is required'],
      trim: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ANSWERED'],
      default: 'PENDING',
    },
    answer: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    answeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    answeredByName: {
      type: String,
      trim: true,
    },
    answeredAt: {
      type: Date,
    },
    isCommonQuestion: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('CommunityQuery', communityQuerySchema);
