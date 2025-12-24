import Profile from '../models/Profile.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import auditLogger from '../utils/auditLogger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Get profile (public)
export const getProfile = async (req, res) => {
  try {
    const profile = await Profile.getProfile();
    
    // Format profileImageUrl to be a relative URL path
    let profileImageUrl = null;
    if (profile.profileImageUrl) {
      // If it's already a relative path, use it; otherwise convert from absolute path
      if (profile.profileImageUrl.startsWith('/uploads/')) {
        profileImageUrl = profile.profileImageUrl;
      } else {
        // Extract the relative path from absolute path
        const relativePath = profile.profileImageUrl.replace(/^.*\/uploads\//, '/uploads/');
        profileImageUrl = relativePath;
      }
    }
    
    // Normalize fonts to ensure proper structure
    const normalizeFont = (font) => {
      if (!font) return { family: 'Inter', style: 'normal', weight: '400' };
      if (typeof font === 'string') return { family: font, style: 'normal', weight: '400' };
      if (typeof font === 'object') {
        return {
          family: font.family || 'Inter',
          style: font.style || 'normal',
          weight: font.weight || '400'
        };
      }
      return { family: 'Inter', style: 'normal', weight: '400' };
    };
    
    const normalizedFonts = profile.fonts ? {
      name: normalizeFont(profile.fonts.name),
      title: normalizeFont(profile.fonts.title),
      tagline: normalizeFont(profile.fonts.tagline),
      aboutText: normalizeFont(profile.fonts.aboutText)
    } : {
      name: { family: 'Inter', style: 'normal', weight: '400' },
      title: { family: 'Inter', style: 'normal', weight: '400' },
      tagline: { family: 'Inter', style: 'normal', weight: '400' },
      aboutText: { family: 'Inter', style: 'normal', weight: '400' }
    };
    
    console.log('Profile fonts being returned:', JSON.stringify(normalizedFonts, null, 2));
    
    // Remove sensitive/internal fields
    const profileData = {
      _id: profile._id,
      name: profile.name,
      title: profile.title,
      tagline: profile.tagline,
      aboutText: profile.aboutText,
      yearsExperience: profile.yearsExperience,
      projectsCount: profile.projectsCount,
      dedicationPercent: profile.dedicationPercent,
      profileImageUrl: profileImageUrl,
      resumeUrl: profile.resumeUrl,
      fonts: normalizedFonts,
      updatedAt: profile.updatedAt,
      createdAt: profile.createdAt
    };
    res.json(profileData);
  } catch (error) {
    console.error('Error in getProfile:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch profile' });
  }
};

// @desc    Update profile (admin)
export const updateProfile = async (req, res) => {
  try {
    const profile = await Profile.getProfile();
    
    const { name, title, tagline, aboutText, yearsExperience, projectsCount, dedicationPercent, fonts } = req.body;

    profile.name = name !== undefined ? name : profile.name;
    profile.title = title !== undefined ? title : profile.title;
    profile.tagline = tagline !== undefined ? tagline : profile.tagline;
    profile.aboutText = aboutText !== undefined ? aboutText : profile.aboutText;
    profile.yearsExperience = yearsExperience !== undefined ? parseInt(yearsExperience) : profile.yearsExperience;
    profile.projectsCount = projectsCount !== undefined ? parseInt(projectsCount) : profile.projectsCount;
    profile.dedicationPercent = dedicationPercent !== undefined ? parseInt(dedicationPercent) : profile.dedicationPercent;
    
    
    profile.updatedAt = Date.now();

    const updated = await profile.save();
    
    console.log('Profile saved. Fonts in saved document:', JSON.stringify(updated.fonts, null, 2));
    
    // Return properly formatted response
    const profileData = {
      _id: updated._id,
      name: updated.name,
      title: updated.title,
      tagline: updated.tagline,
      aboutText: updated.aboutText,
      yearsExperience: updated.yearsExperience,
      projectsCount: updated.projectsCount,
      dedicationPercent: updated.dedicationPercent,
      profileImageUrl: updated.profileImageUrl,
      fonts: updated.fonts || {
        name: { family: 'Inter', style: 'normal', weight: '400' },
        title: { family: 'Inter', style: 'normal', weight: '400' },
        tagline: { family: 'Inter', style: 'normal', weight: '400' },
        aboutText: { family: 'Inter', style: 'normal', weight: '400' }
      },
      updatedAt: updated.updatedAt,
      createdAt: updated.createdAt
    };
    
    res.json(profileData);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Upload profile image (admin)
export const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const profile = await Profile.getProfile();

    // Delete old image if exists
    if (profile.profileImageUrl) {
      const oldPath = path.join(__dirname, '..', profile.profileImageUrl);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Store relative path instead of absolute path
    const relativePath = `/uploads/profile/${path.basename(req.file.path)}`;
    profile.profileImageUrl = relativePath;
    profile.updatedAt = Date.now();
    await profile.save();

    // Log profile image upload
    auditLogger.profileImageUpload(req.adminId, req, { 
      filename: path.basename(req.file.path),
      fileSize: req.file.size 
    });

    res.json({
      message: 'Profile image uploaded successfully',
      profileImageUrl: relativePath
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


// @desc    Delete profile image (admin)
export const deleteProfileImage = async (req, res) => {
  try {
    const profile = await Profile.getProfile();

    // Delete image file if exists
    if (profile.profileImageUrl) {
      const imagePath = path.join(__dirname, '..', profile.profileImageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Remove profileImageUrl from database
    const deletedImageUrl = profile.profileImageUrl;
    profile.profileImageUrl = null;
    profile.updatedAt = Date.now();
    await profile.save();

    // Log profile image delete
    auditLogger.profileImageDelete(req.adminId, req, { 
      deletedImageUrl 
    });

    res.json({ message: 'Profile image deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Upload resume PDF (admin)
export const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Validate PDF
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ message: 'Only PDF files are allowed' });
    }

    const profile = await Profile.getProfile();

    // Delete old resume if exists
    if (profile.resumeUrl) {
      const oldPath = path.join(__dirname, '..', profile.resumeUrl);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Store relative path
    const relativePath = `/uploads/resume/${path.basename(req.file.path)}`;
    profile.resumeUrl = relativePath;
    profile.updatedAt = Date.now();
    await profile.save();

    res.json({
      message: 'Resume uploaded successfully',
      resumeUrl: relativePath
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete resume (admin)
export const deleteResume = async (req, res) => {
  try {
    const profile = await Profile.getProfile();

    // Delete resume file if exists
    if (profile.resumeUrl) {
      const resumePath = path.join(__dirname, '..', profile.resumeUrl);
      if (fs.existsSync(resumePath)) {
        fs.unlinkSync(resumePath);
      }
    }

    // Remove resumeUrl from database
    profile.resumeUrl = null;
    profile.updatedAt = Date.now();
    await profile.save();

    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
