'use client';
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { formatDate } from "@/lib";
import { useApp } from "@/context";
import { ArchiveButton } from '@/components/ui';
import { useArchive } from '@/hooks/useArchive';

export function TaskItem({ task, onDetail, onEdit, onDelete }) {
  const { user } = useApp();
  const { archiveTask } = useArchive();

  const isPersonal = !task.project_id;
  const hasEditRights = isPersonal ? (user?.id === task.assigned_user_id) : (user?.id === task.project_owner_id || user?.id === task.assigned_user_id);

  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target) 
        && !e.target.closest('.archive-confirm-popover')
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleToggle = (e) => {
    e.stopPropagation();
    if (!open) {
      // Calculate position before opening
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.right - 90 + window.scrollX,
      });
    }
    setOpen(!open);
  };

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
          <div className="tasks-dropdown-wrapper">
            <button
              ref={triggerRef}
              className="btn-icon"
              title="More actions"
              onClick={handleToggle}
            >
              <i className="fas fa-ellipsis-v"></i>
            </button>

            {open && createPortal(
              <div
                ref={menuRef}
                className="tasks-dropdown-menu"
                style={{
                  position: 'absolute',
                  top: `${coords.top}px`,
                  left: `${coords.left}px`,
                  zIndex: 9999
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="btn-icon dropdown-edit-btn"
                  onClick={(e) => { e.stopPropagation(); onEdit(task); setOpen(false); }}
                  title="Edit Task"
                >
                  <i className="fas fa-pencil-alt"></i> Edit
                </button>
                <ArchiveButton
                  text={true}
                  type="task"
                  id={task.id}
                  name={task.title}
                  onArchive={(id) => { archiveTask(id); setOpen(false); }}
                />
                <button
                  className="btn-icon dropdown-delete-btn"
                  onClick={(e) => { e.stopPropagation(); onDelete(task); setOpen(false); }}
                  title="Delete Task"
                >
                  <i className="fas fa-trash"></i> Delete
                </button>
              </div>,
              document.body
            )}
          </div>
        )}
      </div>
    </li>
  );
}