const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * POST /api/auth/register
 * body: { name, email, phone, password, otpMethod: 'email'|'phone' }
 */
router.post('/register',
  body('email').isEmail().withMessage('valid email required'),
  body('password').isLength({ min: 6 }).withMessage('password >= 6 required'),
  authController.register
);

/**
 * POST /api/auth/verify-otp
 * body: { emailOrPhone, code }
 */
router.post('/verify-otp', authController.verifyOtp);

/**
 * POST /api/auth/resend-otp
 * body: { emailOrPhone, type }
 */
router.post('/resend-otp', authController.resendOtp);

/**
 * POST /api/auth/login
 * body: { emailOrPhone, password, otp? }
 */
router.post('/login', authController.login);

/**
 * GET /api/auth/me
 * header: Authorization: Bearer <token>
 */
router.get('/me', authMiddleware, authController.me);

module.exports = router;
