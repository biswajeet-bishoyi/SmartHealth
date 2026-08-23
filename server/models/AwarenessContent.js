const mongoose = require('mongoose');

const CATEGORIES = [
  'Safe Water',
  'Hygiene',
  'Food Safety',
  'Water-Borne Disease Awareness',
  'Emergency Warning Signs',
];
const LANGUAGES = ['en', 'hi', 'as', 'bn'];

/**
 * AwarenessContent is clearly educational/public-health information.
 * It must NEVER be presented as personalized medical advice.
 */
const awarenessContentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
    },
    category: {
      type: String,
      enum: { values: CATEGORIES, message: 'Invalid category' },
      required: [true, 'Category is required'],
    },
    language: {
      type: String,
      enum: { values: LANGUAGES, message: 'Unsupported language' },
      default: 'en',
    },
    source: {
      type: String,
      trim: true,
      maxlength: [200, 'Source cannot exceed 200 characters'],
    },
    image: {
      type: String, // URL
      trim: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

awarenessContentSchema.index({ category: 1, language: 1 });
awarenessContentSchema.index({ language: 1 });

module.exports = mongoose.model('AwarenessContent', awarenessContentSchema);
