import Link from 'next/link';

export function QuickTaskModal({
  isOpen,
  onClose,
  projects,
  formData,
  setFormData,
  fieldErrors,
  setFieldErrors,
  isSubmitting,
  onSubmit
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Quick Add Task</h3>
          <button
            className="btn-icon"
            onClick={onClose}
            title="Close modal"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="modal-body dashboard-empty-project-modal">
            <p className="dashboard-warning-text">
              <i className="fas fa-exclamation-triangle"></i> You must create a project first.
            </p>
            <Link href="/projects" className="btn btn-primary" title="Go to projects page to create one">
              Create Project
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <div className="modal-body">
              <div className={`form-group ${fieldErrors.title ? 'has-error' : ''}`}>
                <label>Task Title *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Title or Small Description..."
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    if (fieldErrors.title) setFieldErrors((p) => ({ ...p, title: undefined }));
                  }}
                />
                {fieldErrors.title && (
                  <span className="field-error">
                    <i className="fas fa-exclamation-circle"></i> {fieldErrors.title}
                  </span>
                )}
              </div>

              <div className={`form-group ${fieldErrors.project_id ? 'has-error' : ''}`}>
                <label>Project *</label>
                <select
                  className="form-control"
                  value={formData.project_id}
                  onChange={(e) => {
                    setFormData({ ...formData, project_id: e.target.value });
                    if (fieldErrors.project_id) setFieldErrors((p) => ({ ...p, project_id: undefined }));
                  }}
                >
                  <option value="" disabled>Select Project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {fieldErrors.project_id && (
                  <span className="field-error">
                    <i className="fas fa-exclamation-circle"></i> {fieldErrors.project_id}
                  </span>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    className="form-control"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    title="Set the task priority level"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Deadline</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    title="Choose a completion deadline"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                title="Cancel and close"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
                title="Click to create the task"
              >
                {isSubmitting ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}