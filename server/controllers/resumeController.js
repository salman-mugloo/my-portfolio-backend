import Resume from '../models/Resume.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import auditLogger from '../utils/auditLogger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Get active resume (public)
export const getResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ isActive: true })
      .select('-__v')
      .sort({ updatedAt: -1 });
    
    if (!resume) {
      return res.json({ fileUrl: null, title: null });
    }

    res.json({
      fileUrl: `/uploads/resume/${path.basename(resume.fileUrl)}`,
      title: resume.title,
      uploadedAt: resume.uploadedAt
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all resumes (admin)
export const getAllResumes = async (req, res) => {
  try {
    const resumes = await Resume.find().sort({ updatedAt: -1 });
    res.json(resumes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload/Update resume (admin)
export const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Deactivate all existing resumes
    await Resume.updateMany({}, { isActive: false });

    const { title } = req.body;

    // Delete old resume files if they exist
    const oldResumes = await Resume.find({ isActive: true });
    for (const oldResume of oldResumes) {
      if (oldResume.fileUrl) {
        const oldPath = path.join(__dirname, '..', oldResume.fileUrl);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
    }

    const resume = await Resume.create({
      fileUrl: req.file.path,
      title: title || 'Resume',
      isActive: true
    });

    // Log resume upload
    auditLogger.resumeUpload(req.adminId, req, { 
      resumeId: resume._id,
      title: resume.title,
      filename: path.basename(req.file.path),
      fileSize: req.file.size 
    });

    res.status(201).json(resume);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete resume (admin)
export const deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Delete file
    const deletedFileUrl = resume.fileUrl;
    if (resume.fileUrl) {
      const filePath = path.join(__dirname, '..', resume.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await resume.deleteOne();

    // Log resume delete
    auditLogger.resumeDelete(req.adminId, req, { 
      resumeId: req.params.id,
      deletedFileUrl 
    });

    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

