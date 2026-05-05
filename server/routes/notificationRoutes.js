const express = require('express');
const { getNotifications, markAsRead, markAllAsRead, deleteNotification,
  savePushSubscription, deletePushSubscription, getVapidPublicKey
 } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

router.get('/vapid-public-key', getVapidPublicKey);
router.post('/push-subscription', savePushSubscription);
router.delete('/push-subscription', deletePushSubscription);

module.exports = router;