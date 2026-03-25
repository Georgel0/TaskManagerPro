export function DeleteProjectModal({ project, onConfirm, onClose, isSubmitting }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="text-error">Confirm Deletion</h2>
        </div>

        <div className="modal-body">
          <p className="mb-3 text-secondary">
            Are you sure you want to delete <strong>{project?.name}</strong>?
            This action is permanent and all tasks will be removed.
          </p>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}