'use client';
import { formatDate } from "@/lib";
import { useApp } from "@/context";
import { ArchiveButton } from '@/components/ui';
import { useArchive } from '@/hooks/useArchive';

export function TaskItem({ task, onDetail, onEdit, onDelete }) {
  const { user } = useApp();
  const { archiveTask } = useArchive();

  const isPersonal = !task.project_id;
  const hasEditRights = isPersonal ? (user?.id === task.assigned_user_id) : (user?.id === task.project_owner_id || user?.id === task.assigned_user_id);

  return (
    <li id={`task-${task.id}`} className="tasks-item" onClick={() => onDetail(task)}>
      <div className="task-info-group">
        <h4 className="task-title">{task.title}</h4>
        {task.description && <p className="task-description-preview">{task.description}</p>}

        <div className="task-detail-row task-item-details">
          {!isPersonal && (
            <span className="task-project-name" title={`Project: ${task.project_name}`}>
              <i className="fas fa-folder"></i> {task.project_name}
            </span>
          )}
          <span className="task-deadline-info" title={`Deadline: ${task.deadline ? formatDate(task.deadline) : 'No deadline'}`}>
            <i className="fas fa-calendar"></i> {task.deadline ? formatDate(task.deadline) : 'No deadline'}
          </span>
          <span className="task-comment-count">
            <i className="fas fa-comment"></i> {task.comment_count || 0}
          </span>
          {!isPersonal && (
            <span className="task-assigned-user" title={`Assigned User: ${task.assigned_user_name}`}>
              <i className="fas fa-user"></i> {task.assigned_user_name ? task.assigned_user_name.split(' ')[0] : 'Unassigned'}
            </span>
          )}
          <span className="task-comment-count">
            <i className="fas fa-paperclip"></i> {task.attachment_count || 0}
          </span>
        </div>
      </div>

      <div className="task-meta-group">
        <div className="task-badges-wrapper">
          <span className={`badge priority-${task.priority?.toLowerCase() || 'medium'}`}>{task.priority || 'Medium'}</span>
          <span className="badge status-badge">{task.status || 'To Do'}</span>
        </div>

        {hasEditRights && (
          <div className="action-buttons">
            <button className="btn-icon edit-btn" onClick={(e) => { e.stopPropagation(); onEdit(task); }}><i className="fas fa-pencil-alt"></i></button>
            <ArchiveButton type="task" id={task.id} name={task.title} onArchive={archiveTask} />
            <button className="btn-icon delete-btn" onClick={(e) => { e.stopPropagation(); onDelete(task); }}><i className="fas fa-trash"></i></button>
          </div>
        )}
      </div>
    </li>
  );
}