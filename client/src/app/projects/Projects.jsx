'use client';
import Link from 'next/link';
import { useApp } from '@/context';
import { useProjects } from './useProjects';
import { ProjectCard, ProjectFormModal, MembersModal, DeleteProjectModal, TasksModal } from './components';
import './styles/project-card.css';
import './styles/project-modals.css'
import './styles/projects-layout.css'

export default function Projects() {
  const { user } = useApp();
  const {
    projects, loading, error, isSubmitting,
    projectTasks, loadingTasks,
    projectMembers, loadingMembers,
    selectedProject,
    createForm, setCreateForm,
    editForm, setEditForm,
    isCreateModalOpen, setIsCreateModalOpen,
    isDeleteModalOpen, setIsDeleteModalOpen,
    isTasksModalOpen, setIsTasksModalOpen,
    isEditModalOpen, setIsEditModalOpen,
    isMembersModalOpen, setIsMembersModalOpen,
    handleCreate, handleEdit, handleDelete,
    handleAddMember, handleRemoveMember,
    openTasks, openEdit, openDelete,
    openMembers, handleTransferOwnership,
    handleUpdateRoleDescription
  } = useProjects();

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
          <Link
            href='/tasks'
            className="btn btn-secondary"
            title="View Tasks"
          >
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

      {isDeleteModalOpen && selectedProject && (
        <DeleteProjectModal
          project={selectedProject}
          onConfirm={handleDelete}
          onClose={() => setIsDeleteModalOpen(false)}
          isSubmitting={isSubmitting}
        />
      )}

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
    </div>
  );
}