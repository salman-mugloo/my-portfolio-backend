import ContactInfo, { CONTACT_TYPES } from '../models/ContactInfo.js';

// @desc    Get contact info (public)
export const getContactInfo = async (req, res) => {
  try {
    const contactInfo = await ContactInfo.getContactInfo();
    res.json(contactInfo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get contact info (admin)
export const getContactInfoAdmin = async (req, res) => {
  try {
    const contactInfo = await ContactInfo.getContactInfo();
    res.json(contactInfo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update contact info (admin)
export const updateContactInfo = async (req, res) => {
  try {
    const { description, email, contacts, connectTitle, connectDescription } = req.body;
    
    // Validate contacts
    if (contacts) {
      if (contacts.length > 5) {
        return res.status(400).json({ message: 'Maximum 5 contact links allowed' });
      }
      
      const types = contacts.map(c => c.type);
      const uniqueTypes = new Set(types);
      if (types.length !== uniqueTypes.size) {
        return res.status(400).json({ message: 'Duplicate contact types are not allowed' });
      }
      
      // Validate each contact
      for (const contact of contacts) {
        if (!CONTACT_TYPES.includes(contact.type)) {
          return res.status(400).json({ message: `Invalid contact type: ${contact.type}` });
        }
        if (!contact.url || !contact.url.trim()) {
          return res.status(400).json({ message: 'Contact URL is required' });
        }
      }
    }
    
    let contactInfo = await ContactInfo.findOne();
    
    if (!contactInfo) {
      // Create if doesn't exist
      contactInfo = await ContactInfo.create(req.body);
    } else {
      // Update existing
      if (description !== undefined) contactInfo.description = description;
      if (email !== undefined) contactInfo.email = email;
      if (contacts !== undefined) contactInfo.contacts = contacts;
      if (connectTitle !== undefined) contactInfo.connectTitle = connectTitle;
      if (connectDescription !== undefined) contactInfo.connectDescription = connectDescription;
      
      await contactInfo.save();
    }

    res.json(contactInfo);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

