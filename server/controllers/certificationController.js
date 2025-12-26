import Certification from '../models/Certification.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Get all active certifications (public)
export const getCertifications = async (req, res) => {
  try {
    const certifications = await Certification.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .select('-__v');
    
    // Transform to match frontend structure
    const formatted = certifications.map((cert) => ({
      id: cert._id.toString(),
      title: cert.title,
      issuer: cert.issuer,
      image: cert.image ? `/uploads/certificates/${path.basename(cert.image)}` : null,
      pdf: cert.pdf ? `/uploads/certificates/${path.basename(cert.pdf)}` : null
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all certifications (admin)
export const getAllCertifications = async (req, res) => {
  try {
    const certifications = await Certification.find().sort({ order: 1, createdAt: 1 });
    res.json(certifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create certification (admin)
export const createCertification = async (req, res) => {
  try {
    const { title, issuer, order, isActive } = req.body;
    
    const imageFile = req.files?.image?.[0];
    const pdfFile = req.files?.pdf?.[0];

    const certification = await Certification.create({
      title,
      issuer,
      image: imageFile ? `/uploads/certificates/${path.basename(imageFile.path)}` : null,
      pdf: pdfFile ? `/uploads/certificates/${path.basename(pdfFile.path)}` : null,
      order: order !== undefined ? parseInt(order) : 0,
      isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : true
    });

    res.status(201).json(certification);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update certification (admin)
export const updateCertification = async (req, res) => {
  try {
    const certification = await Certification.findById(req.params.id);

    if (!certification) {
      return res.status(404).json({ message: 'Certification not found' });
    }

    const { title, issuer, order, isActive } = req.body;
    const imageFile = req.files?.image?.[0];
    const pdfFile = req.files?.pdf?.[0];

    // Delete old files if new ones are uploaded
    if (imageFile && certification.image) {
      const oldPath = path.join(__dirname, '..', certification.image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    if (pdfFile && certification.pdf) {
      const oldPath = path.join(__dirname, '..', certification.pdf);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    certification.title = title !== undefined ? title : certification.title;
    certification.issuer = issuer !== undefined ? issuer : certification.issuer;
    certification.image = imageFile ? `/uploads/certificates/${path.basename(imageFile.path)}` : certification.image;
    certification.pdf = pdfFile ? `/uploads/certificates/${path.basename(pdfFile.path)}` : certification.pdf;
    certification.order = order !== undefined ? parseInt(order) : certification.order;
    certification.isActive = isActive !== undefined ? (isActive === 'true' || isActive === true) : certification.isActive;

    const updated = await certification.save();
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete certification (admin)
export const deleteCertification = async (req, res) => {
  try {
    const certification = await Certification.findById(req.params.id);

    if (!certification) {
      return res.status(404).json({ message: 'Certification not found' });
    }

    // Delete associated files
    if (certification.image) {
      const imagePath = path.join(__dirname, '..', certification.image);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }
    if (certification.pdf) {
      const pdfPath = path.join(__dirname, '..', certification.pdf);
      if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
    }

    await certification.deleteOne();
    res.json({ message: 'Certification deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

