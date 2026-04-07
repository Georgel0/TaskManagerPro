'use client';
import { formatDate } from "@/lib";
import { useApp } from "@/context";

export function TaskItem({ task, onDetail, onEdit, onDelete }) {
  const { user } = useApp();

  const hasEditRights = user?.id === task.project_owner_id || user?.id === task.assigned_user_id;

  return (
    <li id={`task-${task.id}`} className="tasks-item" onClick={() => onDetail(task)}>
      <div className="task-info-group">
        <h4 className="task-title">{task.title}</h4>

        {task.description && (
          <p className="task-description-preview">{task.description}</p>
        )}

        <div className="task-detail-row task-item-details">
          <span className="task-project-name" title={`Project: ${task.project_name}`}>
            <i className="fas fa-folder"></i>
            {task.project_name}
          </span>
          <span className="task-deadline-info" title={`Deadline: ${task.deadline ? formatDate(task.deadline) : 'No deadline'}`}>
            <i className="fas fa-calendar"></i>
            {task.deadline ? formatDate(task.deadline) : 'No deadline'}
          </span>
          <span className="task-comment-count" title={`No. Of Comments: ${task.comment_count || 0}`}>
            <i className="fas fa-comment"></i>
            {task.comment_count || 0}
          </span>
          <span className="task-assigned-user" title={`Assigned User: ${task.assigned_user_name}`}>
            <i className="fas fa-user"></i>
            {task.assigned_user_name ? task.assigned_user_name.split(' ')[0] : 'Unassigned'}
          </span>
        </div>
      </div>

      <div className="task-meta-group">
        <div className="task-badges-wrapper">
          <span className={`badge priority-${task.priority?.toLowerCase() || 'medium'}`} title={`Priority: ${task.priority || 'Medium'}`}>
            {task.priority || 'Medium'}
          </span>
          <span className="badge status-badge" title={`Status: ${task.status || 'To Do'}`}>
            {task.status || 'To Do'}
          </span>
          <span className="task-created-at" title={`Created At: ${formatDate(task.created_at)}`}>
            <i className="fas fa-calendar-plus"></i>
            {formatDate(task.created_at)}
          </span>
        </div>

        {hasEditRights && (
          <div className="action-buttons">
            <button className="btn-icon edit-btn" onClick={(e) => { e.stopPropagation(); onEdit(task); }} title="Edit Task">
              <i className="fas fa-pencil-alt"></i>
            </button>
            <button className="btn-icon delete-btn" onClick={(e) => { e.stopPropagation(); onDelete(task); }} title="Delete Task">
              <i className="fas fa-trash"></i>
            </button>
          </div>
        )}
      </div>
    </li>
  );
}