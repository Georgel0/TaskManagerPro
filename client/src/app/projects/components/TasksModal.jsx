import { useRouter } from 'next/navigation';

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
            <p className="text-center text-secondary">Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <p className="empty-state">No tasks in this project yet.</p>
          ) : (
            <ul className="project-tasks-list">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="project-task-item"
                  onClick={() => handleTaskClick(task.id)}
                >
                  <div className="project-task-info">
                    <span className="project-task-title">{task.title}</span>
                    <span className="text-xs text-secondary">
                      <i className="fas fa-calendar"></i>{' '}
                      {task.deadline
                        ? new Date(task.deadline).toLocaleDateString()
                        : 'No deadline'}
                    </span>
                  </div>
                  <div className="project-task-meta">
                    <span className={`badge priority-${task.priority?.toLowerCase() || 'medium'}`}>
                      {task.priority || 'Medium'}
                    </span>
                    <span className="badge status-badge">{task.status}</span>
                    <i className="fas fa-arrow-right text-secondary"></i>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}