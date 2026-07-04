const mongoose = require('mongoose');

const FeatureFlagSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  key: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  enabled: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// A flag key must be unique within an organization
FeatureFlagSchema.index({ organizationId: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('FeatureFlag', FeatureFlagSchema);
