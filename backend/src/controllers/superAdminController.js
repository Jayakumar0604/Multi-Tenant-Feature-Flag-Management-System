const Organization = require('../models/Organization');

const createOrganization = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Organization name is required' } });
    }

    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    
    // Check if name or slug already exists
    const existingOrg = await Organization.findOne({ $or: [{ name: name.trim() }, { slug }] });
    if (existingOrg) {
      return res.status(400).json({ error: { code: 'ORGANIZATION_EXISTS', message: 'Organization name or slug already exists' } });
    }

    const org = await Organization.create({
      name: name.trim(),
      slug,
    });

    res.status(201).json(org);
  } catch (error) {
    next(error);
  }
};

const listOrganizations = async (req, res, next) => {
  try {
    const orgs = await Organization.find().sort({ createdAt: -1 });
    res.json(orgs);
  } catch (error) {
    next(error);
  }
};

module.exports = { createOrganization, listOrganizations };
