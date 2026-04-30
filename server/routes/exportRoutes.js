const express = require('express');
const {
  exportTask,
  exportMyTasks,
  exportMyTasksFull,
  exportProjectTasks,
  exportProjectMembers,
  exportProjectAnnouncements,
  exportProjectFull,
} = require('../controllers/exportController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/task/:taskId', exportTask);
router.get('/my-tasks', exportMyTasks);
router.get('/my-tasks/full', exportMyTasksFull);
router.get('/project/:projectId/tasks', exportProjectTasks);
router.get('/project/:projectId/members', exportProjectMembers);
router.get('/project/:projectId/announcements', exportProjectAnnouncements);
router.get('/project/:projectId/full', exportProjectFull);

module.exports = router;