const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/config');

const userSchema = new mongoose.Schema({
  // Authentication
  mobileNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: /^\+[1-9]\d{1,14}$/ // E.164 format
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  mobileVerified: {
    type: Boolean,
    default: false
  },
  mobileVerifiedAt: Date,

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
    dateOfBirth: {
      type: Date,
      required: true
    },
    gender: {
      type: String,
      required: true,
      enum: ['male', 'female', 'other']
    },
    preferredLanguage: {
      type: String,
      default: 'en',
      enum: ['en', 'si', 'ta']
    },
    profilePicture: {
      type: String,
      default: null
    },
    address: {
      street: String,
      city: String,
      district: String,
      province: String,
      postalCode: String,
      country: {
        type: String,
        default: 'Sri Lanka'
      }
    }
  },

  // Role - Fixed to student only for this model
  role: {
    type: String,
    default: 'student',
    enum: ['student'], // Only students allowed in this model
    immutable: true // Cannot be changed after creation
  },

  // Account Status
  status: {
    isActive: {
      type: Boolean,
      default: true
    },
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
    lastPasswordChangeAt: Date,
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    // Single device session management
    currentSession: {
      sessionToken: String,
      deviceId: String,
      deviceName: String,
      issuedAt: Date,
      expiresAt: Date,
      ipAddress: String,
      userAgent: String
    },
    // Trusted devices for this user
    trustedDevices: [{
      deviceId: {
        type: String,
        required: true
      },
      deviceName: String,
      addedAt: {
        type: Date,
        default: Date.now
      },
      lastUsedAt: Date,
      isActive: {
        type: Boolean,
        default: true
      }
    }]
  },



  // Notifications preferences
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    },
    marketing: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.security.currentSession;
      return ret;
    }
  }
});

// Indexes
userSchema.index({ mobileNumber: 1 });
userSchema.index({ 'status.isActive': 1 });
userSchema.index({ 'security.lockUntil': 1 });
userSchema.index({ role: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
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

// Pre-save middleware to ensure role is always student
userSchema.pre('save', function(next) {
  if (this.role !== 'student') {
    this.role = 'student';
  }
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to check if account is locked
userSchema.methods.isAccountLocked = function() {
  return !!(this.security.lockUntil && this.security.lockUntil > Date.now());
};

// Method to increment login attempts
userSchema.methods.incrementLoginAttempts = async function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.security.lockUntil && this.security.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { 'security.lockUntil': 1 },
      $set: { 'security.loginAttempts': 1 }
    });
  }
  
  const updates = { $inc: { 'security.loginAttempts': 1 } };
  
  // If we have hit max attempts and it's not locked yet, lock the account
  if (this.security.loginAttempts + 1 >= config.security.maxLoginAttempts && !this.isAccountLocked()) {
    updates.$set = { 'security.lockUntil': Date.now() + config.security.accountLockTime };
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = async function() {
  return this.updateOne({
    $unset: { 'security.lockUntil': 1, 'security.loginAttempts': 1 }
  });
};

// Method to update last login
userSchema.methods.updateLastLogin = async function(ipAddress, userAgent) {
  return this.updateOne({
    $set: {
      'security.lastLoginAt': new Date(),
      'security.lastLoginIP': ipAddress,
      'status.lastActiveAt': new Date()
    }
  });
};

// Method to check if user has active session
userSchema.methods.hasActiveSession = function() {
  if (!this.security.currentSession) return false;
  
  const session = this.security.currentSession;
  return session.sessionToken && 
         session.expiresAt && 
         session.expiresAt > new Date();
};

// Method to set current session
userSchema.methods.setCurrentSession = async function(sessionToken, deviceId, expiresAt, deviceName, ipAddress, userAgent) {
  return this.updateOne({
    $set: {
      'security.currentSession': {
        sessionToken,
        deviceId,
        deviceName: deviceName || 'Unknown Device',
        issuedAt: new Date(),
        expiresAt,
        ipAddress,
        userAgent
      }
    }
  });
};

// Method to clear current session
userSchema.methods.clearCurrentSession = async function() {
  return this.updateOne({
    $unset: { 'security.currentSession': 1 }
  });
};

// Method to validate session
userSchema.methods.validateSession = function(sessionToken, deviceId) {
  if (!this.hasActiveSession()) return false;
  
  const session = this.security.currentSession;
  return session.sessionToken === sessionToken && 
         session.deviceId === deviceId;
};

// Method to add trusted device
userSchema.methods.addTrustedDevice = async function(deviceId, deviceName) {
  const existingDevice = this.security.trustedDevices.find(
    device => device.deviceId === deviceId
  );
  
  if (existingDevice) {
    existingDevice.lastUsedAt = new Date();
    existingDevice.isActive = true;
    if (deviceName) existingDevice.deviceName = deviceName;
  } else {
    this.security.trustedDevices.push({
      deviceId,
      deviceName: deviceName || 'Unknown Device',
      addedAt: new Date(),
      lastUsedAt: new Date(),
      isActive: true
    });
  }
  
  return this.save();
};

// Method to remove trusted device
userSchema.methods.removeTrustedDevice = async function(deviceId) {
  this.security.trustedDevices = this.security.trustedDevices.filter(
    device => device.deviceId !== deviceId
  );
  return this.save();
};

// Method to check if device is trusted
userSchema.methods.isTrustedDevice = function(deviceId) {
  return this.security.trustedDevices.some(
    device => device.deviceId === deviceId && device.isActive
  );
};

// Static method to find active students only
userSchema.statics.findActiveStudents = function(filter = {}) {
  return this.find({
    ...filter,
    role: 'student',
    'status.isActive': true
  });
};

// Static method to get student statistics
userSchema.statics.getStudentStats = async function() {
  const stats = await this.aggregate([
    { $match: { role: 'student' } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: { $sum: { $cond: ['$status.isActive', 1, 0] } },
        verified: { $sum: { $cond: ['$mobileVerified', 1, 0] } },
      }
    }
  ]);
  
  return stats[0] || { total: 0, active: 0, verified: 0 };
};

module.exports = mongoose.model('User', userSchema); 