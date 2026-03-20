const express = require('express');
const { createProject, getProjects, updateProject, deleteProject } = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); 

router.post('/', createProject);
router.get('/', getProjects);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

module.exports = router;