import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useArchive } from '@/hooks/useArchive';
import { ArchiveButton, ExportButton, projectExportOptions, myTasksExportOptions } from "@/components/ui";

export function ProjectActionMenu({ project, isOwner, onEdit, onDelete, onLeave }) {
  const [leaveConfirm, setLeaveConfirm] = useState(false);
  const [open, setOpen] = useState(false);
  const { archiveProject } = useArchive();
  const ref = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (
        ref.current &&
        !ref.current.contains(e.target) &&
        !e.target.closest('.archive-confirm-popover')
      ) {
        setOpen(false);
      }
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
                className="btn-icon dropdown-edit-btn" title="Edit Project"
                onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(project); }}
              >
                <i className="fas fa-pencil-alt"></i> Edit
              </button>
              <ArchiveButton
                text={true}
                type="project"
                id={project.id}
                name={project.name}
                onArchive={archiveProject}
              />
              <button
                className="btn-icon dropdown-delete-btn" title="Delete Project"
                onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(project); }}
              >
                <i className="fas fa-trash"></i> Delete
              </button>
              <ExportButton 
                options={isOwner ? projectExportOptions(project.id) : myTasksExportOptions({ project_id: project.id })}
                variant="modal"
                size="md"
                sizeDep={false}
              />
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
                className="btn-icon btn-sm" title="Leave Project"
                onClick={(e) => { e.stopPropagation(); setLeaveConfirm(true); }}
              >
                <i className="fas fa-right-from-bracket"></i> Leave
              </button>
            )
          )}
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
            <i className="fas fa-crown"></i> Promote
          </button>
          <button
            className="dropdown-item text-danger"
            title="Remove Member"
            onClick={(e) => { e.stopPropagation(); onRemove(member.id); setOpen(false); }}
          >
            <i className="fas fa-user-minus"></i> Kick
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

const API = process.env.NEXT_PUBLIC_API_URL;
const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

export function TasksWindowContent({ project, onClose }) {
  const { data: tasks = [], isFetching: loading } = useQuery({
    queryKey: ['projects', project.id, 'tasks'],
    queryFn: async () => {
      const res = await fetch(`${API}/tasks?project_id=${project.id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to fetch tasks');
      return res.json();
    },
    enabled: !!project.id,
  });

  return <TasksModal project={project} tasks={tasks} loading={loading} onClose={onClose} />;
}


export function QuickAddTaskModal({ project, onClose, onAdded }) {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ title: title.trim(), project_id: project.id, status: 'To Do', priority: 'Medium' }),
      });
      if (!res.ok) throw new Error('Failed to create task');
      onAdded?.();
      onClose();
    } catch {
      // silently fail — user can go to tasks page for full form
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content quick-add-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3><i className="fas fa-plus"></i> Quick Add Task</h3>
          <button className="btn-icon" onClick={onClose}><i className="fas fa-times"></i></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p className="quick-add-project-label">
              <i className="fas fa-folder"></i> {project.name}
            </p>
            <div className="form-group">
              <label>Task Title *</label>
              <input
                type="text"
                className="form-control"
                placeholder="What needs to be done?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>
            <Link href={`/tasks?project_id=${project.id}`} className="quick-add-full-link" onClick={onClose}>
              <i className="fas fa-arrow-right"></i> Open full task form
            </Link>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || !title.trim()}>
              {isSubmitting ? 'Adding...' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}