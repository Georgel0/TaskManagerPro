'use client';

export function DeleteTaskModal({ isOpen, onClose, onConfirm, task, isSubmitting }) {
  if (!isOpen || !task) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title-error">Confirm Deletion</h2>
        </div>
        <div className="modal-body">
          <p className="modal-confirm-text">
            Are you sure you want to delete <strong>{task.title}</strong>? This action is permanent.
          </p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button onClick={() => onConfirm(task.id)} className="btn btn-danger" disabled={isSubmitting}>
            {isSubmitting ? 'Deleting..' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}