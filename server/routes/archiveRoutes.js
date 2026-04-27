const express = require('express');
const {
  getArchivedProjects, archiveProject, restoreProject, permanentDeleteProject,
  getArchivedTasks, archiveTask, restoreTask, permanentDeleteTask,
} = require('../controllers/archiveController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect);

router.get('/projects', getArchivedProjects);
router.post('/projects/:id', archiveProject);
router.put('/projects/:id/restore', restoreProject);
router.delete('/projects/:id', permanentDeleteProject);

router.get('/tasks', getArchivedTasks);
router.post('/tasks/:id', archiveTask);
router.put('/tasks/:id/restore', restoreTask);
router.delete('/tasks/:id', permanentDeleteTask);

module.exports = router;