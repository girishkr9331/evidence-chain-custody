import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const setupAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/evidence-chain');
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'ADMIN' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists:');
      console.log('   Address:', existingAdmin.address);
      console.log('   Name:', existingAdmin.name);
      console.log('\nTo reset, delete the user from database first.');
      process.exit(0);
    }

    // Default admin credentials
    // YOU SHOULD CHANGE THESE!
    const adminData = {
      address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', // Default Hardhat account #0
      password: 'admin123', // CHANGE THIS!
      name: 'System Administrator',
      role: 'ADMIN',
      department: 'IT Security'
    };

    // Create admin user
    const admin = new User(adminData);
    await admin.save();

    console.log('\n✅ Admin user created successfully!');
    console.log('\n📋 Admin Credentials:');
    console.log('   Address:', adminData.address);
    console.log('   Password:', adminData.password);
    console.log('   Name:', adminData.name);
    console.log('   Role:', adminData.role);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    console.log('\n💡 You can now login at: http://localhost:3000/login');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up admin:', error);
    process.exit(1);
  }
};

setupAdmin();
