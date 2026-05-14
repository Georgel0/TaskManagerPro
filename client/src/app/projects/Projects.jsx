'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useApp, WindowManagerProvider, useWindowManager } from '@/context';
import { usePanelResize } from '@/hooks';
import { useProjects } from './hooks/useProjects';
import { useProjectMembers } from './hooks/useProjectMembers';
import { useWindowHandlers } from './hooks/useWindowHandlers';
import { useSettings } from '../settings/useSettings';
import { RemovalModal } from '@/components/ui';
import {
  ProjectCard, ProjectFormModal, MembersModal, TasksModal,
  AnnouncementsModal, QuickAddTaskModal, ReadmeModal,
} from './components';
import { ParticleBackground } from '@/components/effects';
import ProjectsSkeleton from './components/ProjectsSkeleton';

import './styles/projects-layout.css';
import './styles/forms.css';
import './styles/announc&tasks.css';
import './styles/members.css';
import './styles/readme.css';

function ProjectsInner({ wmEnabled, restorerRef }) {
  const { user, loading: appLoading } = useApp();
  const { panelRef, resizerProps } = usePanelResize({ min: 220, max: 640 });
  const { prefs } = useSettings();
  const wm = useWindowManager();

  const workspaceMode = wmEnabled && (wm?.windows?.length ?? 0) > 0;

  const {
    projects, setProjects,
    loading: projectsLoading, error, isSubmitting,
    selectedProject, setSelectedProject,
    createForm, isCreateModalOpen, isEditModalOpen,
    editForm, setEditForm,
    activeTagFilter, setActiveTagFilter, allTags,
    setIsCreateModalOpen, setIsEditModalOpen,
    isDeleteModalOpen, setIsDeleteModalOpen,
    isTasksModalOpen, setIsTasksModalOpen,
    isMembersModalOpen, setIsMembersModalOpen,
    isAnnouncementsModalOpen, setIsAnnouncementsModalOpen,
    quickAddProject, setQuickAddProject,
    readmeProject, setReadmeProject,
    projectTasks, loadingTasks,
    handleCreate, handleEdit, handleDelete, handleStar,
    openDelete, openTasks, openMembers,
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

  const handleTransferOwnership = (memberId) =>
    _handleTransferOwnership(memberId, setSelectedProject);
  const handleProjectLeave = (project) =>
    _handleProjectLeave(project, setSelectedProject);

  const {
    openTasksHandler,
    openMembersHandler,
    openAnnouncementsHandler,
    openReadmeHandler,
    openQuickAddHandler,
    openCreateProjectHandler,
    openEditProjectHandler,
    attachRestorer,
  } = useWindowHandlers({
    wmEnabled, wm,
    user, projectsLoading, projects,
    createForm, isSubmitting,
    setProjects, setEditForm, setSelectedProject,
    setIsCreateModalOpen, setIsEditModalOpen, setReadmeProject,
    openTasks, openMembers, openAnnouncements, openQuickAdd,
    handleCreate, handleEdit,
    handleAnnouncementCreated, handleAnnouncementDeleted,
  });

  attachRestorer(restorerRef);

  if (appLoading || projectsLoading || !user) return <ProjectsSkeleton />;

  const projectsContent = (
    <>
      <div className={workspaceMode ? 'workspace-projects-header' : 'projects-header'}>
        <h2><i className="fas fa-folder-open"></i> Projects</h2>
        <div className="header-actions">
          <Link href="/dashboard" className="header-action-btn" title="View Dashboard">
            <i className="fas fa-arrow-left"></i>
          </Link>
          <button
            className="header-action-btn"
            onClick={openCreateProjectHandler}
            title="Add New Project"
          >
            <i className="fas fa-folder-plus"></i>
          </button>
          <Link href="/tasks" className="header-action-btn" title="View Tasks">
            <i className="fas fa-arrow-right"></i>
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
          <p>
            {activeTagFilter
              ? `No projects tagged "${activeTagFilter}".`
              : "You don't have any projects yet."}
          </p>
          {activeTagFilter ? (
            <button className="btn btn-secondary" onClick={() => setActiveTagFilter('')}>Clear filter</button>
          ) : (
            <button className="btn btn-primary" onClick={openCreateProjectHandler}>
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
              onOpen={openTasksHandler}
              onEdit={openEditProjectHandler}
              onDelete={openDelete}
              onMembers={openMembersHandler}
              onLeave={handleProjectLeave}
              onAnnouncements={openAnnouncementsHandler}
              onStar={handleStar}
              onQuickAdd={openQuickAddHandler}
              onReadme={openReadmeHandler}
            />
          ))}
        </div>
      )}
    </>
  );

  const modals = (
    <>
      {(isCreateModalOpen || isEditModalOpen) && (
        <ProjectFormModal
          mode={isCreateModalOpen ? "create" : "edit"}
          formData={isCreateModalOpen ? createForm : editForm}
          onSubmit={isCreateModalOpen ? handleCreate : handleEdit}
          onClose={() => {
            setIsCreateModalOpen(false);
            setIsEditModalOpen(false);
          }}
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
          onAdded={() =>
            setProjects((prev) =>
              prev.map((p) =>
                p.id === quickAddProject.id
                  ? { ...p, task_count: (p.task_count ?? 0) + 1 }
                  : p
              )
            )
          }
        />
      )}
      {readmeProject && (
        <ReadmeModal
          project={readmeProject}
          isOwner={readmeProject.owner_id === user.id}
          onClose={() => setReadmeProject(null)}
        />
      )}
    </>
  );

  if (workspaceMode) {
    return (
      <div className="workspace-root">
        <div ref={panelRef} className="workspace-projects-panel">
          <div className="workspace-panel-resizer" {...resizerProps} />
          {projectsContent}
        </div>

        <div className="workspace-canvas" aria-hidden="true">
          {prefs.workspace_background_enabled && (
            <ParticleBackground
              mouseInteraction={true}
              lineOpacity={0.6}
              particleOpacity={0.3}
              speed={0.3}
            />
          )}
        </div>

        {modals}
      </div>
    );
  }

  return (
    <div className="page-content">
      {projectsContent}
      {modals}
    </div>
  );
}

export default function Projects() {
  const { prefs, loading } = useSettings();
  const [wmEnabled, setWmEnabled] = useState(false);
  const [mounted, setMounted] = useState(false);

  const restorerRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!loading) {
      const isMobile = window.innerWidth <= 768;
      setWmEnabled(prefs.floating_windows_enabled && !isMobile);
    }
  }, [prefs.floating_windows_enabled, loading]);

  const snapPattern = prefs.snap_pattern ?? 'free';
  const snapEnabled = (prefs.snap_windows_enabled ?? false) && snapPattern !== 'free';

  return (
    <WindowManagerProvider
      enabled={wmEnabled}
      snapEnabled={snapEnabled}
      snapPattern={snapPattern}
      restorerRef={restorerRef}
    >
      <ProjectsInner wmEnabled={wmEnabled} mounted={mounted} restorerRef={restorerRef} />
    </WindowManagerProvider>
  );
}