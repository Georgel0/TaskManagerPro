const express = require('express');
const {
  createProject, getProjects, updateProject,
  deleteProject, getProjectMembers, addProjectMember,
  removeProjectMember, transferOwnership, updateRoleDescription,
  leaveProject, getAnnouncements, createAnnouncement, toggleAcknowledgment
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
router.get('/:id/members', getProjectMembers);
router.get('/:id/announcements', getAnnouncements);

router.post('/', validate(createProjectSchema), createProject);
router.post('/:id/members', validate(addMemberSchema), addProjectMember);
router.post('/:id/announcements', createAnnouncement);
router.post('/:id/announcements/:announcementId/acknowledge', toggleAcknowledgment);

router.put('/:id', validate(updateProjectSchema), updateProject);
router.put('/:id/members/:memberId/transfer', transferOwnership);
router.put('/:id/members/:memberId/role', updateRoleDescription);

router.delete('/:id', deleteProject);
router.delete('/:id/leave', leaveProject);
router.delete('/:id/members/:memberId', removeProjectMember);

module.exports = router;