import mongoose from 'mongoose';

// Supported contact types
export const CONTACT_TYPES = ['github', 'linkedin', 'leetcode', 'instagram', 'codeforces'];

const contactLinkSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: CONTACT_TYPES,
    required: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: false });

const contactInfoSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true
  },
  contacts: {
    type: [contactLinkSchema],
    default: [],
    validate: {
      validator: function(contacts) {
        // Max 5 contacts
        if (contacts.length > 5) return false;
        // Unique types
        const types = contacts.map(c => c.type);
        return types.length === new Set(types).size;
      },
      message: 'Maximum 5 contacts allowed and each type must be unique'
    }
  },
  connectTitle: {
    type: String,
    required: true,
    trim: true,
    default: "Let's Connect"
  },
  connectDescription: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// Ensure only one contact info document exists
contactInfoSchema.statics.getContactInfo = async function() {
  let contactInfo = await this.findOne();
  if (!contactInfo) {
    contactInfo = await this.create({
      description: "I'm always open to discussing new projects, creative ideas, or opportunities to be part of your vision.",
      email: "mugloosalman@gmail.com",
      contacts: [
        { type: 'github', url: 'https://github.com/salman-mugloo/' },
        { type: 'linkedin', url: 'https://www.linkedin.com/in/salman-mugloo-/' }
      ],
      connectTitle: "Let's Connect",
      connectDescription: "Whether you have a question or just want to say hi, I'll try my best to get back to you!"
    });
  }
  return contactInfo;
};

export default mongoose.model('ContactInfo', contactInfoSchema);

