const Organization = require('../models/Organization');
const FeatureFlag = require('../models/FeatureFlag');

const listPublicOrganizations = async (req, res, next) => {
  try {
    const orgs = await Organization.find({}, 'name slug').sort({ name: 1 });
    res.json(orgs);
  } catch (error) {
    next(error);
  }
};

const checkFlag = async (req, res, next) => {
  try {
    const { organizationId, key } = req.body;
    if (!organizationId || !key) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Organization ID and feature flag key are required' } });
    }

    const flag = await FeatureFlag.findOne({
      organizationId,
      key,
    });

    if (!flag) {
      return res.status(404).json({
        error: {
          code: 'FLAG_NOT_FOUND',
          message: `No feature flag '${key}' found for this organization`,
        }
      });
    }

    res.json({
      key: flag.key,
      enabled: flag.enabled,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { listPublicOrganizations, checkFlag };
