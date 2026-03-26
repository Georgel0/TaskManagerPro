'use client';
import { useState, useEffect } from 'react';

export function TaskFormModal({ isOpen, onClose, onSubmit, mode, initialData, projects, isSubmitting }) {
  const [formData, setFormData] = useState({
    title: '', description: '', status: 'To Do', priority: 'Medium', deadline: '', project_id: ''
  });

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        title: initialData.title,
        description: initialData.description || '',
        status: initialData.status || 'To Do',
        priority: initialData.priority || 'Medium',
        deadline: initialData.deadline ? new Date(initialData.deadline).toISOString().split('T')[0] : '',
        project_id: initialData.project_id || ''
      });
    } else {
      setFormData({ title: '', description: '', status: 'To Do', priority: 'Medium', deadline: '', project_id: '' });
    }
  }, [initialData, mode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Guard clause for creating when no projects exist
  if (mode === 'create' && projects.length === 0) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Create New Task</h3>
            <button className="btn-icon" onClick={onClose}><i className="fas fa-times"></i></button>
          </div>
          <div className="modal-body text-center">
            <p className="text-warning mb-2">
              <i className="fas fa-exclamation-triangle"></i> You need to create a project first before adding tasks.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{mode === 'edit' ? 'Edit Task' : 'Create New Task'}</h3>
          <button className="btn-icon" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body modal-body-scroll">
            <div className="form-group">
              <label>Task Title *</label>
              <input type="text" className="form-control" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
            </div>

            {mode === 'create' && (
              <div className="form-group">
                <label>Project *</label>
                <select className="form-control" required value={formData.project_id} onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}>
                  <option value="" disabled>Select a project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>Priority</label>
                <select className="form-control" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select className="form-control" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Deadline</label>
              <input type="date" className="form-control" value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea className="form-control" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}></textarea>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (mode === 'edit' ? 'Save Changes' : 'Create Task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}