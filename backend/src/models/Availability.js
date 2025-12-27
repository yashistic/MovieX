const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  movie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: true,
    index: true
  },
  platform: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Platform',
    required: true,
    index: true
  },
  
  // Monetization type
  monetizationType: {
    type: String,
    enum: ['flatrate', 'rent', 'buy', 'ads', 'free'],
    required: true
  },

  // Quality and pricing
  quality: {
    type: String,
    enum: ['SD', 'HD', 'UHD', '4K', 'unknown'],
    default: 'unknown'
  },
  price: {
    amount: {
      type: Number,
      default: null
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },

  // Availability tracking
  isAvailable: {
    type: Boolean,
    default: true,
    index: true
  },
  firstSeenAt: {
    type: Date,
    default: Date.now
  },
  lastSeenAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  lastUnavailableAt: {
    type: Date,
    default: null
  },

  // External reference
  externalUrl: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Compound unique index to prevent duplicates
availabilitySchema.index(
  { movie: 1, platform: 1, monetizationType: 1 },
  { unique: true }
);

// Compound indexes for common queries
availabilitySchema.index({ platform: 1, isAvailable: 1, lastSeenAt: -1 });
availabilitySchema.index({ movie: 1, isAvailable: 1 });
availabilitySchema.index({ isAvailable: 1, lastSeenAt: -1 });

// Method to mark as unavailable
availabilitySchema.methods.markUnavailable = function() {
  this.isAvailable = false;
  this.lastUnavailableAt = new Date();
};

// Method to mark as available
availabilitySchema.methods.markAvailable = function() {
  this.isAvailable = true;
  this.lastSeenAt = new Date();
};

const Availability = mongoose.model('Availability', availabilitySchema);

module.exports = Availability;