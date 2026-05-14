import {
  ProjectFormModal, MembersModal, TasksModal,
  AnnouncementsModal, QuickAddTaskModal, ReadmeModal,
  TasksWindowContent, MembersWindowContent,
} from '../components';

export function useWindowHandlers({
  wmEnabled, wm,
  user, projectsLoading, projects,
  createForm, isSubmitting,
  setProjects, setEditForm, setSelectedProject,
  setIsCreateModalOpen, setIsEditModalOpen, setReadmeProject,
  openTasks, openMembers, openAnnouncements, openQuickAdd,
  handleCreate, handleEdit,
  handleAnnouncementCreated, handleAnnouncementDeleted,
}) {

  const openTasksHandler = (project) => {
    if (wmEnabled && wm) {
      wm.openWindow(
        'tasks',
        `${project.name} — Tasks`,
        (close) => <TasksWindowContent project={project} onClose={close} />,
        { projectId: project.id }
      );
    } else {
      openTasks(project);
    }
  };

  const openMembersHandler = (project) => {
    if (wmEnabled && wm) {
      wm.openWindow(
        'members',
        `${project.name} — Team`,
        (close) => (
          <MembersWindowContent
            project={project}
            currentUserId={user.id}
            isOwner={project.owner_id === user.id}
            onClose={close}
          />
        ),
        { projectId: project.id }
      );
    } else {
      openMembers(project);
    }
  };

  const openAnnouncementsHandler = (project) => {
    if (wmEnabled && wm) {
      wm.openWindow(
        'announcements',
        `${project.name} — Announcements`,
        (close) => (
          <AnnouncementsModal
            project={project}
            isOwner={project.owner_id === user.id}
            onClose={close}
            onAnnouncementCreated={() => handleAnnouncementCreated(project.id)}
            onAnnouncementDeleted={() => handleAnnouncementDeleted(project.id)}
          />
        ),
        { projectId: project.id }
      );
    } else {
      openAnnouncements(project);
    }
  };

  const openReadmeHandler = (project) => {
    if (wmEnabled && wm) {
      wm.openWindow(
        'readme',
        `${project.name} — README`,
        (close) => (
          <ReadmeModal
            project={project}
            isOwner={project.owner_id === user.id}
            onClose={close}
          />
        ),
        { projectId: project.id }
      );
    } else {
      setReadmeProject(project);
    }
  };

  const openQuickAddHandler = (project) => {
    if (wmEnabled && wm) {
      wm.openWindow(
        'quickAdd',
        `Quick Add — ${project.name}`,
        (close) => (
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
        ),
        { projectId: project.id }
      );
    } else {
      openQuickAdd(project);
    }
  };

  const openCreateProjectHandler = () => {
    if (wmEnabled && wm) {
      wm.openWindow(
        'create-project',
        'Create New Project',
        (close) => (
          <ProjectFormModal
            mode="create"
            formData={createForm}
            onSubmit={(e, members, data) => { handleCreate(e, members, data); close(); }}
            onClose={close}
            isSubmitting={isSubmitting}
          />
        ),
        {}
      );
    } else {
      setIsCreateModalOpen(true);
    }
  };

  const openEditProjectHandler = (project) => {
    const projectData = {
      name: project.name,
      description: project.description || '',
      tags: project.tags || [],
      color: project.color || null,
    };
    setEditForm(projectData);
    setSelectedProject(project);

    if (wmEnabled && wm) {
      wm.openWindow(
        `edit-${project.id}`,
        `Edit: ${project.name}`,
        (close) => (
          <ProjectFormModal
            mode="edit"
            formData={projectData}
            onSubmit={(e, members, data) => { handleEdit(e, members, data); close(); }}
            onClose={close}
            isSubmitting={isSubmitting}
          />
        ),
        { projectId: project.id }
      );
    } else {
      setIsEditModalOpen(true);
    }
  };

  const attachRestorer = (restorerRef) => {
    if (!restorerRef) return;

    restorerRef.current = (type, meta, close) => {
      if (projectsLoading || !user) {
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.5 }}>
            <i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }} />
            Loading…
          </div>
        );
      }

      const project = meta?.projectId
        ? projects.find((p) => p.id === meta.projectId) ?? null
        : null;

      if (meta?.projectId && !project) {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, opacity: 0.6 }}>
            <i className="fas fa-folder-open" style={{ fontSize: 32 }} />
            <span>Project no longer available.</span>
            <button className="btn btn-secondary" onClick={close}>Close</button>
          </div>
        );
      }

      const isOwner = project ? project.owner_id === user.id : false;

      if (type === 'tasks') {
        return <TasksWindowContent project={project} onClose={close} />;
      }

      if (type === 'members') {
        return (
          <MembersWindowContent
            project={project}
            currentUserId={user.id}
            isOwner={isOwner}
            onClose={close}
          />
        );
      }

      if (type === 'announcements') {
        return (
          <AnnouncementsModal
            project={project}
            isOwner={isOwner}
            onClose={close}
            onAnnouncementCreated={() => handleAnnouncementCreated(project.id)}
            onAnnouncementDeleted={() => handleAnnouncementDeleted(project.id)}
          />
        );
      }

      if (type === 'readme') {
        return <ReadmeModal project={project} isOwner={isOwner} onClose={close} />;
      }

      if (type === 'quickAdd') {
        return (
          <QuickAddTaskModal
            project={project}
            onClose={close}
            onAdded={() =>
              setProjects((prev) =>
                prev.map((p) =>
                  p.id === project.id ? { ...p, task_count: (p.task_count ?? 0) + 1 } : p
                )
              )
            }
          />
        );
      }

      if (type === 'create-project') {
        return (
          <ProjectFormModal
            mode="create"
            formData={createForm}
            onSubmit={(e, members, data) => { handleCreate(e, members, data); close(); }}
            onClose={close}
            isSubmitting={isSubmitting}
          />
        );
      }

      if (type.startsWith('edit-') && project) {
        const formData = {
          name: project.name,
          description: project.description || '',
          tags: project.tags || [],
          color: project.color || null,
        };
        return (
          <ProjectFormModal
            mode="edit"
            formData={formData}
            onSubmit={(e, members, data) => { handleEdit(e, members, data); close(); }}
            onClose={close}
            isSubmitting={isSubmitting}
          />
        );
      }

      return null;
    };
  };

  return {
    openTasksHandler,
    openMembersHandler,
    openAnnouncementsHandler,
    openReadmeHandler,
    openQuickAddHandler,
    openCreateProjectHandler,
    openEditProjectHandler,
    attachRestorer,
  };
}