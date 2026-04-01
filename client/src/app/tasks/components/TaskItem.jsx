'use client';
import { useApp } from "@/context";
import { formatDate } from "@/lib";

export function TaskItem({ task, onDetail, onEdit, onDelete }) {
  const { user } = useApp();

  const hasEditRights = user?.id === task.project_owner_id || user?.id === task.assigned_user_id;

  return (
    <li
      id={`task-${task.id}`}
      className="tasks-item"
      onClick={() => onDetail(task)}
    >
      <div className="task-info-group">
        <h4 className="task-title">{task.title}</h4>
        {task.description && (
          <p className="task-description-preview">
            {task.description}
          </p>
        )}

        <div className="task-detail-row task-item-details">
          <span className="task-deadline-info" title="Deadline">
            <i className="fas fa-calendar"></i>
            {task.deadline ? formatDate(task.deadline) : 'No date'}
          </span>

          <span className="task-comment-count" title="Comments">
            <i className="fas fa-comment"></i>
            {task.comment_count || 0}
          </span>

          {task.assigned_user_name && (
            <>
              <span className="task-assigned-user" title={`Assigned to ${task.assigned_user_name}`}>
                <i className="fas fa-user"></i>
                {task.assigned_user_name.split(' ')[0]}
              </span>
              <span title="Created At">Created at: {formatDate(task.created_at)}</span>
            </>
          )}
        </div>
      </div>

      <div className="task-meta-group">
        <span className={`badge priority-${task.priority?.toLowerCase() || 'medium'}`} title="Priority">
          {task.priority || 'Medium'}
        </span>
        <span className="badge status-badge" title="Status">
          {task.status || 'To Do'}
        </span>
        {hasEditRights && (
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
        )}
      </div>
    </li>
  );
}