const User = require('../models/User');
const OtpVerification = require('../models/OtpVerification');
const validation = require('../utils/validation');
const jwt = require('../utils/jwt');
const smsGateway = require('../utils/smsGateway');
const config = require('../config/config');

class AuthController {
  /**
   * Register a new user (students only)
   */
  async register(req, res) {
    try {
      // Validate input
      const { error, value } = validation.validateUserRegistration(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.formatValidationErrors(error)
        });
      }

      const { mobileNumber, password, firstName, lastName, dateOfBirth, gender, preferredLanguage } = value;

      // Check if user already exists
      const existingUser = await User.findOne({ mobileNumber });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this mobile number already exists'
        });
      }

      // Create new user (role is automatically set to 'student')
      const user = new User({
        mobileNumber,
        password,
        profile: {
          firstName,
          lastName,
          dateOfBirth,
          gender,
          preferredLanguage: preferredLanguage || 'en'
        },
        mobileVerified: false
      });

      await user.save();

      // Generate and send OTP
      const otp = smsGateway.generateOTP();
      const expiresAt = new Date(Date.now() + config.otp.expiryMinutes * 60 * 1000);

      // Invalidate any previous registration OTPs for this mobile number
      await OtpVerification.invalidatePreviousOtps(mobileNumber, 'registration');

      const otpVerification = new OtpVerification({
        mobileNumber,
        hashedOTP: otp, // Will be hashed by pre-save middleware
        otpType: 'registration',
        expiresAt,
        deviceInfo: req.deviceInfo
      });

      await otpVerification.save();

      // Send OTP via SMS
      const smsResult = await smsGateway.sendOTP(mobileNumber, otp, 'registration', config.otp.expiryMinutes);
      
      // Update delivery status
      await otpVerification.updateDeliveryStatus(
        smsResult.success ? 'sent' : 'failed',
        smsResult.messageId,
        'default'
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully. Please verify your mobile number with the OTP sent.',
        data: {
          userId: user._id,
          mobileNumber: user.mobileNumber,
          firstName: user.profile.firstName,
          otpSent: smsResult.success,
          expiresIn: config.otp.expiryMinutes,
          canResend: false, // Cannot resend immediately
          resendAvailableIn: 60 // seconds
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: error.message
      });
    }
  }

  /**
   * Resend registration OTP
   */
  async resendRegistrationOtp(req, res) {
    try {
      const { mobileNumber } = req.body;

      if (!validation.isValidMobileNumber(mobileNumber)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid mobile number'
        });
      }

      // Check if user exists and is not verified
      const user = await User.findOne({ mobileNumber });
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.mobileVerified) {
        return res.status(400).json({
          success: false,
          message: 'Mobile number is already verified'
        });
      }

      // Check if resend is allowed
      const resendCheck = await OtpVerification.canResendOtp(mobileNumber, 'registration');
      if (!resendCheck.canResend) {
        return res.status(429).json({
          success: false,
          message: resendCheck.reason,
          data: {
            maxResends: resendCheck.maxResends,
            currentResends: resendCheck.currentResends,
            remainingTime: resendCheck.remainingTime
          }
        });
      }

      // Generate new OTP
      const otp = smsGateway.generateOTP();
      const expiresAt = new Date(Date.now() + config.otp.expiryMinutes * 60 * 1000);

      let otpRecord;
      if (resendCheck.existingOtp) {
        // Update existing OTP record
        otpRecord = resendCheck.existingOtp;
        otpRecord.hashedOTP = otp; // Will be hashed by pre-save middleware
        otpRecord.expiresAt = expiresAt;
        otpRecord.attempts = 0; // Reset attempts
        await otpRecord.incrementResendCount();
      } else {
        // Create new OTP record
        otpRecord = new OtpVerification({
          mobileNumber,
          hashedOTP: otp,
          otpType: 'registration',
          expiresAt,
          deviceInfo: req.deviceInfo
        });
        await otpRecord.save();
      }

      // Send OTP via SMS
      const smsResult = await smsGateway.sendOTP(mobileNumber, otp, 'registration', config.otp.expiryMinutes);
      
      // Update delivery status
      await otpRecord.updateDeliveryStatus(
        smsResult.success ? 'sent' : 'failed',
        smsResult.messageId,
        'default'
      );

      res.status(200).json({
        success: true,
        message: 'OTP resent successfully',
        data: {
          mobileNumber,
          otpSent: smsResult.success,
          expiresIn: config.otp.expiryMinutes,
          resendCount: otpRecord.resendCount,
          maxResends: otpRecord.maxResends,
          remainingResends: otpRecord.maxResends - otpRecord.resendCount
        }
      });

    } catch (error) {
      console.error('Resend registration OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to resend OTP',
        error: error.message
      });
    }
  }

  /**
   * Verify mobile number after registration
   */
  async verifyRegistration(req, res) {
    try {
      const { error, value } = validation.validateOTPVerification(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.formatValidationErrors(error)
        });
      }

      const { mobileNumber, otp } = value;

      const user = await User.findOne({ mobileNumber });
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.mobileVerified) {
        return res.status(400).json({
          success: false,
          message: 'Mobile number is already verified'
        });
      }

      const otpRecord = await OtpVerification.findValidOtp(mobileNumber, 'registration');
      if (!otpRecord) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP. Please request a new OTP.'
        });
      }

      if (otpRecord.isMaxAttemptsExceeded()) {
        return res.status(400).json({
          success: false,
          message: 'Maximum OTP verification attempts exceeded. Please request a new OTP.'
        });
      }

      const isValidOtp = await otpRecord.compareOtp(otp);
      if (!isValidOtp) {
        await otpRecord.incrementAttempts(req.deviceInfo?.ipAddress, req.deviceInfo?.userAgent, false);
        return res.status(400).json({
          success: false,
          message: 'Invalid OTP',
          attemptsRemaining: otpRecord.maxAttempts - otpRecord.attempts - 1
        });
      }

      // Mark attempt as successful
      await otpRecord.incrementAttempts(req.deviceInfo?.ipAddress, req.deviceInfo?.userAgent, true);

      // Verify user
      user.mobileVerified = true;
      user.mobileVerifiedAt = new Date();
      await user.save();

      // Mark OTP as used
      await otpRecord.markAsUsed();

      res.status(200).json({
        success: true,
        message: 'Mobile number verified successfully. You can now log in.',
        data: {
          userId: user._id,
          mobileNumber: user.mobileNumber,
          mobileVerified: true
        }
      });

    } catch (error) {
      console.error('Mobile verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Mobile verification failed',
        error: error.message
      });
    }
  }

  /**
   * Authenticate user and return JWT token (students only)
   */
  async login(req, res) {
    try {
      const { error, value } = validation.validateUserLogin(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.formatValidationErrors(error)
        });
      }

      const { mobileNumber, password, deviceId, deviceName } = value;

      const user = await User.findOne({ mobileNumber, role: 'student' });
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid mobile number or password'
        });
      }

      if (user.isAccountLocked()) {
        return res.status(400).json({
          success: false,
          message: 'Account is temporarily locked due to too many failed login attempts'
        });
      }

      if (!user.mobileVerified) {
        return res.status(400).json({
          success: false,
          message: 'Please verify your mobile number first'
        });
      }

      if (!user.status.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Account is deactivated. Please contact support.'
        });
      }

      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        await user.incrementLoginAttempts();
        return res.status(400).json({
          success: false,
          message: 'Invalid mobile number or password'
        });
      }

      // Check if user has an active session from another device
      let sessionCleared = false;
      let previousDevice = null;
      
      if (user.hasActiveSession()) {
        previousDevice = user.security.currentSession.deviceId;
        console.log(`User ${user.mobileNumber} has active session on device ${previousDevice}, clearing it for new login on device ${deviceId}`);
        
        // Clear the existing session to allow login from new device
        await user.clearCurrentSession();
        sessionCleared = true;
        
        // Log the session transfer for security audit
        console.log(`Session cleared for user ${user.mobileNumber}. New login from device: ${deviceId}`);
      }

      await user.resetLoginAttempts();

      const tokenPair = jwt.generateTokenPair(user, deviceId);
      await user.setCurrentSession(
        tokenPair.accessToken, 
        deviceId, 
        tokenPair.accessTokenExpiry,
        deviceName,
        req.deviceInfo?.ipAddress,
        req.deviceInfo?.userAgent
      );
      await user.updateLastLogin(req.deviceInfo?.ipAddress, req.deviceInfo?.userAgent);

      // Add or update trusted device
      await user.addTrustedDevice(deviceId, deviceName);

      const responseData = {
        success: true,
        message: sessionCleared ? 'Login successful. Previous session has been terminated.' : 'Login successful',
        data: {
          user: {
            id: user._id,
            mobileNumber: user.mobileNumber,
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            role: user.role,
            mobileVerified: user.mobileVerified,
            preferredLanguage: user.profile.preferredLanguage
          },
          tokens: {
            accessToken: tokenPair.accessToken,
            refreshToken: tokenPair.refreshToken,
            tokenType: tokenPair.tokenType,
            expiresIn: tokenPair.accessTokenExpiry
          },
          deviceId,
          loginAt: new Date()
        }
      };

      // Add session info if a previous session was cleared
      if (sessionCleared) {
        responseData.data.sessionInfo = {
          previousSessionCleared: true,
          previousDevice: previousDevice,
          message: 'Your previous session on another device has been automatically logged out.'
        };
      }

      res.status(200).json(responseData);

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error.message
      });
    }
  }

  /**
   * Logout user and invalidate session
   */
  async logout(req, res) {
    try {
      await req.user.clearCurrentSession();

      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });

    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed',
        error: error.message
      });
    }
  }

  /**
   * Send OTP for password reset
   */
  async forgotPassword(req, res) {
    try {
      const { mobileNumber } = req.body;

      if (!validation.isValidMobileNumber(mobileNumber)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid mobile number'
        });
      }

      const user = await User.findOne({ mobileNumber, role: 'student' });
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!user.mobileVerified) {
        return res.status(400).json({
          success: false,
          message: 'Mobile number is not verified'
        });
      }

      // Invalidate any previous password reset OTPs
      await OtpVerification.invalidatePreviousOtps(mobileNumber, 'password_reset');

      const otp = smsGateway.generateOTP();
      const expiresAt = new Date(Date.now() + config.otp.expiryMinutes * 60 * 1000);

      const otpVerification = new OtpVerification({
        mobileNumber,
        hashedOTP: otp,
        otpType: 'password_reset',
        expiresAt,
        deviceInfo: req.deviceInfo
      });

      await otpVerification.save();

      const smsResult = await smsGateway.sendOTP(mobileNumber, otp, 'password_reset', config.otp.expiryMinutes);
      
      // Update delivery status
      await otpVerification.updateDeliveryStatus(
        smsResult.success ? 'sent' : 'failed',
        smsResult.messageId,
        'default'
      );

      res.status(200).json({
        success: true,
        message: 'Password reset OTP sent successfully',
        data: {
          mobileNumber,
          otpSent: smsResult.success,
          expiresIn: config.otp.expiryMinutes,
          canResend: false,
          resendAvailableIn: 60
        }
      });

    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send password reset OTP',
        error: error.message
      });
    }
  }

  /**
   * Resend password reset OTP
   */
  async resendForgotPasswordOtp(req, res) {
    try {
      const { mobileNumber } = req.body;

      if (!validation.isValidMobileNumber(mobileNumber)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid mobile number'
        });
      }

      const user = await User.findOne({ mobileNumber, role: 'student' });
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!user.mobileVerified) {
        return res.status(400).json({
          success: false,
          message: 'Mobile number is not verified'
        });
      }

      // Check if resend is allowed
      const resendCheck = await OtpVerification.canResendOtp(mobileNumber, 'password_reset');
      if (!resendCheck.canResend) {
        return res.status(429).json({
          success: false,
          message: resendCheck.reason,
          data: {
            maxResends: resendCheck.maxResends,
            currentResends: resendCheck.currentResends,
            remainingTime: resendCheck.remainingTime
          }
        });
      }

      // Generate new OTP
      const otp = smsGateway.generateOTP();
      const expiresAt = new Date(Date.now() + config.otp.expiryMinutes * 60 * 1000);

      let otpRecord;
      if (resendCheck.existingOtp) {
        // Update existing OTP record
        otpRecord = resendCheck.existingOtp;
        otpRecord.hashedOTP = otp;
        otpRecord.expiresAt = expiresAt;
        otpRecord.attempts = 0;
        await otpRecord.incrementResendCount();
      } else {
        // Create new OTP record
        otpRecord = new OtpVerification({
          mobileNumber,
          hashedOTP: otp,
          otpType: 'password_reset',
          expiresAt,
          deviceInfo: req.deviceInfo
        });
        await otpRecord.save();
      }

      const smsResult = await smsGateway.sendOTP(mobileNumber, otp, 'password_reset', config.otp.expiryMinutes);
      
      // Update delivery status
      await otpRecord.updateDeliveryStatus(
        smsResult.success ? 'sent' : 'failed',
        smsResult.messageId,
        'default'
      );

      res.status(200).json({
        success: true,
        message: 'Password reset OTP resent successfully',
        data: {
          mobileNumber,
          otpSent: smsResult.success,
          expiresIn: config.otp.expiryMinutes,
          resendCount: otpRecord.resendCount,
          maxResends: otpRecord.maxResends,
          remainingResends: otpRecord.maxResends - otpRecord.resendCount
        }
      });

    } catch (error) {
      console.error('Resend forgot password OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to resend password reset OTP',
        error: error.message
      });
    }
  }

  /**
   * Reset password using OTP
   */
  async resetPassword(req, res) {
    try {
      const { error, value } = validation.validatePasswordReset(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.formatValidationErrors(error)
        });
      }

      const { mobileNumber, otp, newPassword } = value;

      const user = await User.findOne({ mobileNumber, role: 'student' });
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'User not found'
        });
      }

      const otpRecord = await OtpVerification.findValidOtp(mobileNumber, 'password_reset');
      if (!otpRecord) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP. Please request a new OTP.'
        });
      }

      if (otpRecord.isMaxAttemptsExceeded()) {
        return res.status(400).json({
          success: false,
          message: 'Maximum OTP verification attempts exceeded. Please request a new OTP.'
        });
      }

      const isValidOtp = await otpRecord.compareOtp(otp);
      if (!isValidOtp) {
        await otpRecord.incrementAttempts(req.deviceInfo?.ipAddress, req.deviceInfo?.userAgent, false);
        return res.status(400).json({
          success: false,
          message: 'Invalid OTP',
          attemptsRemaining: otpRecord.maxAttempts - otpRecord.attempts - 1
        });
      }

      // Mark attempt as successful
      await otpRecord.incrementAttempts(req.deviceInfo?.ipAddress, req.deviceInfo?.userAgent, true);

      user.password = newPassword;
      await user.clearCurrentSession(); // Clear current session
      await user.save();

      await otpRecord.markAsUsed();

      res.status(200).json({
        success: true,
        message: 'Password reset successful. Please login with your new password.',
        data: {
          mobileNumber,
          passwordChangedAt: user.security.lastPasswordChangeAt
        }
      });

    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({
        success: false,
        message: 'Password reset failed',
        error: error.message
      });
    }
  }

  /**
   * Get user profile
   */
  async getProfile(req, res) {
    try {
      res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: {
          user: {
            id: req.user._id,
            mobileNumber: req.user.mobileNumber,
            mobileVerified: req.user.mobileVerified,
            profile: req.user.profile,
            role: req.user.role,
            status: req.user.status,
            security: {
              lastLoginAt: req.user.security.lastLoginAt,
              lastLoginIP: req.user.security.lastLoginIP,
              twoFactorEnabled: req.user.security.twoFactorEnabled,
              trustedDevices: req.user.security.trustedDevices
            },
            courses: req.user.courses,
            notifications: req.user.notifications,
            createdAt: req.user.createdAt,
            updatedAt: req.user.updatedAt
          }
        }
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve profile',
        error: error.message
      });
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req, res) {
    try {
      const { error, value } = validation.validateProfileUpdate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.formatValidationErrors(error)
        });
      }

      Object.keys(value).forEach(key => {
        if (key === 'address') {
          Object.keys(value.address).forEach(addressKey => {
            req.user.profile.address[addressKey] = value.address[addressKey];
          });
        } else if (key === 'notifications') {
          Object.keys(value.notifications).forEach(notifKey => {
            req.user.notifications[notifKey] = value.notifications[notifKey];
          });
        } else {
          req.user.profile[key] = value[key];
        }
      });

      await req.user.save();

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: {
            id: req.user._id,
            mobileNumber: req.user.mobileNumber,
            profile: req.user.profile,
            notifications: req.user.notifications,
            updatedAt: req.user.updatedAt
          }
        }
      });

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: error.message
      });
    }
  }
}

module.exports = new AuthController(); 