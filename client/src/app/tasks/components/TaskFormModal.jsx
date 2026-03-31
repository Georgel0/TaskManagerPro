'use client';
import { useState, useEffect } from 'react';
import { createTaskSchema, updateTaskSchema, validate } from '@/lib/validators';

export function TaskFormModal({ isOpen, onClose, onSubmit, mode, initialData, projects, isSubmitting }) {
  const [formData, setFormData] = useState({
    title: '', description: '', status: 'To Do', priority: 'Medium', deadline: '', project_id: ''
  });
  const [fieldErrors, setFieldErrors] = useState({});

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
    setFieldErrors({});
  }, [initialData, mode, isOpen]);

  if (!isOpen) return null;

  // Clear a single field's error as the user types
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const schema = mode === 'edit' ? updateTaskSchema : createTaskSchema;

    const payload = { ...formData };

    if (payload.project_id) {
      payload.project_id = Number(payload.project_id);
    } else {
      delete payload.project_id;
    }

    if (payload.deadline === '') payload.deadline = null;

    // For edit: skip validating deadline if it hasn't changed
    const dataToValidate = { ...payload };
    if (mode === 'edit' && initialData?.deadline) {
      const initialDateStr = new Date(initialData.deadline).toISOString().split('T')[0];
      if (formData.deadline === initialDateStr) {
        delete dataToValidate.deadline;
        delete payload.deadline;
      }
    }

    const errors = validate(schema, dataToValidate);
    if (errors) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    onSubmit(payload);
  };

  // Guard: no projects exist yet
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

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body modal-body-scroll">

            <div className={`form-group ${fieldErrors.title ? 'has-error' : ''}`}>
              <label>Task Title *</label>
              <input
                type="text"
                className="form-control"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
              />
              {fieldErrors.title && (
                <span className="field-error"><i className="fas fa-exclamation-circle"></i> {fieldErrors.title}</span>
              )}
            </div>

            {mode === 'create' && (
              <div className={`form-group ${fieldErrors.project_id ? 'has-error' : ''}`}>
                <label>Project *</label>
                <select
                  className="form-control"
                  value={formData.project_id}
                  onChange={(e) => handleChange('project_id', e.target.value)}
                >
                  <option value="" disabled>Select a project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {fieldErrors.project_id && (
                  <span className="field-error"><i className="fas fa-exclamation-circle"></i> {fieldErrors.project_id}</span>
                )}
              </div>
            )}

            <div className="form-row">
              <div className={`form-group ${fieldErrors.priority ? 'has-error' : ''}`}>
                <label>Priority</label>
                <select
                  className="form-control"
                  value={formData.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
                {fieldErrors.priority && (
                  <span className="field-error"><i className="fas fa-exclamation-circle"></i> {fieldErrors.priority}</span>
                )}
              </div>
              <div className={`form-group ${fieldErrors.status ? 'has-error' : ''}`}>
                <label>Status</label>
                <select
                  className="form-control"
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                >
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </select>
                {fieldErrors.status && (
                  <span className="field-error"><i className="fas fa-exclamation-circle"></i> {fieldErrors.status}</span>
                )}
              </div>
            </div>

            <div className={`form-group ${fieldErrors.deadline ? 'has-error' : ''}`}>
              <label>Deadline</label>
              <input
                type="date"
                className="form-control"
                value={formData.deadline}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => handleChange('deadline', e.target.value)}
              />
              {fieldErrors.deadline && (
                <span className="field-error"><i className="fas fa-exclamation-circle"></i> {fieldErrors.deadline}</span>
              )}
            </div>

            <div className={`form-group ${fieldErrors.description ? 'has-error' : ''}`}>
              <label>
                Description
                <span className="char-count text-secondary text-xs">
                  {formData.description.length}/2000
                </span>
              </label>
              <textarea
                className="form-control"
                value={formData.description}
                maxLength={2000}
                onChange={(e) => handleChange('description', e.target.value)}
              />
              {fieldErrors.description && (
                <span className="field-error"><i className="fas fa-exclamation-circle"></i> {fieldErrors.description}</span>
              )}
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