import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/Admin.js';
import Project from '../models/Project.js';
import Expertise from '../models/Expertise.js';
import Skill from '../models/Skill.js';
import { connectDB } from '../config/database.js';

dotenv.config();

const initializeData = async () => {
  try {
    await connectDB();

    // Create admin user
    const adminExists = await Admin.findOne({ username: process.env.ADMIN_USERNAME });
    if (!adminExists) {
      await Admin.create({
        username: process.env.ADMIN_USERNAME,
        password: process.env.ADMIN_PASSWORD
      });
      console.log('✅ Admin user created');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Seed initial projects
    const projectCount = await Project.countDocuments();
    if (projectCount === 0) {
      await Project.insertMany([
        {
          title: "PhonePe Stock Prediction",
          description: "Machine Learning model for predicting PhonePe stock prices using historical data analysis, regression techniques, and time-series forecasting.",
          githubLink: "https://github.com/salman-mugloo",
          technologies: ["Python", "Machine Learning", "Data Analysis", "Pandas"],
          isPublished: true
        },
        {
          title: "Campus Hiring Platform",
          description: "A web platform connecting students and recruiters for campus placements with job listings, applications, and admin dashboard built with modern web technologies.",
          githubLink: "https://github.com/salman-mugloo",
          technologies: ["HTML", "CSS", "JavaScript", "Web Development"],
          isPublished: true
        },
        {
          title: "Public Health Survey Website",
          description: "Health survey portal for managing community health surveys, responses, and analytics with user-friendly interface and role-based access.",
          githubLink: "https://github.com/salman-mugloo/health-survey-web-app",
          technologies: ["JavaScript", "HTML", "CSS", "Web Development"],
          isPublished: true
        }
      ]);
      console.log('✅ Initial projects seeded');
    }

    // Seed initial expertise
    const expertiseCount = await Expertise.countDocuments();
    if (expertiseCount === 0) {
      await Expertise.insertMany([
        {
          title: "Programming Languages",
          description: "Proficient in core programming languages with strong problem-solving skills.",
          points: ["Core Java", "Python", "HTML", "CSS", "JavaScript"],
          iconKey: "Code",
          order: 0,
          isActive: true
        },
        {
          title: "Web Development",
          description: "Creating web interfaces and applications using HTML, CSS, and JavaScript.",
          points: ["HTML", "CSS", "JavaScript", "Responsive Design", "Web Basics"],
          iconKey: "Layout",
          order: 1,
          isActive: true
        },
        {
          title: "AI & Machine Learning",
          description: "Creating intelligent solutions with machine learning models and AI algorithms.",
          points: ["Machine Learning", "Data Analysis", "Model Training", "Python ML"],
          iconKey: "Brain",
          order: 2,
          isActive: true
        },
        {
          title: "Development Tools",
          description: "Using modern tools and practices for efficient development workflow.",
          points: ["Git/GitHub", "VS Code", "Postman", "MongoDB Atlas", "Deployment"],
          iconKey: "Terminal",
          order: 3,
          isActive: true
        }
      ]);
      console.log('✅ Initial expertise seeded');
    }

    // Seed initial skills
    const skillCount = await Skill.countDocuments();
    if (skillCount === 0) {
      await Skill.insertMany([
        {
          name: "Core Java",
          description: "Object-oriented programming with Java for building robust applications.",
          iconKey: "Code",
          color: "from-orange-500",
          order: 0,
          isActive: true
        },
        {
          name: "Python",
          description: "Versatile programming language for development, data analysis, and automation.",
          iconKey: "Terminal",
          color: "from-blue-500",
          order: 1,
          isActive: true
        },
        {
          name: "Web Technologies",
          description: "HTML, CSS, and JavaScript for creating interactive web interfaces.",
          iconKey: "Layout",
          color: "from-emerald-600",
          order: 2,
          isActive: true
        },
        {
          name: "Machine Learning",
          description: "Python-based machine learning for data analysis and predictive modeling.",
          iconKey: "Brain",
          color: "from-purple-500",
          order: 3,
          isActive: true
        }
      ]);
      console.log('✅ Initial skills seeded');
    }

    console.log('✅ Database initialization complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
};

initializeData();

