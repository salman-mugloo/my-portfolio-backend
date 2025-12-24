import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    default: 'Salman Mugloo '
  },
  title: {
    type: String,
    required: true,
    trim: true,
    default: 'Software Developer & AI/ML Enthusiast'
  },
  tagline: {
    type: String,
    required: true,
    trim: true,
    default: 'Building innovative solutions with programming and Machine Learning.'
  },
  aboutText: {
    type: String,
    required: true,
    default: "I'm a passionate software developer with a strong foundation in computer science and a love for creating innovative digital solutions. Currently pursuing my BCA degree, I combine academic knowledge with hands-on experience in programming and machine learning.\n\nMy journey in software development has equipped me with expertise in programming languages like Java and Python, web technologies, and machine learning. I thrive on solving complex problems and turning ideas into reality through code, especially in AI and data analysis."
  },
  yearsExperience: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  projectsCount: {
    type: Number,
    required: true,
    default: 50,
    min: 0
  },
  dedicationPercent: {
    type: Number,
    required: true,
    default: 100,
    min: 0,
    max: 100
  },
  profileImageUrl: {
    type: String,
    default: null
  },
  resumeUrl: {
    type: String,
    default: null
  },
  fonts: {
    name: {
      family: {
        type: String,
        default: 'Inter'
      },
      style: {
        type: String,
        default: 'normal',
        enum: ['normal', 'italic']
      },
      weight: {
        type: String,
        default: '400',
        enum: ['100', '200', '300', '400', '500', '600', '700', '800', '900']
      }
    },
    title: {
      family: {
        type: String,
        default: 'Inter'
      },
      style: {
        type: String,
        default: 'normal',
        enum: ['normal', 'italic']
      },
      weight: {
        type: String,
        default: '400',
        enum: ['100', '200', '300', '400', '500', '600', '700', '800', '900']
      }
    },
    tagline: {
      family: {
        type: String,
        default: 'Inter'
      },
      style: {
        type: String,
        default: 'normal',
        enum: ['normal', 'italic']
      },
      weight: {
        type: String,
        default: '400',
        enum: ['100', '200', '300', '400', '500', '600', '700', '800', '900']
      }
    },
    aboutText: {
      family: {
        type: String,
        default: 'Inter'
      },
      style: {
        type: String,
        default: 'normal',
        enum: ['normal', 'italic']
      },
      weight: {
        type: String,
        default: '400',
        enum: ['100', '200', '300', '400', '500', '600', '700', '800', '900']
      }
    }
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure only one profile document exists
profileSchema.statics.getProfile = async function() {
  try {
    let profile = await this.findOne();
    if (!profile) {
      profile = await this.create({});
    }
    return profile;
  } catch (error) {
    console.error('Error in Profile.getProfile:', error);
    throw error;
  }
};

export default mongoose.model('Profile', profileSchema);

