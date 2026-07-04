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
    const { organizationId, organizationSlug, key } = req.body;
    if ((!organizationId && !organizationSlug) || !key) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Organization ID/Slug and feature flag key are required' } });
    }

    let resolvedOrgId = organizationId;
    if (!resolvedOrgId && organizationSlug) {
      const org = await Organization.findOne({ slug: organizationSlug.trim().toLowerCase() });
      if (!org) {
        return res.status(404).json({ error: { code: 'ORGANIZATION_NOT_FOUND', message: `Organization with slug '${organizationSlug}' not found` } });
      }
      resolvedOrgId = org._id;
    }

    const flag = await FeatureFlag.findOne({
      organizationId: resolvedOrgId,
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
