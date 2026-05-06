'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context';
import { useProjects } from './hooks/useProjects';
import { useProjectMembers } from './hooks/useProjectMembers';
import { useSettings } from '../settings/useSettings';
import { RemovalModal } from '@/components/ui';
import { WindowManagerProvider, useWindowManager } from '@/components/layout';
import {
  ProjectCard, ProjectFormModal, MembersModal, TasksModal,
  AnnouncementsModal, QuickAddTaskModal, ReadmeModal,
  TasksWindowContent, MembersWindowContent
} from './components';

import './styles/projects-layout.css';
import './styles/forms.css';
import './styles/announc&tasks.css';
import './styles/members.css';
import './styles/readme.css';

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

function ProjectsInner({ wmEnabled }) {
  const { user, loading: appLoading } = useApp();
  const wm = useWindowManager();

  const {
    projects, setProjects,
    loading: projectsLoading, error, isSubmitting,
    selectedProject, setSelectedProject,
    createForm, setCreateForm,
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


  const openTasksHandler = (project) => {
    if (wmEnabled && wm) {
      wm.openWindow('tasks', `${project.name} — Tasks`, (close) => (
        <TasksWindowContent project={project} onClose={close} />
      ));
    } else {
      openTasks(project);
    }
  };

  const openMembersHandler = (project) => {
    if (wmEnabled && wm) {
      wm.openWindow('members', `${project.name} — Team`, (close) => (
        <MembersWindowContent
          project={project}
          currentUserId={user.id}
          isOwner={project.owner_id === user.id}
          onClose={close}
        />
      ));
    } else {
      openMembers(project);
    }
  };

  const openAnnouncementsHandler = (project) => {
    if (wmEnabled && wm) {
      wm.openWindow('announcements', `${project.name} — Announcements`, (close) => (
        <AnnouncementsModal
          project={project}
          isOwner={project.owner_id === user.id}
          onClose={close}
          onAnnouncementCreated={() => handleAnnouncementCreated(project.id)}
          onAnnouncementDeleted={() => handleAnnouncementDeleted(project.id)}
        />
      ));
    } else {
      openAnnouncements(project);
    }
  };

  const openReadmeHandler = (project) => {
    if (wmEnabled && wm) {
      wm.openWindow('readme', `${project.name} — README`, (close) => (
        <ReadmeModal
          project={project}
          isOwner={project.owner_id === user.id}
          onClose={close}
        />
      ));
    } else {
      setReadmeProject(project);
    }
  };

  const openQuickAddHandler = (project) => {
    if (wmEnabled && wm) {
      wm.openWindow('quickAdd', `Quick Add — ${project.name}`, (close) => (
        <QuickAddTaskModal
          project={project}
          onClose={close}
          onAdded={() =>
            setProjects((prev) =>
              prev.map((p) =>
                p.id === project.id
                  ? { ...p, task_count: (p.task_count ?? 0) + 1 }
                  : p
              )
            )
          }
        />
      ));
    } else {
      openQuickAdd(project);
    }
  };

  const openCreateProjectHandler = () => {
    if (wmEnabled && wm) {
      wm.openWindow('create-project', 'Create New Project', (close) => (
        <ProjectFormModal
          mode="create"
          formData={createForm}
          onSubmit={(e, members, data) => {
            handleCreate(e, members, data);
            close();
          }}
          onClose={close}
          isSubmitting={isSubmitting}
        />
      ));
    } else {
      setIsCreateModalOpen(true);
    }
  };

  const openEditProjectHandler = (project) => {
    const projectData = {
      name: project.name,
      description: project.description || '',
      tags: project.tags || [],
      color: project.color || null
    };

    setEditForm(projectData);
    setSelectedProject(project);

    if (wmEnabled && wm) {
      wm.openWindow(`edit-${project.id}`, `Edit: ${project.name}`, (close) => (
        <ProjectFormModal
          mode="edit"
          formData={projectData}
          onSubmit={(e, members, data) => {
            handleEdit(e, members, data);
            close();
          }}
          onClose={close}
          isSubmitting={isSubmitting}
        />
      ));
    } else {
      setIsEditModalOpen(true);
    }
  };

  if (appLoading || projectsLoading || !user) return <ProjectsSkeleton />;

  return (
    <div className="page-content">
      <div className="projects-header">
        <h2><i className="fas fa-folder-open"></i> My Projects</h2>
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
            <button className="btn btn-secondary" onClick={() => setActiveTagFilter('')}>
              Clear filter
            </button>
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

      <RemovalModal
        isOpen={isDeleteModalOpen}
        item={selectedProject}
        message={
          <>Are you sure you want to delete <strong>{selectedProject?.name}</strong>?</>
        }
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
    </div>
  );
}

export default function Projects() {
  const { prefs, loading } = useSettings();
  const [wmEnabled, setWmEnabled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading) {
      const isMobile = window.innerWidth <= 768;
      setWmEnabled(prefs.floating_windows_enabled && !isMobile);
    }
  }, [prefs.floating_windows_enabled, loading]);

  return (
    <WindowManagerProvider enabled={wmEnabled}>
      <ProjectsInner wmEnabled={wmEnabled} mounted={mounted} />
    </WindowManagerProvider>
  );
}