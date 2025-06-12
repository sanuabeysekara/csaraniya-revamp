const express = require('express');
const router = express.Router();

// Import controller
const adminController = require('../controllers/adminController');

// Import middleware
const { authenticateAdmin } = require('../middleware/auth');

/**
 * @route POST /api/admin/setup-super-admin
 * @desc Setup super admin (one-time setup)
 * @access Public (with setup key)
 */
router.post('/setup-super-admin', adminController.setupSuperAdmin);

/**
 * @route POST /api/admin/login
 * @desc Admin login
 * @access Public
 */
router.post('/login', adminController.login);

/**
 * @route POST /api/admin/logout
 * @desc Admin logout
 * @access Private (Admin)
 */
router.post('/logout', authenticateAdmin, adminController.logout);

/**
 * @route GET /api/admin/profile
 * @desc Get admin profile
 * @access Private (Admin)
 */
router.get('/profile', authenticateAdmin, adminController.getProfile);

/**
 * @route GET /api/admin/dashboard
 * @desc Get dashboard statistics
 * @access Private (Admin)
 */
router.get('/dashboard', authenticateAdmin, adminController.getDashboardStats);

/**
 * @route POST /api/admin/create-admin
 * @desc Create new admin/support user
 * @access Private (Super Admin only)
 */
router.post('/create-admin', authenticateAdmin, adminController.createAdmin);

/**
 * @route GET /api/admin/admins
 * @desc Get all admin users
 * @access Private (Super Admin only)
 */
router.get('/admins', authenticateAdmin, adminController.getAdmins);

/**
 * @route PUT /api/admin/admins/:adminId/reset-password
 * @desc Reset admin user password
 * @access Private (Super Admin and Admin)
 */
router.put('/admins/:adminId/reset-password', authenticateAdmin, adminController.resetAdminPassword);

/**
 * @route PUT /api/admin/admins/:adminId/status
 * @desc Update admin user status (activate/deactivate)
 * @access Private (Super Admin only)
 */
router.put('/admins/:adminId/status', authenticateAdmin, adminController.updateAdminStatus);

/**
 * @route GET /api/admin/students
 * @desc Get all students (admin view)
 * @access Private (Admin)
 */
router.get('/students', authenticateAdmin, adminController.getStudents);

/**
 * @route PUT /api/admin/students/:studentId/status
 * @desc Update student status (activate/deactivate)
 * @access Private (Admin)
 */
router.put('/students/:studentId/status', authenticateAdmin, adminController.updateStudentStatus);

module.exports = router; 