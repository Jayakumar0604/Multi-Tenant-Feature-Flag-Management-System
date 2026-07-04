const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Organization = require('../models/Organization');

const signup = async (req, res, next) => {
  try {
    const { email, password, organizationId } = req.body;
    if (!email || !password || !organizationId) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Email, password, and organization ID are required' } });
    }

    // Verify organization exists
    const org = await Organization.findById(organizationId);
    if (!org) {
      return res.status(404).json({ error: { code: 'ORGANIZATION_NOT_FOUND', message: 'Organization not found' } });
    }

    // Check if email already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: { code: 'USER_ALREADY_EXISTS', message: 'Email is already registered' } });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user as org_admin
    const user = await User.create({
      email,
      passwordHash,
      role: 'org_admin',
      organizationId,
    });

    const token = jwt.sign(
      { userId: user._id, role: user.role, organizationId: user.organizationId },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      role: user.role,
      organizationId: user.organizationId,
      user: { id: user._id, email: user.email }
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Email and password are required' } });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role, organizationId: user.organizationId || null },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      role: user.role,
      organizationId: user.organizationId || null,
      user: { id: user._id, email: user.email }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { signup, login };
