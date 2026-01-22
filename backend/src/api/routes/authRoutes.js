const express = require('express');
const AuthController = require('../controllers/AuthController');
const {
  authenticate,
  authRateLimiter,
  sanitizeInput
} = require('../../middleware/auth');

const router = express.Router();

// Apply sanitization to all auth routes
router.use(sanitizeInput);

// Public routes (with rate limiting)
router.post('/signup', authRateLimiter, AuthController.signup);
router.post('/login', authRateLimiter, AuthController.login);
router.post('/refresh', authRateLimiter, AuthController.refreshToken);

// Protected routes (require authentication)
router.post('/logout', authenticate, AuthController.logout);
router.post('/logout-all', authenticate, AuthController.logoutAll);
router.get('/me', authenticate, AuthController.getProfile);
router.patch('/me', authenticate, AuthController.updateProfile);
router.post('/change-password', authenticate, AuthController.changePassword);
router.delete('/me', authenticate, AuthController.deleteAccount);

module.exports = router;
