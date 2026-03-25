'use client';
import { useApp } from '@/context';
import { useProjects } from './useProjects';
import { ProjectCard, ProjectFormModal, DeleteProjectModal, TasksModal } from './components';
import './projects.css';

export default function Projects() {
  const { user } = useApp();
  const {
    projects, loading, error, isSubmitting,
    projectTasks, loadingTasks, selectedProject,
    createForm, setCreateForm,
    editForm, setEditForm,
    isCreateModalOpen, setIsCreateModalOpen,
    isDeleteModalOpen, setIsDeleteModalOpen,
    isTasksModalOpen, setIsTasksModalOpen,
    isEditModalOpen, setIsEditModalOpen,
    handleCreate, handleEdit, handleDelete,
    openTasks, openEdit, openDelete,
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
        <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
          <i className="fas fa-plus"></i> New Project
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {projects.length === 0 ? (
        <div className="card projects-empty-state">
          <i className="fas fa-folder-plus projects-empty-icon"></i>
          <p className="mb-3">You don't have any projects yet. Create one to get started.</p>
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
    </div>
  );
}