const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile, changePassword, deleteAccount } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);

router.get('./profile', protect, getUserProfile);
router.put('/profile/password', protect, changePassword);
router.delete('/profile', protect, deleteAccount);

module.exports = router;