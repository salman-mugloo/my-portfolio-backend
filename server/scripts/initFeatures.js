import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Feature from '../models/Feature.js';
import { connectDB } from '../config/database.js';

dotenv.config();

const initializeFeatures = async () => {
  try {
    await connectDB();

    const defaultFeatures = [
      {
        label: 'Clean Code',
        tooltip: 'Readable, maintainable, scalable codebases',
        icon: 'Code',
        order: 0,
        isActive: true
      },
      {
        label: 'Security First',
        tooltip: 'Role-based access and secure data handling',
        icon: 'ShieldCheck',
        order: 1,
        isActive: true
      },
      {
        label: 'Performance',
        tooltip: 'Optimized frontend and backend systems',
        icon: 'Activity',
        order: 2,
        isActive: true
      },
      {
        label: 'User Focused',
        tooltip: 'Design driven by usability and clarity',
        icon: 'Users',
        order: 3,
        isActive: true
      }
    ];

    // Check if features already exist
    const existingFeatures = await Feature.find();
    
    if (existingFeatures.length === 0) {
      await Feature.insertMany(defaultFeatures);
      console.log('✅ Default features initialized');
    } else {
      console.log('ℹ️  Features already exist, skipping initialization');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing features:', error);
    process.exit(1);
  }
};

initializeFeatures();

