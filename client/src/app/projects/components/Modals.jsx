import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function ProjectActionMenu({ project, isOwner, onEdit, onDelete, onLeave, onAnnouncements }) {
  const [leaveConfirm, setLeaveConfirm] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <div className="action-dropdown-wrapper" ref={ref}>
      <button
        className="btn-icon"
        title="More actions"
        onClick={(e) => { e.stopPropagation(); setOpen((p) => !p); }}
      >
        <i className="fas fa-ellipsis-v"></i>
      </button>

      {open && (
        <div className="action-dropdown-menu">
          {isOwner ? (
            <>
              <button
                className="btn-icon edit-btn" title="Edit Project"
                onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(project); }}
              >
                <i className="fas fa-pencil-alt"></i>
              </button>
              <button
                className="btn-icon delete-btn" title="Delete Project"
                onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(project); }}
              >
                <i className="fas fa-trash"></i>
              </button>
            </>
          ) : (
            leaveConfirm ? (
              <div className="transfer-confirm" onClick={(e) => e.stopPropagation()}>
                <span className="transfer-confirm-text">Leave project?</span>
                <button className="btn btn-danger btn-sm" onClick={(e) => { e.stopPropagation(); onLeave(project); }}>Yes</button>
                <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); setLeaveConfirm(false); }}>No</button>
              </div>
            ) : (
              <button
                className="btn-icon btn-sm " title="Leave Project"
                onClick={(e) => { e.stopPropagation(); setLeaveConfirm(true); }}
              >
                <i className="fas fa-right-from-bracket"></i>
              </button>
            )
          )}
          <button
            className="project-announcement-count"
            title="View Broadcasts"
            onClick={(e) => { e.stopPropagation(); onAnnouncements(project); }}
          >
            <i className="fas fa-bullhorn"></i>
          </button>
        </div>
      )}
    </div>
  );
}



export function MemberActionMenu({ member, onRemove, onTransferClick }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <div className="action-dropdown-wrapper" ref={ref}>
      <button
        className="btn-icon"
        title="More actions"
        onClick={(e) => { e.stopPropagation(); setOpen((p) => !p); }}
      >
        <i className="fas fa-ellipsis-v"></i>
      </button>

      {open && (
        <div className="action-dropdown-menu">
          <button
            className="dropdown-item"
            title="Make Owner"
            onClick={(e) => { e.stopPropagation(); onTransferClick(member.id); setOpen(false); }}
          >
            <i className="fas fa-crown"></i>
          </button>
          <button
            className="dropdown-item text-danger"
            title="Remove Member"
            onClick={(e) => { e.stopPropagation(); onRemove(member.id); setOpen(false); }}
          >
            <i className="fas fa-user-minus"></i>
          </button>
        </div>
      )}
    </div>
  );
}



export function TasksModal({ project, tasks, loading, onClose }) {
  const router = useRouter();

  const handleTaskClick = (taskId) => {
    onClose();
    router.push(`/tasks?highlight=${taskId}`);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3><i className="fas fa-tasks"></i> {project.name}</h3>
          <button className="btn-icon" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body modal-body-scroll">
          {loading ? (
            <p>Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <>
              <p className="empty-state">No tasks in this project yet.</p>
              <Link href='/tasks' className="empty-state-btn" title='Tasks'>
                <i className="fas fa-arrow-right"></i> Tasks
              </Link>
            </>
          ) : (
            <ul className="project-tasks-list">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="project-task-item"
                  onClick={() => handleTaskClick(task.id)}
                >
                  <div>
                    <span className="project-task-item-title" >{task.title}</span>
                    <span title="Deadline">
                      <i className="fas fa-calendar"></i>{' '}
                      {task.deadline
                        ? new Date(task.deadline).toLocaleDateString()
                        : 'No deadline'}
                    </span>
                  </div>
                  <div>
                    <span className={`badge priority-${task.priority?.toLowerCase() || 'medium'}`} title="Priority">
                      {task.priority || 'Medium'}
                    </span>
                    <span className="badge status-badge" title="Status">{task.status}</span>
                    <i className="fas fa-arrow-right"></i>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} title='Close'>Close</button>
        </div>
      </div>
    </div>
  );
}



export function DeleteProjectModal({ project, onConfirm, onClose, isSubmitting }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="text-error">Confirm Deletion</h2>
        </div>

        <div className="modal-body">
          <p>
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