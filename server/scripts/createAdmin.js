import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/Admin.js';
import { connectDB } from '../config/database.js';

dotenv.config();

const createAdmin = async () => {
  try {
    await connectDB();

    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';

    // Check if admin exists
    let admin = await Admin.findOne({ username });
    
    if (admin) {
      // Update password
      admin.password = password;
      await admin.save();
      console.log(`✅ Admin password updated for user: ${username}`);
    } else {
      // Create new admin
      admin = await Admin.create({
        username,
        password
      });
      console.log(`✅ Admin user created: ${username}`);
    }

    console.log(`✅ Admin credentials:`);
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();

