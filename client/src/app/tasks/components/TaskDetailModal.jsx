'use client';

export function TaskDetailModal({ isOpen, onClose, onEdit, task }) {
  if (!isOpen || !task) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{task.title}</h3>
          <button
            className="btn-icon edit-btn"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            title="Edit Task"
          >
            <i className="fas fa-pencil-alt"></i>
          </button>
        </div>
        <div className="modal-body task-detail-body">
          <div className="task-detail-badges">
            <span className={`badge priority-${task.priority?.toLowerCase() || 'medium'}`}>
              {task.priority || 'Medium'}
            </span>
            <span className="badge status-badge">{task.status || 'To Do'}</span>
          </div>

          <div className="task-detail-row">
            <i className="fas fa-calendar-alt text-secondary"></i>
            <span className="text-secondary text-sm">Deadline:</span>
            <span>{task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline set'}</span>
          </div>

          <div className="task-detail-section">
            <p className="task-detail-label">Description</p>
            <p className="task-detail-description">
              {task.description || <span className="text-secondary">No description provided.</span>}
            </p>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}