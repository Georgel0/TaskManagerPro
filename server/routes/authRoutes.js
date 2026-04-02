const express = require('express');
const { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  changeUsername, 
  changePassword, 
  deleteAccount,
  forgotPassword,
  resetPassword,
  searchUsers 
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const {
  registerSchema,
  loginSchema,
  changeUsernameSchema,
  changePasswordSchema,
  deleteAccountSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} = require('../validators/authValidators');

const router = express.Router();

router.get('/users/search', protect, searchUsers);

router.post('/register', validate(registerSchema), registerUser);
router.post('/login', validate(loginSchema), loginUser);

router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

router.get('/profile', protect, getUserProfile);
router.put('/profile/username', protect, validate(changeUsernameSchema), changeUsername);
router.put('/profile/password', protect, validate(changePasswordSchema), changePassword);
router.delete('/profile', protect, validate(deleteAccountSchema), deleteAccount);

module.exports = router;