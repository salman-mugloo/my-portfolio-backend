import Feature from '../models/Feature.js';

// Icon mapping for frontend
const iconMap = {
  'Code': 'Code',
  'ShieldCheck': 'ShieldCheck',
  'Activity': 'Activity',
  'Users': 'Users'
};

// @desc    Get all active features (public)
export const getFeatures = async (req, res) => {
  try {
    const features = await Feature.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .select('-__v');
    
    // Transform to match frontend structure
    const formatted = features.map((feature) => ({
      icon: iconMap[feature.icon] || 'Code',
      label: feature.label,
      tooltip: feature.tooltip
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all features (admin)
export const getAllFeatures = async (req, res) => {
  try {
    const features = await Feature.find().sort({ order: 1, createdAt: 1 });
    res.json(features);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create feature (admin)
export const createFeature = async (req, res) => {
  try {
    const { label, tooltip, icon, order, isActive } = req.body;

    const feature = await Feature.create({
      label,
      tooltip,
      icon: icon || 'Code',
      order: order !== undefined ? order : 0,
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json(feature);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update feature (admin)
export const updateFeature = async (req, res) => {
  try {
    const feature = await Feature.findById(req.params.id);

    if (!feature) {
      return res.status(404).json({ message: 'Feature not found' });
    }

    const { label, tooltip, icon, order, isActive } = req.body;

    feature.label = label || feature.label;
    feature.tooltip = tooltip || feature.tooltip;
    feature.icon = icon || feature.icon;
    feature.order = order !== undefined ? order : feature.order;
    feature.isActive = isActive !== undefined ? isActive : feature.isActive;

    const updated = await feature.save();
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete feature (admin)
export const deleteFeature = async (req, res) => {
  try {
    const feature = await Feature.findById(req.params.id);

    if (!feature) {
      return res.status(404).json({ message: 'Feature not found' });
    }

    await feature.deleteOne();
    res.json({ message: 'Feature deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

