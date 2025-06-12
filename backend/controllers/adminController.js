const Admin = require('../models/Admin');
const User = require('../models/User');
const validation = require('../utils/validation');
const jwt = require('../utils/jwt');
const config = require('../config/config');
const crypto = require('crypto');

class AdminController {
  /**
   * Setup super admin (one-time setup)
   */
  async setupSuperAdmin(req, res) {
    try {
      // Check if super admin already exists
      const existingSuperAdmin = await Admin.findOne({ role: 'super_admin' });
      if (existingSuperAdmin) {
        return res.status(400).json({
          success: false,
          message: 'Super admin already exists'
        });
      }

      // Validate setup key
      const { setupKey, username, email, password, firstName, lastName } = req.body;
      
      if (setupKey !== config.superAdmin.setupKey) {
        return res.status(403).json({
          success: false,
          message: 'Invalid setup key'
        });
      }

      // Validate input
      if (!username || !email || !password || !firstName || !lastName) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required'
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters long'
        });
      }

      // Create super admin
      const superAdmin = new Admin({
        username: config.superAdmin.username,
        email: config.superAdmin.email,
        password,
        profile: {
          firstName,
          lastName
        },
        role: 'super_admin',
        status: {
          isActive: true,
          emailVerified: true
        },
        createdBy: null // Super admin is self-created
      });

      await superAdmin.save();

      res.status(201).json({
        success: true,
        message: 'Super admin created successfully',
        data: {
          adminId: superAdmin._id,
          username: superAdmin.username,
          email: superAdmin.email,
          role: superAdmin.role,
          createdAt: superAdmin.createdAt
        }
      });

    } catch (error) {
      console.error('Super admin setup error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to setup super admin',
        error: error.message
      });
    }
  }

  /**
   * Admin login
   */
  async login(req, res) {
    try {
      const { error, value } = validation.validateAdminLogin(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.formatValidationErrors(error)
        });
      }

      const { identifier, password, deviceId, deviceName } = value;

      // Find admin by username or email
      const admin = await Admin.findOne({
        $or: [
          { username: identifier },
          { email: identifier }
        ]
      });

      if (!admin) {
        return res.status(400).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      if (admin.isAccountLocked()) {
        return res.status(400).json({
          success: false,
          message: 'Account is temporarily locked due to too many failed login attempts'
        });
      }

      if (!admin.status.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Account is deactivated. Please contact super admin.'
        });
      }

      const isValidPassword = await admin.comparePassword(password);
      if (!isValidPassword) {
        await admin.incrementLoginAttempts();
        return res.status(400).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      await admin.resetLoginAttempts();

      // Generate session ID
      const sessionId = crypto.randomUUID();

      // Generate token pair
      const tokenPair = jwt.generateAdminTokenPair(admin, deviceId, sessionId);

      // Create session
      await admin.createSession(
        sessionId,
        tokenPair.accessToken,
        deviceId,
        deviceName,
        req.deviceInfo?.ipAddress,
        req.deviceInfo?.userAgent,
        tokenPair.accessTokenExpiry
      );

      await admin.updateLastLogin(req.deviceInfo?.ipAddress, req.deviceInfo?.userAgent);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          admin: {
            id: admin._id,
            username: admin.username,
            email: admin.email,
            firstName: admin.profile.firstName,
            lastName: admin.profile.lastName,
            role: admin.role,
            emailVerified: admin.status.emailVerified
          },
          tokens: {
            accessToken: tokenPair.accessToken,
            refreshToken: tokenPair.refreshToken,
            tokenType: tokenPair.tokenType,
            expiresIn: tokenPair.accessTokenExpiry,
            sessionId: tokenPair.sessionId
          },
          deviceId,
          loginAt: new Date()
        }
      });

    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error.message
      });
    }
  }

  /**
   * Admin logout
   */
  async logout(req, res) {
    try {
      const sessionId = req.sessionId;
      await req.admin.terminateSession(sessionId);

      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });

    } catch (error) {
      console.error('Admin logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed',
        error: error.message
      });
    }
  }

  /**
   * Create new admin/support user (super admin only)
   */
  async createAdmin(req, res) {
    try {
      // Check if user can manage admins
      if (!req.admin.canManageAdmins()) {
        return res.status(403).json({
          success: false,
          message: 'Only super admin can create admin users'
        });
      }

      const { error, value } = validation.validateAdminCreation(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.formatValidationErrors(error)
        });
      }

      const { username, email, password, firstName, lastName, role } = value;

      // Check if admin already exists
      const existingAdmin = await Admin.findOne({
        $or: [
          { username },
          { email }
        ]
      });

      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: 'Admin with this username or email already exists'
        });
      }

      // Only super admin can create other super admins
      if (role === 'super_admin' && req.admin.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Only super admin can create other super admins'
        });
      }

      // Create new admin
      const newAdmin = new Admin({
        username,
        email,
        password,
        profile: {
          firstName,
          lastName
        },
        role,
        status: {
          isActive: true,
          emailVerified: false // Admin needs to verify email
        },
        createdBy: req.admin._id
      });

      await newAdmin.save();

      res.status(201).json({
        success: true,
        message: 'Admin user created successfully',
        data: {
          adminId: newAdmin._id,
          username: newAdmin.username,
          email: newAdmin.email,
          role: newAdmin.role,
          createdAt: newAdmin.createdAt,
          createdBy: {
            id: req.admin._id,
            username: req.admin.username
          }
        }
      });

    } catch (error) {
      console.error('Create admin error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create admin user',
        error: error.message
      });
    }
  }

  /**
   * Get all admin users
   */
  async getAdmins(req, res) {
    try {
      // Check if user can manage admins
      if (!req.admin.canManageAdmins()) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to view admin users'
        });
      }

      const { page = 1, limit = 10, role, status, search } = req.query;
      const skip = (page - 1) * limit;

      // Build filter
      const filter = {};
      if (role) filter.role = role;
      if (status) filter['status.isActive'] = status === 'active';
      if (search) {
        filter.$or = [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { 'profile.firstName': { $regex: search, $options: 'i' } },
          { 'profile.lastName': { $regex: search, $options: 'i' } }
        ];
      }

      const admins = await Admin.find(filter)
        .select('-password -sessions')
        .populate('createdBy', 'username email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Admin.countDocuments(filter);

      res.status(200).json({
        success: true,
        message: 'Admin users retrieved successfully',
        data: {
          admins,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get admins error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve admin users',
        error: error.message
      });
    }
  }

  /**
   * Reset admin password (Super Admin and Admin only)
   */
  async resetAdminPassword(req, res) {
    try {
      // Check if user can manage admins (super admin) or manage users (admin)
      if (!req.admin.canManageAdmins() && !req.admin.canManageUsers()) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to reset admin passwords'
        });
      }

      const { adminId } = req.params;
      const { newPassword, reason } = req.body;

      // Validate input
      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 8 characters long'
        });
      }

      if (!reason || reason.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Reason for password reset is required'
        });
      }

      // Find the admin to reset password for
      const targetAdmin = await Admin.findById(adminId);
      if (!targetAdmin) {
        return res.status(404).json({
          success: false,
          message: 'Admin user not found'
        });
      }

      // Permission checks based on roles
      if (req.admin.role === 'admin') {
        // Admin can only reset passwords for support users, not other admins or super admins
        if (targetAdmin.role !== 'support') {
          return res.status(403).json({
            success: false,
            message: 'Admin users can only reset passwords for support users'
          });
        }
      } else if (req.admin.role === 'super_admin') {
        // Super admin can reset passwords for anyone except themselves
        if (targetAdmin._id.toString() === req.admin._id.toString()) {
          return res.status(400).json({
            success: false,
            message: 'Cannot reset your own password. Contact another super admin.'
          });
        }
      } else {
        // Support users cannot reset any passwords
        return res.status(403).json({
          success: false,
          message: 'Support users cannot reset passwords'
        });
      }

      // Update admin password
      targetAdmin.password = newPassword;
      
      // Terminate all active sessions for the target admin
      await targetAdmin.terminateAllSessions();

      // Save the admin record
      await targetAdmin.save();

      res.status(200).json({
        success: true,
        message: 'Admin password reset successfully',
        data: {
          adminId: targetAdmin._id,
          username: targetAdmin.username,
          email: targetAdmin.email,
          role: targetAdmin.role,
          passwordResetAt: targetAdmin.security.lastPasswordChangeAt,
          resetBy: {
            id: req.admin._id,
            username: req.admin.username,
            role: req.admin.role
          },
          reason: reason.trim(),
          sessionsTerminated: true
        }
      });

    } catch (error) {
      console.error('Reset admin password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reset admin password',
        error: error.message
      });
    }
  }

  /**
   * Update admin status (activate/deactivate)
   */
  async updateAdminStatus(req, res) {
    try {
      // Only super admin can update admin status
      if (!req.admin.canManageAdmins()) {
        return res.status(403).json({
          success: false,
          message: 'Only super admin can update admin status'
        });
      }

      const { adminId } = req.params;
      const { isActive, reason } = req.body;

      const targetAdmin = await Admin.findById(adminId);
      if (!targetAdmin) {
        return res.status(404).json({
          success: false,
          message: 'Admin user not found'
        });
      }

      // Cannot deactivate yourself
      if (targetAdmin._id.toString() === req.admin._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Cannot deactivate your own account'
        });
      }

      // Cannot deactivate other super admins unless you are super admin
      if (targetAdmin.role === 'super_admin' && req.admin.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Cannot modify super admin accounts'
        });
      }

      targetAdmin.status.isActive = isActive;
      if (!isActive) {
        targetAdmin.status.deactivatedAt = new Date();
        targetAdmin.status.deactivatedReason = reason;
        // Terminate all sessions if deactivating
        await targetAdmin.terminateAllSessions();
      } else {
        targetAdmin.status.deactivatedAt = undefined;
        targetAdmin.status.deactivatedReason = undefined;
      }

      await targetAdmin.save();

      res.status(200).json({
        success: true,
        message: `Admin ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: {
          adminId: targetAdmin._id,
          username: targetAdmin.username,
          email: targetAdmin.email,
          role: targetAdmin.role,
          status: targetAdmin.status,
          updatedBy: {
            id: req.admin._id,
            username: req.admin.username
          }
        }
      });

    } catch (error) {
      console.error('Update admin status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update admin status',
        error: error.message
      });
    }
  }

  /**
   * Get students (admin view)
   */
  async getStudents(req, res) {
    try {
      // Check if user can manage users
      if (!req.admin.canManageUsers()) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to view students'
        });
      }

      const { page = 1, limit = 10, status, verified, search } = req.query;
      const skip = (page - 1) * limit;

      // Build filter
      const filter = { role: 'student' };
      if (status) filter['status.isActive'] = status === 'active';
      if (verified) filter.mobileVerified = verified === 'true';
      if (search) {
        filter.$or = [
          { mobileNumber: { $regex: search, $options: 'i' } },
          { 'profile.firstName': { $regex: search, $options: 'i' } },
          { 'profile.lastName': { $regex: search, $options: 'i' } }
        ];
      }

      const students = await User.find(filter)
        .select('-password -security.currentSession')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await User.countDocuments(filter);

      // Get statistics
      const stats = await User.getStudentStats();

      res.status(200).json({
        success: true,
        message: 'Students retrieved successfully',
        data: {
          students,
          statistics: stats,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get students error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve students',
        error: error.message
      });
    }
  }

  /**
   * Update student status (activate/deactivate)
   */
  async updateStudentStatus(req, res) {
    try {
      // Check if user can manage users
      if (!req.admin.canManageUsers()) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to update student status'
        });
      }

      const { studentId } = req.params;
      const { isActive, reason } = req.body;

      const student = await User.findById(studentId);
      if (!student || student.role !== 'student') {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      student.status.isActive = isActive;
      if (!isActive) {
        student.status.deactivatedAt = new Date();
        student.status.deactivatedReason = reason;
        // Clear current session if deactivating
        await student.clearCurrentSession();
      } else {
        student.status.deactivatedAt = undefined;
        student.status.deactivatedReason = undefined;
      }

      await student.save();

      res.status(200).json({
        success: true,
        message: `Student ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: {
          studentId: student._id,
          mobileNumber: student.mobileNumber,
          name: student.fullName,
          status: student.status,
          updatedBy: {
            id: req.admin._id,
            username: req.admin.username
          }
        }
      });

    } catch (error) {
      console.error('Update student status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update student status',
        error: error.message
      });
    }
  }

  /**
   * Get admin profile
   */
  async getProfile(req, res) {
    try {
      res.status(200).json({
        success: true,
        message: 'Admin profile retrieved successfully',
        data: {
          admin: {
            id: req.admin._id,
            username: req.admin.username,
            email: req.admin.email,
            profile: req.admin.profile,
            role: req.admin.role,
            status: req.admin.status,
            security: {
              lastLoginAt: req.admin.security.lastLoginAt,
              lastLoginIP: req.admin.security.lastLoginIP,
              activeSessions: req.admin.sessions.filter(s => s.isActive).length
            },
            capabilities: {
              canManageUsers: req.admin.canManageUsers(),
              canManageAdmins: req.admin.canManageAdmins(),
              canManageCourses: req.admin.canManageCourses(),
              canViewAnalytics: req.admin.canViewAnalytics(),
              canManageSettings: req.admin.canManageSettings(),
              canManageSystem: req.admin.canManageSystem()
            },
            createdAt: req.admin.createdAt,
            updatedAt: req.admin.updatedAt
          }
        }
      });

    } catch (error) {
      console.error('Get admin profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve admin profile',
        error: error.message
      });
    }
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(req, res) {
    try {
      // Check if user can view analytics
      if (!req.admin.canViewAnalytics()) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to view dashboard statistics'
        });
      }

      // Get student statistics
      const studentStats = await User.getStudentStats();

      // Get admin statistics (only if can manage admins)
      let adminStats = null;
      if (req.admin.canManageAdmins()) {
        adminStats = await Admin.getAdminStats();
      }

      res.status(200).json({
        success: true,
        message: 'Dashboard statistics retrieved successfully',
        data: {
          students: studentStats,
          ...(adminStats && { admins: adminStats }),
          lastUpdated: new Date()
        }
      });

    } catch (error) {
      console.error('Get dashboard stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve dashboard statistics',
        error: error.message
      });
    }
  }
}

module.exports = new AdminController(); 