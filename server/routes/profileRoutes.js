const express = require('express');
const { 
  getUserProfile, changeUsername,
  changeEmail, changeAvatar,
  changePassword, deleteAccount,
  searchUsers, changeBio
} = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const {
  changeUsernameSchema, changeEmailSchema,
  changeAvatarSchema, changePasswordSchema,
  deleteAccountSchema, changeBioSchema
} = require('../validators/profileValidators');

const router = express.Router();

router.get('/users/search', protect, searchUsers);

router.get('/profile', protect, getUserProfile);

router.put('/profile/username', protect, validate(changeUsernameSchema), changeUsername);
router.put('/profile/email', protect, validate(changeEmailSchema), changeEmail);
router.put('/profile/avatar', protect, validate(changeAvatarSchema), changeAvatar);
router.put('/profile/password', protect, validate(changePasswordSchema), changePassword);
router.put('./profile/bio', protect, validate(changeBioSchema), changeAvatar);

router.delete('/profile', protect, validate(deleteAccountSchema), deleteAccount);

module.exports = router;