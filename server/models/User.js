const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['COMMUNITY_MEMBER', 'HEALTH_WORKER', 'NATIONAL_ADMIN'];
const LANGUAGES = ['en', 'hi', 'as', 'bn'];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [15, 'Phone cannot exceed 15 characters'],
    },
    // NEVER store plaintext password — hashed in pre-save hook
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Never returned in queries by default
    },
    role: {
      type: String,
      enum: { values: ROLES, message: 'Invalid role' },
      default: 'COMMUNITY_MEMBER',
    },
    state: {
      type: String,
      trim: true,
      default: 'Assam',
    },
    district: {
      type: String,
      trim: true,
    },
    village: {
      type: String,
      trim: true,
    },
    language: {
      type: String,
      enum: { values: LANGUAGES, message: 'Unsupported language' },
      default: 'en',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
userSchema.index({ role: 1 });
userSchema.index({ district: 1 });
userSchema.index({ village: 1 });
userSchema.index({ role: 1, district: 1 });

// ─── Pre-save: Hash password ───────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
  this.password = await bcrypt.hash(this.password, rounds);
  next();
});

// ─── Instance method: Compare password ────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── Ensure password is never serialized to JSON ──────────────────────────────
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
