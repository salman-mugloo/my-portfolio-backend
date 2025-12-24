import AdminActivity from '../models/AdminActivity.js';

// @desc    Get activity logs with pagination (admin)
export const getActivityLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (req.query.action) {
      filter.action = req.query.action;
    }
    if (req.query.adminId) {
      filter.adminId = req.query.adminId;
    }

    // Get total count for pagination
    const total = await AdminActivity.countDocuments(filter);

    // Get activity logs with pagination
    // Use populate with error handling in case Admin model doesn't exist or reference fails
    let activities;
    try {
      activities = await AdminActivity.find(filter)
        .populate('adminId', 'username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    } catch (populateError) {
      // If populate fails, try without populate
      console.warn('Populate failed, fetching without populate:', populateError.message);
      activities = await AdminActivity.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    }

    // Format response
    const formattedActivities = activities.map(activity => {
      // Handle both populated and non-populated adminId
      let adminUsername = 'Unknown';
      let adminId = activity.adminId;
      
      if (activity.adminId && typeof activity.adminId === 'object') {
        // Populated
        adminId = activity.adminId._id || activity.adminId;
        adminUsername = activity.adminId.username || 'Unknown';
      } else if (activity.adminId) {
        // Just ObjectId
        adminId = activity.adminId;
      }

      return {
        _id: activity._id,
        adminId: adminId,
        adminUsername: adminUsername,
        action: activity.action,
        metadata: activity.metadata || {},
        ipAddress: activity.ipAddress || null,
        userAgent: activity.userAgent || null,
        createdAt: activity.createdAt
      };
    });

    res.json({
      activities: formattedActivities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    // Ensure we always return JSON, not HTML
    // Set content-type explicitly to prevent HTML error pages
    res.status(500).setHeader('Content-Type', 'application/json').json({ 
      message: error.message || 'Failed to fetch activity logs',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

