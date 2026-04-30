'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Tooltip } from 'react-tooltip';
import { useApp } from '@/context';
import { useTasks } from './hooks/useTasks';
import { TaskItem, TaskDetailModal, TaskFormModal } from './components';
import { RemovalModal, ExportButton, myTasksExportOptions } from '@/components/ui';
import './styles/task-item.css';
import './styles/task-modals.css';
import './styles/tasks-layout.css';

export const TasksSkeleton = () => (
  <div className="page-content">
    <header className="dashboard-header" style={{ padding: '0 20px' }}>
      <div style={{ width: '100%' }}>
        <div className="skeleton skeleton-title" style={{ width: '30%' }}></div>
        <div className="skeleton skeleton-subtitle" style={{ width: '20%' }}></div>
      </div>
    </header>
    <div className="skeleton-filter-bar">
      <div className="skeleton skeleton-filter-item"></div>
    </div>
    <div className="tasks-container" style={{ padding: '0 20px' }}>
      <div className="card">
        {[1, 2, 3].map((i) => <div key={i} className="skeleton-task-row"><div className="skeleton" style={{ width: '100%', height: '60px' }}></div></div>)}
      </div>
    </div>
  </div>
);

export default function Tasks() {
  const { user } = useApp();
  const {
    projects, loading, error, isSubmitting, filteredTasks,
    activeTab, setActiveTab,
    statusFilter, setStatusFilter, projectFilter, setProjectFilter, userFilter, setUserFilter,
    usersInSelectedProject, hasActiveFilters, clearFilters,
    createTask, updateTask, deleteTask, handleCommentCountChange, handleAttachmentCountChange
  } = useTasks();

  const [modalState, setModalState] = useState({ type: null, task: null });
  const closeModal = () => setModalState({ type: null, task: null });

  const handleFormSubmit = async (formData) => {
    const success = modalState.type === 'create'
      ? await createTask(formData)
      : await updateTask(modalState.task?.id, formData);
    if (success) closeModal();
  };

  const handleDeleteConfirm = async () => {
    const success = await deleteTask(modalState.task?.id);
    if (success) closeModal();
  };

  if (loading) return <TasksSkeleton />;

  return (
    <div className="page-content">
      <div className="tasks-header">
        <h2><i className="fas fa-tasks"></i> {activeTab === 'project' ? 'Project Tasks' : 'Personal Tasks'}</h2>
        <div className="header-actions">
          <ExportButton
            options={myTasksExportOptions()}
            label="Export My Tasks"
            icon="fa-file-csv"
            size="sm"
            align="right"
            title="Export your tasks"
            className="header-action-btn"
          />
          <Link href="/projects" className="header-action-btn" title="View Tasks">
            <i className="fas fa-arrow-left"></i>
          </Link>
          <Link href="/dashboard" className="header-action-btn" title="Go back to Dashboard">
            <i className="fas fa-chart-simple"></i>
          </Link>
          <button
            className="header-action-btn"
            onClick={() => setModalState({ type: 'create', task: null })}
            title="Add New Task"
          >
            <i className="fas fa-square-plus"></i>
          </button>
        </div>
      </div>

      <div className="tasks-tabs-container">
        <div className="task-tab-group">
          <button className={`task-tab-btn ${activeTab === 'project' ? 'active' : ''}`} onClick={() => setActiveTab('project')}>
            <i className="fas fa-briefcase"></i> Team Projects
            <div data-tooltip-id="team-info-tooltip" className="task-bio-info">
              <i className="fa-solid fa-circle-info"></i>
            </div>
          </button>
          <Tooltip id="team-info-tooltip" place="bottom">
            <div className="tooltip-content">
              <p>Tasks that belong to a shared project. Visible to all project members and can be assigned to specific teammates.</p>
            </div>
          </Tooltip>
        </div>

        <div className="task-tab-group">
          <button className={`task-tab-btn ${activeTab === 'personal' ? 'active' : ''}`} onClick={() => setActiveTab('personal')}>
            <i className="fas fa-user"></i> Personal To-Do
            <div data-tooltip-id="personal-info-tooltip" className="task-bio-info">
              <i className="fa-solid fa-circle-info"></i>
            </div>
          </button>
          <Tooltip id="personal-info-tooltip" place="bottom">
            <div className="tooltip-content">
              <p>Private tasks only visible to you. Great for reminders and personal work that isn't tied to a project.</p>
            </div>
          </Tooltip>
        </div>
      </div>

      <div className="tasks-filters">
        <div className="tasks-filter-group">
          {['All', 'Active', 'Completed'].map((f) => (
            <button key={f} onClick={() => setStatusFilter(f)} className={`btn ${statusFilter === f ? 'btn-primary' : 'btn-secondary'}`}>
              {f}
            </button>
          ))}
        </div>

        {activeTab === 'project' && (
          <>
            <select className="form-control tasks-filter-select" value={projectFilter} onChange={(e) => { setProjectFilter(e.target.value); setUserFilter(''); }}>
              <option value="">All Projects</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {projectFilter && (
              <select className="form-control tasks-filter-select" value={userFilter} onChange={(e) => setUserFilter(e.target.value)}>
                <option value="">All Members</option>
                {usersInSelectedProject.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            )}
          </>
        )}

        {hasActiveFilters && (
          <button className="btn btn-ghost tasks-filter-clear" onClick={clearFilters}><i className="fas fa-times"></i> Clear</button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="card">
        <div className="card-body tasks-card-body">
          {filteredTasks.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-filter"></i>
              <p>No {activeTab} tasks found.</p>
              <br />
              <button className="btn btn-secondary" onClick={() => setModalState({ type: 'create', task: null })}>
                <i className="fas fa-plus"></i> New Task
              </button>
            </div>
          ) : (
            <ul className="tasks-list">
              {filteredTasks.map((task) => (
                <TaskItem
                  key={task.id} task={task}
                  onDetail={(t) => setModalState({ type: 'detail', task: t })}
                  onEdit={(t) => setModalState({ type: 'edit', task: t })}
                  onDelete={(t) => setModalState({ type: 'delete', task: t })}
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      <TaskFormModal
        isOpen={modalState.type === 'create' || modalState.type === 'edit'}
        mode={modalState.type}
        initialData={modalState.task}
        projects={projects}
        isSubmitting={isSubmitting}
        activeTab={activeTab}
        onClose={closeModal}
        onSubmit={handleFormSubmit}
      />

      <RemovalModal
        isOpen={modalState.type === 'delete'}
        item={modalState.task}
        isSubmitting={isSubmitting}
        onClose={closeModal}
        onConfirm={handleDeleteConfirm}
        message={<>Are you sure you want to delete <strong>{modalState.task?.title}</strong>?</>}
      />

      <TaskDetailModal
        isOpen={modalState.type === 'detail'}
        task={modalState.task}
        onEdit={(t) => setModalState({ type: 'edit', task: t })}
        onClose={closeModal}
        onCommentAdded={() => handleCommentCountChange(modalState.task?.id, 1)}
        onCommentDeleted={() => handleCommentCountChange(modalState.task?.id, -1)}
        isProjectOwner={projects.find((p) => p.id === modalState.task?.project_id)?.owner_id === user?.id}
        onAttachmentCountChange={(amount) => handleAttachmentCountChange(modalState.task?.id, amount)}
      />
    </div>
  );
}