const express = require('express');

const { getComments, createComment, deleteComment, updateComment } = require('../controllers/commentsController');
const { createCommentSchema, updateCommentSchema } = require('../validators/commentValidators');

const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get('/:taskId', getComments);
router.post('/', validate(createCommentSchema), createComment);
router.put('/:id', validate(updateCommentSchema), updateComment);
router.delete('/:id', deleteComment);

module.exports = router;