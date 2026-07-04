const bcrypt = require('bcryptjs');
const User = require('../models/User');

const seedSuperAdmin = async () => {
  try {
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@byepo.com';
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!';

    const existingSuper = await User.findOne({ role: 'super_admin' });
    if (!existingSuper) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(superAdminPassword, salt);

      await User.create({
        email: superAdminEmail,
        passwordHash,
        role: 'super_admin',
      });

      console.log(`Successfully seeded Super Admin user: ${superAdminEmail}`);
    } else {
      console.log('Super Admin user already exists, skipping seeding.');
    }
  } catch (error) {
    console.error('Error seeding Super Admin:', error);
  }
};

module.exports = seedSuperAdmin;
