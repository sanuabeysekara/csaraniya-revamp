const jwt = require('../utils/jwt');
const User = require('../models/User');
const Admin = require('../models/Admin');

/**
 * Student authentication middleware
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const token = authHeader.substring(7);
    
    // Verify token
    const decoded = jwt.verifyAccessToken(token);
    
    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is active
    if (!user.status.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check if user is verified
    if (!user.mobileVerified) {
      return res.status(401).json({
        success: false,
        message: 'Mobile number not verified'
      });
    }

    // Validate session
    if (!user.validateSession(token, decoded.deviceId)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session. Please login again.'
      });
    }

    // Update last active time
    user.status.lastActiveAt = new Date();
    await user.save();

    req.user = user;
    req.deviceId = decoded.deviceId;
    req.deviceInfo = {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

/**
 * Admin authentication middleware
 */
const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const token = authHeader.substring(7);
    
    // Verify admin token
    const decoded = jwt.verifyAdminAccessToken(token);
    
    // Find admin
    const admin = await Admin.findById(decoded.adminId);
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Check if admin is active
    if (!admin.status.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Admin account is deactivated'
      });
    }

    // Validate session
    const session = admin.sessions.find(s => 
      s.sessionId === decoded.sessionId && 
      s.isActive && 
      s.expiresAt > new Date()
    );

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session. Please login again.'
      });
    }

    // Update session last activity
    session.lastActivityAt = new Date();
    admin.security.lastActiveAt = new Date();
    await admin.save();

    req.admin = admin;
    req.sessionId = decoded.sessionId;
    req.deviceId = decoded.deviceId;
    req.deviceInfo = {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };
    
    next();
  } catch (error) {
    console.error('Admin authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired admin token'
    });
  }
};

/**
 * Role-based authorization middleware for admins
 */
const requireAdminRole = (roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin authentication required'
      });
    }

    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

/**
 * Permission-based authorization middleware for admins
 */
const requirePermission = (resource, action) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin authentication required'
      });
    }

    if (!req.admin.hasPermission(resource, action)) {
      return res.status(403).json({
        success: false,
        message: `Insufficient permissions for ${action} on ${resource}`
      });
    }

    next();
  };
};

/**
 * Super admin only middleware
 */
const requireSuperAdmin = (req, res, next) => {
  if (!req.admin || req.admin.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Super admin access required'
    });
  }
  next();
};

/**
 * Optional authentication middleware (for public endpoints that can benefit from user context)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // No token provided, continue without authentication
    }

    const token = authHeader.substring(7);
    
    try {
      // Try to verify as student token first
      if (jwt.isStudentToken(token)) {
        const decoded = jwt.verifyAccessToken(token);
        const user = await User.findById(decoded.userId);
        
        if (user && user.status.isActive && user.mobileVerified) {
          req.user = user;
          req.deviceId = decoded.deviceId;
        }
      } else if (jwt.isAdminToken(token)) {
        const decoded = jwt.verifyAdminAccessToken(token);
        const admin = await Admin.findById(decoded.adminId);
        
        if (admin && admin.status.isActive) {
          req.admin = admin;
          req.sessionId = decoded.sessionId;
          req.deviceId = decoded.deviceId;
        }
      }
    } catch (error) {
      // Token verification failed, continue without authentication
      console.log('Optional auth token verification failed:', error.message);
    }

    req.deviceInfo = {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };
    
    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    next(); // Continue without authentication on error
  }
};

module.exports = {
  authenticate,
  authenticateAdmin,
  requireAdminRole,
  requirePermission,
  requireSuperAdmin,
  optionalAuth
}; 