import Skill from '../models/Skill.js';

// Icon mapping for frontend
const iconMap = {
  'Code': 'Code',
  'Terminal': 'Terminal',
  'Layout': 'Layout',
  'Brain': 'Brain',
  'Server': 'Server',
  'Database': 'Database'
};

// @desc    Get all active skills (public)
export const getSkills = async (req, res) => {
  try {
    const skills = await Skill.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .select('-__v');
    
    // Transform to match frontend structure
    const formatted = skills.map((skill) => ({
      title: skill.name,
      desc: skill.description,
      icon: iconMap[skill.iconKey] || 'Code',
      color: skill.color
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all skills (admin)
export const getAllSkills = async (req, res) => {
  try {
    const skills = await Skill.find().sort({ order: 1, createdAt: 1 });
    res.json(skills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create skill (admin)
export const createSkill = async (req, res) => {
  try {
    const { name, description, iconKey, color, order, isActive } = req.body;

    const skill = await Skill.create({
      name,
      description,
      iconKey,
      color: color || 'from-emerald-500',
      order: order !== undefined ? order : 0,
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json(skill);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update skill (admin)
export const updateSkill = async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);

    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    const { name, description, iconKey, color, order, isActive } = req.body;

    skill.name = name || skill.name;
    skill.description = description || skill.description;
    skill.iconKey = iconKey || skill.iconKey;
    skill.color = color || skill.color;
    skill.order = order !== undefined ? order : skill.order;
    skill.isActive = isActive !== undefined ? isActive : skill.isActive;

    const updated = await skill.save();
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete skill (admin)
export const deleteSkill = async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);

    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    await skill.deleteOne();
    res.json({ message: 'Skill deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

