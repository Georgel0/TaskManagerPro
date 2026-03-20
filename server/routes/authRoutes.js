const express = require('express');
const { registerUser, loginUser, getUserProfile, changeUsername, changePassword, deleteAccount } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

router.get('/profile', protect, getUserProfile);
router.put('/profile/username', protect, changeUsername);
router.put('/profile/password', protect, changePassword);
router.delete('/profile', protect, deleteAccount);

module.exports = router;