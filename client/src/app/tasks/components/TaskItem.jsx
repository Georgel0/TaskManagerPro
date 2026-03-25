'use client';

export function TaskItem({ task, onDetail, onEdit, onDelete }) {
  return (
    <li
      id={`task-${task.id}`}
      className="tasks-item"
      onClick={() => onDetail(task)}
    >
      <div className="task-info-group">
        <h4 className="task-title">{task.title}</h4>
        {task.description && (
          <p className="task-description-preview text-xs text-secondary">
            {task.description}
          </p>
        )}
        <span className="text-xs text-secondary">
          <i className="fas fa-calendar"></i> Due: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}
        </span>
      </div>
      
      <div className="task-meta-group">
        <span className={`badge priority-${task.priority?.toLowerCase() || 'medium'}`}>
          {task.priority || 'Medium'}
        </span>
        <span className="badge status-badge">
          {task.status || 'To Do'}
        </span>
        
        <div className="action-buttons">
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
          <button
            className="btn-icon delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task);
            }}
            title="Delete Task"
          >
            <i className="fas fa-trash"></i>
          </button>
        </div>
      </div>
    </li>
  );
}