require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');
const seedSuperAdmin = require('./src/utils/seed');

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    // Connect to Database
    await connectDB();

    // Seed Super Admin
    await seedSuperAdmin();

    // Start listening
    app.listen(PORT, () => {
      console.log(`Backend server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server failed to start:', error);
    process.exit(1);
  }
};

startServer();
