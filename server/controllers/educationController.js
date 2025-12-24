import Education from '../models/Education.js';

// @desc    Get all active education entries (public)
export const getEducation = async (req, res) => {
  try {
    const education = await Education.find({ isActive: true })
      .sort({ startYear: -1, endYear: -1 })
      .select('-__v');
    res.json(education);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all education entries (admin)
export const getAllEducation = async (req, res) => {
  try {
    const education = await Education.find()
      .sort({ startYear: -1, endYear: -1 });
    res.json(education);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create education entry (admin)
export const createEducation = async (req, res) => {
  try {
    const { degree, field, institution, startYear, endYear, description, isActive } = req.body;

    const education = await Education.create({
      degree,
      field,
      institution,
      startYear,
      endYear: endYear || null,
      description: description || '',
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json(education);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update education entry (admin)
export const updateEducation = async (req, res) => {
  try {
    const education = await Education.findById(req.params.id);

    if (!education) {
      return res.status(404).json({ message: 'Education entry not found' });
    }

    const { degree, field, institution, startYear, endYear, description, isActive } = req.body;

    education.degree = degree || education.degree;
    education.field = field || education.field;
    education.institution = institution || education.institution;
    education.startYear = startYear !== undefined ? startYear : education.startYear;
    education.endYear = endYear !== undefined ? (endYear || null) : education.endYear;
    education.description = description !== undefined ? description : education.description;
    education.isActive = isActive !== undefined ? isActive : education.isActive;

    const updated = await education.save();
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete education entry (admin)
export const deleteEducation = async (req, res) => {
  try {
    const education = await Education.findById(req.params.id);

    if (!education) {
      return res.status(404).json({ message: 'Education entry not found' });
    }

    await education.deleteOne();
    res.json({ message: 'Education entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

