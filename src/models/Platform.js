const mongoose = require('mongoose');

const platformSchema = new mongoose.Schema({
  justWatchId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  icon: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for faster lookups
platformSchema.index({ name: 1 });
platformSchema.index({ isActive: 1 });

// Pre-save hook: generate slug automatically if missing
platformSchema.pre('save', function(next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumeric with dash
      .replace(/^-+|-+$/g, '');    // trim leading/trailing dashes
  }
  next();
});

const Platform = mongoose.model('Platform', platformSchema);

module.exports = Platform;
