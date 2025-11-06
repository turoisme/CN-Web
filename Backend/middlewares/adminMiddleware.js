// Check if user is admin
exports.isAdmin = (req, res, next) => {
  try {
    // Check if user exists (from authMiddleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. Please login first.'
      });
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error in authorization',
      error: error.message
    });
  }
};

// Check if user is admin or owner of resource
exports.isAdminOrOwner = (resourceField = 'user') => {
  return (req, res, next) => {
    try {
      // Check if user exists
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized. Please login first.'
        });
      }

      // Admin can access everything
      if (req.user.role === 'admin') {
        return next();
      }

      // Check if user is the owner
      const resourceUserId = req.resource ? req.resource[resourceField] : null;
      
      if (resourceUserId && resourceUserId.toString() === req.user._id.toString()) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Server error in authorization',
        error: error.message
      });
    }
  };
};