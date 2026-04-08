const express = require('express');
const {
  createProject,
  getProjects,
  updateProject,
  deleteProject,
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
  transferOwnership,
  updateRoleDescription
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
} = require('../validators/projectValidators');

const router = express.Router();

router.use(protect);

router.get('/', getProjects);
router.post('/', validate(createProjectSchema), createProject);
router.put('/:id', validate(updateProjectSchema), updateProject);
router.delete('/:id', deleteProject);

router.get('/:id/members', getProjectMembers);
router.post('/:id/members', validate(addMemberSchema), addProjectMember);
router.delete('/:id/members/:memberId', removeProjectMember);
router.put('/:id/members/:memberId/transfer', transferOwnership);
router.put('/:id/members/:memberId/role', updateRoleDescription);

module.exports = router;