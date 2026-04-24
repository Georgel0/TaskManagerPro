'use client';
import { useState } from 'react';
import { useApp } from '@/context';
import { useTasks } from './hooks/useTasks';
import { TaskItem, TaskDetailModal, TaskFormModal } from './components';
import { RemovalModal } from '@/components/ui';
import './styles/task-item.css';
import './styles/task-modals.css';
import './styles/tasks-layout.css';

const TasksSkeleton = () => (
  <div className="page-content">
    <header className="dashboard-header" style={{ padding: '0 20px' }}>
      <div style={{ width: '100%' }}>
        <div className="skeleton skeleton-title" style={{ width: '30%' }}></div>
        <div className="skeleton skeleton-subtitle" style={{ width: '20%' }}></div>
      </div>
      <div className="dashboard-header-actions">
        <div className="skeleton skeleton-btn"></div>
      </div>
    </header>

    <div className="skeleton-filter-bar">
      <div className="skeleton skeleton-filter-item"></div>
      <div className="skeleton skeleton-filter-item"></div>
      <div className="skeleton skeleton-filter-item"></div>
      <div className="skeleton skeleton-btn" style={{ width: '100px' }}></div>
    </div>

    <div className="tasks-container" style={{ padding: '0 20px' }}>
      <div className="card">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skeleton-task-row">
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ width: '40%', height: '20px', marginBottom: '10px' }}></div>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div className="skeleton" style={{ width: '80px', height: '12px' }}></div>
                <div className="skeleton" style={{ width: '80px', height: '12px' }}></div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div className="skeleton" style={{ width: '60px', height: '20px', borderRadius: '12px' }}></div>
              <div className="skeleton" style={{ width: '60px', height: '20px', borderRadius: '12px' }}></div>
              <div className="skeleton" style={{ width: '30px', height: '30px', borderRadius: '4px' }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function Tasks() {
  const { user } = useApp();
  const {
    projects, loading, error, isSubmitting,
    filteredTasks,
    statusFilter, setStatusFilter,
    projectFilter, setProjectFilter,
    userFilter, setUserFilter,
    usersInSelectedProject,
    hasActiveFilters, clearFilters,
    createTask, updateTask, deleteTask,
    handleCommentCountChange, handleAttachmentCountChange
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

  if (loading) {
    return <TasksSkeleton />;
  }

  return (
    <div className="page-content">
      <div className="tasks-header">
        <h2><i className="fas fa-tasks"></i> All Tasks</h2>
        <button className="btn btn-primary" onClick={() => setModalState({ type: 'create', task: null })} title="Add New Task">
          <i className="fas fa-plus"></i> New Task
        </button>
      </div>

      <div className="tasks-filters">
        <div className="tasks-filter-group">
          {['All', 'Active', 'Completed'].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              title={`Filter: ${f}`}
              className={`btn ${statusFilter === f ? 'btn-primary' : 'btn-secondary'}`}
            >
              {f}
            </button>
          ))}
        </div>

        <select
          className="form-control tasks-filter-select"
          value={projectFilter}
          onChange={(e) => { setProjectFilter(e.target.value); setUserFilter(''); }}
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id} title={p.name}>{p.name}</option>
          ))}
        </select>

        {projectFilter && (
          <select
            className="form-control tasks-filter-select"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
          >
            <option value="">All Members</option>
            {usersInSelectedProject.map((u) => (
              <option key={u.id} value={u.id} title={u.name}>{u.name}</option>
            ))}
          </select>
        )}

        {hasActiveFilters && (
          <button className="btn btn-ghost tasks-filter-clear" onClick={clearFilters} title="Clear Filters">
            <i className="fas fa-times"></i> Clear
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="card">
        <div className="card-body tasks-card-body">
          {filteredTasks.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-filter"></i>
              <p>No tasks match the current filters.</p>
              {hasActiveFilters && (
                <button className="btn btn-secondary tasks-empty-btn" onClick={clearFilters} title="Clear Filters">Clear Filters</button>
              )}
            </div>
          ) : (
            <ul className="tasks-list">
              {filteredTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
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
        onClose={closeModal}
        onSubmit={handleFormSubmit}
      />

      <RemovalModal
        isOpen={modalState.type === 'delete'}
        item={modalState.task}
        isSubmitting={isSubmitting}
        onClose={closeModal}
        onConfirm={handleDeleteConfirm}
        message={<>Are you sure you want to delete <strong>{modalState.task?.title}</strong>? This action is permanent.</>}
      />

      <TaskDetailModal
        isOpen={modalState.type === 'detail'}
        onEdit={(t) => setModalState({ type: 'edit', task: t })}
        task={modalState.task}
        onClose={closeModal}
        onCommentAdded={() => handleCommentCountChange(modalState.task?.id, 1)}
        onCommentDeleted={() => handleCommentCountChange(modalState.task?.id, -1)}
        isProjectOwner={
          projects.find((p) => p.id === modalState.task?.project_id)?.owner_id === user?.id
        }
        onAttachmentCountChange={(amount) => handleAttachmentCountChange(modalState.task?.id, amount)}
      />
    </div>
  );
}