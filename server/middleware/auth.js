import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

export const protect = async (req, res, next) => {
  // Defensive check: JWT_SECRET must be configured
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: 'Server configuration error' });
  }

  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (!decoded || !decoded.id) {
        return res.status(401).json({ message: 'Not authorized, invalid token' });
      }

      // Fetch admin from DB to check passwordChangedAt
      const admin = await Admin.findById(decoded.id);
      if (!admin) {
        return res.status(401).json({ message: 'Not authorized, admin not found' });
      }

      // Check if token was issued before password/username was changed
      if (admin.passwordChangedAt && decoded.iat) {
        const passwordChangedAtTimestamp = Math.floor(admin.passwordChangedAt.getTime() / 1000);
        if (decoded.iat < passwordChangedAtTimestamp) {
          return res.status(401).json({ message: 'Not authorized, token invalidated due to credential change' });
        }
      }
      
      req.adminId = decoded.id;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};
