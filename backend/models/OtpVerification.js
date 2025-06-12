const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/config');

const otpVerificationSchema = new mongoose.Schema({
  mobileNumber: {
    type: String,
    required: true,
    trim: true,
    match: /^\+[1-9]\d{1,14}$/ // E.164 format
  },
  hashedOTP: {
    type: String,
    required: true
  },
  otpType: {
    type: String,
    required: true,
    enum: ['registration', 'login', 'password_reset', 'mobile_verification', 'transaction_verification']
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + config.otp.expiryMinutes * 60 * 1000)
  },
  attempts: {
    type: Number,
    default: 0
  },
  maxAttempts: {
    type: Number,
    default: config.otp.maxAttempts
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  usedAt: Date,
  
  // Resend functionality
  resendCount: {
    type: Number,
    default: 0
  },
  maxResends: {
    type: Number,
    default: 3 // Maximum 3 resends allowed
  },
  lastResendAt: Date,
  resendCooldown: {
    type: Number,
    default: 60000 // 1 minute cooldown between resends
  },
  
  // Device and request info
  deviceInfo: {
    ipAddress: String,
    userAgent: String,
    deviceId: String,
    platform: String,
    browser: String
  },
  
  // Tracking
  deliveryStatus: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed'],
    default: 'pending'
  },
  deliveryAttempts: {
    type: Number,
    default: 0
  },
  smsProvider: String,
  smsMessageId: String,
  
  // Security
  verificationAttempts: [{
    attemptedAt: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String,
    success: Boolean
  }]
}, {
  timestamps: true
});

// Indexes
otpVerificationSchema.index({ mobileNumber: 1, otpType: 1 });
otpVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpVerificationSchema.index({ isUsed: 1 });
otpVerificationSchema.index({ createdAt: 1 });

// Pre-save middleware to hash OTP
otpVerificationSchema.pre('save', async function(next) {
  if (!this.isModified('hashedOTP')) return next();
  
  try {
    // Extract the plain OTP from hashedOTP if it's not already hashed
    if (this.hashedOTP && this.hashedOTP.length === 6 && /^\d{6}$/.test(this.hashedOTP)) {
      const plainOTP = this.hashedOTP;
      const salt = await bcrypt.genSalt(10);
      this.hashedOTP = await bcrypt.hash(plainOTP, salt);
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare OTP
otpVerificationSchema.methods.compareOtp = async function(candidateOTP) {
  return bcrypt.compare(candidateOTP, this.hashedOTP);
};

// Method to check if OTP is expired
otpVerificationSchema.methods.isExpired = function() {
  return Date.now() > this.expiresAt.getTime();
};

// Method to check if max attempts exceeded
otpVerificationSchema.methods.isMaxAttemptsExceeded = function() {
  return this.attempts >= this.maxAttempts;
};

// Method to check if max resends exceeded
otpVerificationSchema.methods.isMaxResendsExceeded = function() {
  return this.resendCount >= this.maxResends;
};

// Method to check if in resend cooldown
otpVerificationSchema.methods.isInResendCooldown = function() {
  if (!this.lastResendAt) return false;
  return (Date.now() - this.lastResendAt.getTime()) < this.resendCooldown;
};

// Method to get remaining cooldown time
otpVerificationSchema.methods.getRemainingCooldown = function() {
  if (!this.isInResendCooldown()) return 0;
  return this.resendCooldown - (Date.now() - this.lastResendAt.getTime());
};

// Method to increment attempts
otpVerificationSchema.methods.incrementAttempts = async function(ipAddress, userAgent, success = false) {
  this.attempts += 1;
  this.verificationAttempts.push({
    attemptedAt: new Date(),
    ipAddress,
    userAgent,
    success
  });
  return this.save();
};

// Method to increment resend count
otpVerificationSchema.methods.incrementResendCount = async function() {
  this.resendCount += 1;
  this.lastResendAt = new Date();
  return this.save();
};

// Method to mark as used
otpVerificationSchema.methods.markAsUsed = async function() {
  this.isUsed = true;
  this.usedAt = new Date();
  return this.save();
};

// Method to update delivery status
otpVerificationSchema.methods.updateDeliveryStatus = async function(status, messageId, provider) {
  this.deliveryStatus = status;
  this.deliveryAttempts += 1;
  if (messageId) this.smsMessageId = messageId;
  if (provider) this.smsProvider = provider;
  return this.save();
};

// Static method to find valid OTP
otpVerificationSchema.statics.findValidOtp = function(mobileNumber, otpType) {
  return this.findOne({
    mobileNumber,
    otpType,
    isUsed: false,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 }); // Get the latest OTP
};

// Static method to find latest OTP for resend
otpVerificationSchema.statics.findLatestOtp = function(mobileNumber, otpType) {
  return this.findOne({
    mobileNumber,
    otpType,
    isUsed: false
  }).sort({ createdAt: -1 });
};

// Static method to check if resend is allowed
otpVerificationSchema.statics.canResendOtp = async function(mobileNumber, otpType) {
  const latestOtp = await this.findLatestOtp(mobileNumber, otpType);
  
  if (!latestOtp) {
    return { canResend: true, reason: null };
  }
  
  if (latestOtp.isMaxResendsExceeded()) {
    return { 
      canResend: false, 
      reason: 'Maximum resend attempts exceeded',
      maxResends: latestOtp.maxResends,
      currentResends: latestOtp.resendCount
    };
  }
  
  if (latestOtp.isInResendCooldown()) {
    return { 
      canResend: false, 
      reason: 'Resend cooldown active',
      remainingTime: Math.ceil(latestOtp.getRemainingCooldown() / 1000) // in seconds
    };
  }
  
  return { canResend: true, reason: null, existingOtp: latestOtp };
};

// Static method to invalidate previous OTPs
otpVerificationSchema.statics.invalidatePreviousOtps = async function(mobileNumber, otpType, excludeId) {
  return this.updateMany(
    {
      mobileNumber,
      otpType,
      _id: { $ne: excludeId },
      isUsed: false
    },
    {
      $set: { 
        isUsed: true,
        usedAt: new Date()
      }
    }
  );
};

// Static method to cleanup expired OTPs
otpVerificationSchema.statics.cleanupExpiredOtps = async function() {
  try {
    const result = await this.deleteMany({
      $or: [
        { expiresAt: { $lt: new Date() } },
        { 
          isUsed: true, 
          usedAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Remove used OTPs older than 24 hours
        }
      ]
    });
    
    if (result.deletedCount > 0) {
      console.log(`Cleaned up ${result.deletedCount} expired OTP records`);
    }
    
    return result;
  } catch (error) {
    console.error('Error cleaning up expired OTPs:', error);
    throw error;
  }
};

// Static method to get OTP statistics
otpVerificationSchema.statics.getOtpStats = async function(timeframe = 24) {
  const since = new Date(Date.now() - timeframe * 60 * 60 * 1000);
  
  const stats = await this.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: '$otpType',
        total: { $sum: 1 },
        used: { $sum: { $cond: ['$isUsed', 1, 0] } },
        expired: { $sum: { $cond: [{ $lt: ['$expiresAt', new Date()] }, 1, 0] } },
        resends: { $sum: '$resendCount' },
        avgAttempts: { $avg: '$attempts' }
      }
    }
  ]);
  
  return stats;
};

module.exports = mongoose.model('OtpVerification', otpVerificationSchema); 