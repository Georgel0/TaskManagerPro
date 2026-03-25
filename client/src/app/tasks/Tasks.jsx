'use client';
import { useState } from 'react';
import { useApp } from '@/context';
import { useTasks } from './useTasks';
import { TaskItem, DeleteTaskModal, TaskDetailModal, TaskFormModal } from './components';
import './tasks.css';

export default function Tasks() {
  const { user } = useApp();
  const { 
    projects, loading, error, filter, setFilter, isSubmitting, 
    filteredTasks, createTask, updateTask, deleteTask 
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
    <div className='loading-state'>
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
        {['All', 'Active', 'Completed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="card">
        <div className="card-body p-0">
          {filteredTasks.length === 0 ? (
            <p className="empty-state">No tasks found for this filter.</p>
          ) : (
            <ul className="tasks-list">
              {filteredTasks.map(task => (
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
      />
    </div>
  );
}