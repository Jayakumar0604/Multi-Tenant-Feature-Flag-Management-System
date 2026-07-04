const FeatureFlag = require('../models/FeatureFlag');

const createFlag = async (req, res, next) => {
  try {
    const { key, description, enabled } = req.body;
    if (!key) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Feature flag key is required' } });
    }

    // Ensure key is alphanumeric/underscore
    if (!/^[a-zA-Z0-9_]+$/.test(key)) {
      return res.status(400).json({ error: { code: 'INVALID_KEY_FORMAT', message: 'Feature flag key can only contain alphanumeric characters and underscores' } });
    }

    // Check if key already exists in this organization
    const existingFlag = await FeatureFlag.findOne({
      organizationId: req.user.organizationId,
      key,
    });
    if (existingFlag) {
      return res.status(400).json({ error: { code: 'FLAG_EXISTS', message: 'A feature flag with this key already exists in your organization' } });
    }

    const flag = await FeatureFlag.create({
      organizationId: req.user.organizationId,
      key,
      description,
      enabled: !!enabled,
      createdBy: req.user.userId,
    });

    res.status(201).json(flag);
  } catch (error) {
    next(error);
  }
};

const getFlags = async (req, res, next) => {
  try {
    const flags = await FeatureFlag.find({
      organizationId: req.user.organizationId,
    }).sort({ createdAt: -1 });
    
    res.json(flags);
  } catch (error) {
    next(error);
  }
};

const updateFlag = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { enabled, description } = req.body;

    const updates = {};
    if (enabled !== undefined) updates.enabled = !!enabled;
    if (description !== undefined) updates.description = description;

    // Strict scoping to owner's organizationId
    const flag = await FeatureFlag.findOneAndUpdate(
      { _id: id, organizationId: req.user.organizationId },
      updates,
      { new: true, runValidators: true }
    );

    if (!flag) {
      return res.status(404).json({ error: { code: 'FLAG_NOT_FOUND', message: 'Feature flag not found in your organization' } });
    }

    res.json(flag);
  } catch (error) {
    next(error);
  }
};

const deleteFlag = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Strict scoping to owner's organizationId
    const flag = await FeatureFlag.findOneAndDelete({
      _id: id,
      organizationId: req.user.organizationId,
    });

    if (!flag) {
      return res.status(404).json({ error: { code: 'FLAG_NOT_FOUND', message: 'Feature flag not found in your organization' } });
    }

    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

module.exports = { createFlag, getFlags, updateFlag, deleteFlag };
