const express = require('express');
const { getAttachments, uploadAttachment, deleteAttachment } = require('../controllers/attachmentController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect);

router.get('/tasks/:taskId/attachments', getAttachments);
router.post('/tasks/:taskId/attachments', upload.single('file'), uploadAttachment);
router.delete('/attachments/:id', deleteAttachment);

module.exports = router;