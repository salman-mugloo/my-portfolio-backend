import Expertise from '../models/Expertise.js';

// Icon mapping for frontend
const iconMap = {
  'Code': 'Code',
  'Layout': 'Layout',
  'Brain': 'Brain',
  'Terminal': 'Terminal',
  'Server': 'Server',
  'Database': 'Database'
};

// @desc    Get all active expertise (public)
export const getExpertise = async (req, res) => {
  try {
    const expertiseList = await Expertise.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .select('-__v');
    
    // Transform to match frontend structure
    const formatted = expertiseList.map((item) => ({
      title: item.title,
      icon: iconMap[item.iconKey] || 'Code',
      desc: item.description,
      capabilities: item.points
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all expertise (admin)
export const getAllExpertise = async (req, res) => {
  try {
    const expertise = await Expertise.find().sort({ order: 1, createdAt: 1 });
    res.json(expertise);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create expertise (admin)
export const createExpertise = async (req, res) => {
  try {
    const { title, description, points, iconKey, order, isActive } = req.body;

    const expertise = await Expertise.create({
      title,
      description,
      points: Array.isArray(points) ? points : [],
      iconKey,
      order: order !== undefined ? order : 0,
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json(expertise);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update expertise (admin)
export const updateExpertise = async (req, res) => {
  try {
    const expertise = await Expertise.findById(req.params.id);

    if (!expertise) {
      return res.status(404).json({ message: 'Expertise not found' });
    }

    const { title, description, points, iconKey, order, isActive } = req.body;

    expertise.title = title || expertise.title;
    expertise.description = description || expertise.description;
    expertise.points = Array.isArray(points) ? points : expertise.points;
    expertise.iconKey = iconKey || expertise.iconKey;
    expertise.order = order !== undefined ? order : expertise.order;
    expertise.isActive = isActive !== undefined ? isActive : expertise.isActive;

    const updated = await expertise.save();
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete expertise (admin)
export const deleteExpertise = async (req, res) => {
  try {
    const expertise = await Expertise.findById(req.params.id);

    if (!expertise) {
      return res.status(404).json({ message: 'Expertise not found' });
    }

    await expertise.deleteOne();
    res.json({ message: 'Expertise deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

