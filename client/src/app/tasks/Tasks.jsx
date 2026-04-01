'use client';
import { useState } from 'react';
import { useApp } from '@/context';
import { useTasks } from './useTasks';
import { TaskItem, DeleteTaskModal, TaskDetailModal, TaskFormModal } from './components';
import './tasks.css';

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
  } = useTasks(user);

  const [modalState, setModalState] = useState({ type: null, task: null });
  const closeModal = () => setModalState({ type: null, task: null });

  const handleFormSubmit = async (formData) => {
    const success = modalState.type === 'create'
      ? await createTask(formData)
      : await updateTask(modalState.task.id, formData);
    if (success) closeModal();
  };

  const handleDeleteConfirm = async (id) => {
    const success = await deleteTask(id);
    if (success) closeModal();
  };

  if (loading || !user) return (
    <div className="loading-state">
      <div className="pulse-ring"></div>
      <p>Loading Tasks...</p>
    </div>
  );

  return (
    <div className="page-content">
      <div className="tasks-header">
        <h2><i className="fas fa-tasks"></i> All Tasks</h2>
        <button className="btn btn-primary" onClick={() => setModalState({ type: 'create', task: null })}>
          <i className="fas fa-plus"></i> New Task
        </button>
      </div>

      <div className="tasks-filters">
        <div className="tasks-filter-group">
          {['All', 'Active', 'Completed'].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
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
            <option key={p.id} value={p.id}>{p.name}</option>
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
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        )}

        {hasActiveFilters && (
          <button className="btn btn-ghost tasks-filter-clear" onClick={clearFilters}>
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
                <button className="btn btn-secondary tasks-empty-btn" onClick={clearFilters}>Clear Filters</button>
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

      <DeleteTaskModal
        isOpen={modalState.type === 'delete'}
        task={modalState.task}
        isSubmitting={isSubmitting}
        onClose={closeModal}
        onConfirm={handleDeleteConfirm}
      />

      <TaskDetailModal
        isOpen={modalState.type === 'detail'}
        onEdit={(t) => setModalState({ type: 'edit', task: t })}
        task={modalState.task}
        onClose={closeModal}
        isProjectOwner={
          projects.find((p) => p.id === modalState.task?.project_id)?.owner_id === user?.id
        }
      />
    </div>
  );
}