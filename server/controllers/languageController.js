import Language from '../models/Language.js';
import auditLogger from '../utils/auditLogger.js';

// @desc    Get all active languages (public)
export const getLanguages = async (req, res) => {
  try {
    const languages = await Language.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .select('-__v');
    
    res.json(languages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all languages (admin)
export const getAllLanguages = async (req, res) => {
  try {
    const languages = await Language.find().sort({ order: 1, createdAt: 1 });
    res.json(languages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create language (admin)
export const createLanguage = async (req, res) => {
  try {
    const { name, proficiency, order, isActive } = req.body;
    
    if (!name || !proficiency) {
      return res.status(400).json({ message: 'Name and proficiency are required' });
    }

    const language = await Language.create({
      name: name.trim(),
      proficiency: proficiency.trim(),
      order: order !== undefined ? parseInt(order) : 0,
      isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : true
    });

    // Log language create
    auditLogger.languageCreate(req.adminId, req, {
      languageId: language._id,
      name: language.name,
      proficiency: language.proficiency
    });

    res.status(201).json(language);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update language (admin)
export const updateLanguage = async (req, res) => {
  try {
    const language = await Language.findById(req.params.id);

    if (!language) {
      return res.status(404).json({ message: 'Language not found' });
    }

    const { name, proficiency, order, isActive } = req.body;

    const oldData = {
      name: language.name,
      proficiency: language.proficiency,
      order: language.order,
      isActive: language.isActive
    };

    if (name !== undefined) language.name = name.trim();
    if (proficiency !== undefined) language.proficiency = proficiency.trim();
    if (order !== undefined) language.order = parseInt(order);
    if (isActive !== undefined) language.isActive = (isActive === 'true' || isActive === true);

    const updated = await language.save();

    // Log language update
    auditLogger.languageUpdate(req.adminId, req, {
      languageId: language._id,
      oldData,
      newData: {
        name: updated.name,
        proficiency: updated.proficiency,
        order: updated.order,
        isActive: updated.isActive
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete language (admin)
export const deleteLanguage = async (req, res) => {
  try {
    const language = await Language.findById(req.params.id);

    if (!language) {
      return res.status(404).json({ message: 'Language not found' });
    }

    const deletedData = {
      languageId: language._id,
      name: language.name,
      proficiency: language.proficiency
    };

    await language.deleteOne();

    // Log language delete
    auditLogger.languageDelete(req.adminId, req, deletedData);

    res.json({ message: 'Language deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

