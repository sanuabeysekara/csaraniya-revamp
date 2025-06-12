const express = require('express');
const router = express.Router();

// Import controller
const authController = require('../controllers/authController');

// Import middleware
const { authenticate } = require('../middleware/auth');

/**
 * @route POST /api/auth/register
 * @desc Register a new user (students only)
 * @access Public
 */
router.post('/register', authController.register);

/**
 * @route POST /api/auth/resend-registration-otp
 * @desc Resend registration OTP
 * @access Public
 */
router.post('/resend-registration-otp', authController.resendRegistrationOtp);

/**
 * @route POST /api/auth/verify-registration
 * @desc Verify mobile number after registration
 * @access Public
 */
router.post('/verify-registration', authController.verifyRegistration);

/**
 * @route POST /api/auth/login
 * @desc Authenticate user and return JWT token (students only)
 * @access Public
 */
router.post('/login', authController.login);

/**
 * @route POST /api/auth/logout
 * @desc Logout user and invalidate session
 * @access Private
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route POST /api/auth/forgot-password
 * @desc Send OTP for password reset
 * @access Public
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @route POST /api/auth/resend-forgot-password-otp
 * @desc Resend password reset OTP
 * @access Public
 */
router.post('/resend-forgot-password-otp', authController.resendForgotPasswordOtp);

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password using OTP
 * @access Public
 */
router.post('/reset-password', authController.resetPassword);

/**
 * @route GET /api/auth/profile
 * @desc Get user profile
 * @access Private
 */
router.get('/profile', authenticate, authController.getProfile);

/**
 * @route PUT /api/auth/profile
 * @desc Update user profile
 * @access Private
 */
router.put('/profile', authenticate, authController.updateProfile);

module.exports = router; 