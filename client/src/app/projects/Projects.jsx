'use client';
import Link from 'next/link';
import { useApp } from '@/context';
import { useProjects } from './hooks/useProjects';
import { useProjectMembers } from './hooks/useProjectMembers';
import { ProjectCard, ProjectFormModal, MembersModal, TasksModal, AnnouncementsModal } from './components';
import { RemovalModal } from '@/components/ui';
import './styles/project-members.css';
import './styles/project-modals.css';
import './styles/projects-layout.css';
import './styles/member-detail.css';

export default function Projects() {
  const { user } = useApp();

  const {
    projects, setProjects,
    loading, error, isSubmitting,
    selectedProject, setSelectedProject,
    createForm, setCreateForm,
    editForm, setEditForm,
    isCreateModalOpen, setIsCreateModalOpen,
    isEditModalOpen, setIsEditModalOpen,
    isDeleteModalOpen, setIsDeleteModalOpen,
    isTasksModalOpen, setIsTasksModalOpen,
    isMembersModalOpen, setIsMembersModalOpen,
    isAnnouncementsModalOpen, setIsAnnouncementsModalOpen,
    projectTasks, loadingTasks,
    handleCreate, handleEdit, handleDelete,
    openEdit, openDelete, openTasks, openMembers,
    openAnnouncements, handleAnnouncementCreated
  } = useProjects();

  const {
    projectMembers, loadingMembers,
    handleAddMember, handleRemoveMember,
    handleUpdateRoleDescription,
    handleTransferOwnership: _handleTransferOwnership,
    handleProjectLeave: _handleProjectLeave,
  } = useProjectMembers(selectedProject, setProjects);

  const handleTransferOwnership = (memberId) =>
    _handleTransferOwnership(memberId, setSelectedProject);

  const handleProjectLeave = (project) =>
    _handleProjectLeave(project, setSelectedProject);

  if (loading || !user) return (
    <div className="loading-state">
      <div className="pulse-ring"></div>
      <p>Loading Projects...</p>
    </div>
  );

  return (
    <div className="page-content">
      <div className="projects-header">
        <h2><i className="fas fa-folder-open"></i> My Projects</h2>
        <div className="project-header-actions">
          <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
            <i className="fas fa-plus"></i> New Project
          </button>
          <Link href='/tasks' className="btn btn-secondary" title="View Tasks">
            <i className="fas fa-list-check"></i> Tasks <i className="fas fa-arrow-right"></i>
          </Link>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {projects.length === 0 ? (
        <div className="card projects-empty-state">
          <i className="fas fa-folder-plus projects-empty-icon"></i>
          <p>You don't have any projects yet. Create one to get started.</p>
          <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
            <i className="fas fa-plus"></i> New Project
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              userId={user.id}
              onOpen={openTasks}
              onEdit={openEdit}
              onDelete={openDelete}
              onMembers={openMembers}
              onLeave={handleProjectLeave}
              onAnnouncements={openAnnouncements}
            />
          ))}
        </div>
      )}

      {isCreateModalOpen && (
        <ProjectFormModal
          mode="create"
          formData={createForm}
          setFormData={setCreateForm}
          onSubmit={handleCreate}
          onClose={() => setIsCreateModalOpen(false)}
          isSubmitting={isSubmitting}
        />
      )}

      {isEditModalOpen && selectedProject && (
        <ProjectFormModal
          mode="edit"
          formData={editForm}
          setFormData={setEditForm}
          onSubmit={handleEdit}
          onClose={() => setIsEditModalOpen(false)}
          isSubmitting={isSubmitting}
        />
      )}

      <RemovalModal
        isOpen={isDeleteModalOpen}
        item={selectedProject}
        message={<>Are you sure you want to delete <strong>{selectedProject?.name}</strong>?</>}
        onConfirm={handleDelete}
        onClose={() => setIsDeleteModalOpen(false)}
        isSubmitting={isSubmitting}
      />

      {isTasksModalOpen && selectedProject && (
        <TasksModal
          project={selectedProject}
          tasks={projectTasks}
          loading={loadingTasks}
          onClose={() => setIsTasksModalOpen(false)}
        />
      )}

      {isMembersModalOpen && selectedProject && (
        <MembersModal
          project={selectedProject}
          members={projectMembers}
          loading={loadingMembers}
          isOwner={selectedProject.owner_id === user.id}
          currentUserId={user.id}
          onAddMember={handleAddMember}
          onRemoveMember={handleRemoveMember}
          onTransferOwnership={handleTransferOwnership}
          onClose={() => setIsMembersModalOpen(false)}
          onUpdateRoleDescription={handleUpdateRoleDescription}
        />
      )}

      {isAnnouncementsModalOpen && selectedProject && (
        <AnnouncementsModal
          project={selectedProject}
          isOwner={selectedProject.owner_id === user.id}
          onClose={() => setIsAnnouncementsModalOpen(false)}
          onAnnouncementCreated={() => handleAnnouncementCreated(selectedProject.id)}
        />
      )}
    </div>
  );
}