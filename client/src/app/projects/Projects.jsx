'use client';
import Link from 'next/link';
import { useApp } from '@/context';
import { useProjects } from './hooks/useProjects';
import { useProjectMembers } from './hooks/useProjectMembers';
import { ProjectCard, ProjectFormModal, MembersModal, TasksModal, 
  AnnouncementsModal, QuickAddTaskModal } from './components';
import { RemovalModal } from '@/components/ui';
import './styles/project-members.css';
import './styles/project-modals.css';
import './styles/projects-layout.css';
import './styles/member-detail.css';

const ProjectsSkeleton = () => (
  <div className="page-content">
    <div className="projects-header">
      <div className="skeleton skeleton-title" style={{ width: '200px' }}></div>
      <div className="project-header-actions">
        <div className="skeleton skeleton-btn"></div>
      </div>
    </div>
    <div className="skeleton-project-grid">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="card" style={{ height: '200px', padding: '20px' }}>
          <div className="skeleton" style={{ width: '60%', height: '24px', marginBottom: '15px' }}></div>
          <div className="skeleton" style={{ width: '100%', height: '15px', marginBottom: '8px' }}></div>
          <div className="skeleton" style={{ width: '80%', height: '15px', marginBottom: '20px' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto' }}>
            <div className="skeleton" style={{ width: '30%', height: '12px' }}></div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div className="skeleton" style={{ width: '25px', height: '25px', borderRadius: '50%' }}></div>
              <div className="skeleton" style={{ width: '25px', height: '25px', borderRadius: '50%' }}></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default function Projects() {
  const { user, loading: appLoading } = useApp();

  const {
    projects, setProjects,
    loading: projectsLoading, error, isSubmitting,
    selectedProject, setSelectedProject,
    createForm, setCreateForm,
    editForm, setEditForm,
    activeTagFilter, setActiveTagFilter, allTags,
    isCreateModalOpen, setIsCreateModalOpen,
    isEditModalOpen, setIsEditModalOpen,
    isDeleteModalOpen, setIsDeleteModalOpen,
    isTasksModalOpen, setIsTasksModalOpen,
    isMembersModalOpen, setIsMembersModalOpen,
    isAnnouncementsModalOpen, setIsAnnouncementsModalOpen,
    quickAddProject, setQuickAddProject,
    projectTasks, loadingTasks,
    handleCreate, handleEdit, handleDelete, handleStar,
    openEdit, openDelete, openTasks, openMembers,
    openAnnouncements, openQuickAdd,
    handleAnnouncementCreated, handleAnnouncementDeleted,
  } = useProjects();

  const {
    projectMembers, loadingMembers,
    handleAddMember, handleRemoveMember,
    handleUpdateRoleDescription,
    handleTransferOwnership: _handleTransferOwnership,
    handleProjectLeave: _handleProjectLeave,
  } = useProjectMembers(selectedProject, setProjects);

  const handleTransferOwnership = (memberId) => _handleTransferOwnership(memberId, setSelectedProject);
  const handleProjectLeave = (project) => _handleProjectLeave(project, setSelectedProject);

  if (appLoading || projectsLoading || !user) return <ProjectsSkeleton />;

  return (
    <div className="page-content">
      <div className="projects-header">
        <h2><i className="fas fa-folder-open"></i> My Projects</h2>
        <div className="project-header-actions">
          <Link href="/archive" className="btn btn-secondary" title="View Archive">
            <i className="fas fa-box-archive"></i> Archive
          </Link>
          <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
            <i className="fas fa-plus"></i> New Project
          </button>
          <Link href="/tasks" className="btn btn-secondary" title="View Tasks">
            <i className="fas fa-list-check"></i> Tasks <i className="fas fa-arrow-right"></i>
          </Link>
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="project-tag-filter-bar">
          <button
            className={`tag-filter-btn ${activeTagFilter === '' ? 'active' : ''}`}
            onClick={() => setActiveTagFilter('')}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              className={`tag-filter-btn ${activeTagFilter === tag ? 'active' : ''}`}
              onClick={() => setActiveTagFilter(activeTagFilter === tag ? '' : tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {projects.length === 0 ? (
        <div className="card projects-empty-state">
          <i className="fas fa-folder-plus projects-empty-icon"></i>
          <p>{activeTagFilter ? `No projects tagged "${activeTagFilter}".` : "You don't have any projects yet."}</p>
          {activeTagFilter ? (
            <button className="btn btn-secondary" onClick={() => setActiveTagFilter('')}>Clear filter</button>
          ) : (
            <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
              <i className="fas fa-plus"></i> New Project
            </button>
          )}
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
              onStar={handleStar}
              onQuickAdd={openQuickAdd}
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
          onAnnouncementDeleted={() => handleAnnouncementDeleted(selectedProject.id)}
        />
      )}

      {quickAddProject && (
        <QuickAddTaskModal
          project={quickAddProject}
          onClose={() => setQuickAddProject(null)}
          onAdded={() => {
            setProjects((prev) =>
              prev.map((p) => p.id === quickAddProject.id ? { ...p, task_count: (p.task_count ?? 0) + 1 } : p)
            );
          }}
        />
      )}
    </div>
  );
}