const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/config');

const adminSchema = new mongoose.Schema({
  // Authentication
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    match: /^[a-zA-Z0-9_]+$/
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },

  // Profile Information
  profile: {
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    profilePicture: {
      type: String,
      default: null
    }
  },

  // Role - Simple role-based access
  role: {
    type: String,
    required: true,
    enum: ['super_admin', 'admin', 'support'],
    default: 'support'
  },

  // Account Status
  status: {
    isActive: {
      type: Boolean,
      default: true
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    emailVerifiedAt: Date,
    lastActiveAt: {
      type: Date,
      default: Date.now
    },
    deactivatedAt: Date,
    deactivatedReason: String
  },

  // Security
  security: {
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: Date,
    lastLoginAt: Date,
    lastLoginIP: String,
    lastPasswordChangeAt: Date
  },

  // Session Management
  sessions: [{
    sessionId: {
      type: String,
      required: true
    },
    token: String,
    deviceId: String,
    deviceName: String,
    ipAddress: String,
    userAgent: String,
    issuedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: Date,
    lastActivityAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],

  // Audit Trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.sessions;
      return ret;
    }
  }
});

// Indexes
adminSchema.index({ username: 1 });
adminSchema.index({ email: 1 });
adminSchema.index({ role: 1 });
adminSchema.index({ 'status.isActive': 1 });
adminSchema.index({ 'security.lockUntil': 1 });

// Virtual for full name
adminSchema.virtual('fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

// Pre-save middleware to hash password
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(config.security.bcryptSaltRounds);
    this.password = await bcrypt.hash(this.password, salt);
    this.security.lastPasswordChangeAt = new Date();
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to check if account is locked
adminSchema.methods.isAccountLocked = function() {
  return !!(this.security.lockUntil && this.security.lockUntil > Date.now());
};

// Method to increment login attempts
adminSchema.methods.incrementLoginAttempts = async function() {
  if (this.security.lockUntil && this.security.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { 'security.lockUntil': 1 },
      $set: { 'security.loginAttempts': 1 }
    });
  }
  
  const updates = { $inc: { 'security.loginAttempts': 1 } };
  
  if (this.security.loginAttempts + 1 >= config.security.maxLoginAttempts && !this.isAccountLocked()) {
    updates.$set = { 'security.lockUntil': Date.now() + config.security.accountLockTime };
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
adminSchema.methods.resetLoginAttempts = async function() {
  return this.updateOne({
    $unset: { 'security.lockUntil': 1, 'security.loginAttempts': 1 }
  });
};

// Method to update last login
adminSchema.methods.updateLastLogin = async function(ipAddress, userAgent) {
  return this.updateOne({
    $set: {
      'security.lastLoginAt': new Date(),
      'security.lastLoginIP': ipAddress,
      'status.lastActiveAt': new Date()
    }
  });
};

// Method to create session
adminSchema.methods.createSession = async function(sessionId, token, deviceId, deviceName, ipAddress, userAgent, expiresAt) {
  // Deactivate old sessions for this device
  this.sessions.forEach(session => {
    if (session.deviceId === deviceId && session.isActive) {
      session.isActive = false;
    }
  });

  // Add new session
  this.sessions.push({
    sessionId,
    token,
    deviceId,
    deviceName: deviceName || 'Unknown Device',
    ipAddress,
    userAgent,
    issuedAt: new Date(),
    expiresAt,
    lastActivityAt: new Date(),
    isActive: true
  });

  return this.save();
};

// Method to terminate session
adminSchema.methods.terminateSession = async function(sessionId) {
  const session = this.sessions.find(s => s.sessionId === sessionId);
  if (session) {
    session.isActive = false;
  }
  return this.save();
};

// Method to terminate all sessions
adminSchema.methods.terminateAllSessions = async function() {
  this.sessions.forEach(session => {
    session.isActive = false;
  });
  return this.save();
};

// Role-based access control methods
adminSchema.methods.canManageUsers = function() {
  return this.role === 'super_admin' || this.role === 'admin';
};

adminSchema.methods.canManageAdmins = function() {
  return this.role === 'super_admin' || this.role === 'admin';
};

adminSchema.methods.canManageCourses = function() {
  return this.role === 'super_admin' || this.role === 'admin';
};

adminSchema.methods.canViewAnalytics = function() {
  return this.role === 'super_admin' || this.role === 'admin' || this.role === 'support';
};

adminSchema.methods.canManageSettings = function() {
  return this.role === 'super_admin' || this.role === 'admin';
};

adminSchema.methods.canManageSystem = function() {
  return this.role === 'super_admin';
};

// Static method to get admin statistics
adminSchema.statics.getAdminStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: { $sum: { $cond: ['$status.isActive', 1, 0] } },
        verified: { $sum: { $cond: ['$status.emailVerified', 1, 0] } },
        byRole: {
          $push: {
            role: '$role',
            isActive: '$status.isActive'
          }
        }
      }
    }
  ]);

  const roleStats = {};
  if (stats[0] && stats[0].byRole) {
    stats[0].byRole.forEach(admin => {
      if (!roleStats[admin.role]) {
        roleStats[admin.role] = { total: 0, active: 0 };
      }
      roleStats[admin.role].total++;
      if (admin.isActive) {
        roleStats[admin.role].active++;
      }
    });
  }

  return {
    total: stats[0]?.total || 0,
    active: stats[0]?.active || 0,
    verified: stats[0]?.verified || 0,
    byRole: roleStats
  };
};

module.exports = mongoose.model('Admin', adminSchema); 