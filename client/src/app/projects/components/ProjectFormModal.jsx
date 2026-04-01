import { useState, useEffect } from 'react';
import { createProjectSchema, updateProjectSchema, validate } from '@/lib/validators';

export function ProjectFormModal({ mode = 'create', formData, setFormData, onSubmit, onClose, isSubmitting }) {
  const isEdit = mode === 'edit';
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    setFieldErrors({});
  }, [mode, onClose]);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const schema = isEdit ? updateProjectSchema : createProjectSchema;
    const errors = validate(schema, formData);

    if (errors) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    onSubmit(e);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Project' : 'Create New Project'}</h3>
          <button className="btn-icon" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">

            <div className={fieldErrors.name ? 'has-error' : ''}>
              <label>Project Name *</label>
              <input
                type="text"
                className="form-control"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
              {fieldErrors.name && (
                <span className="field-error">
                  <i className="fas fa-exclamation-circle"></i> {fieldErrors.name}
                </span>
              )}
            </div>

            <div className={fieldErrors.description ? 'has-error' : ''}>
              <label>
                Description
                <span className="char-count text-secondary text-xs">
                  {formData.description?.length ?? 0}/2000
                </span>
              </label>
              <textarea
                className="form-control"
                value={formData.description}
                maxLength={2000}
                onChange={(e) => handleChange('description', e.target.value)}
              />
              {fieldErrors.description && (
                <span className="field-error">
                  <i className="fas fa-exclamation-circle"></i> {fieldErrors.description}
                </span>
              )}
            </div>

          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting
                ? isEdit ? 'Saving...' : 'Creating...'
                : isEdit ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}