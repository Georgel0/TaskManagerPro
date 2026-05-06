'use client';
import { useState } from "react";
import Link from "next/link";

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
      <form className="modal-content quick-add-modal" onClick={(e) => e.stopPropagation()}  onSubmit={handleSubmit}>
        <div className="modal-header">
          <h3><i className="fas fa-plus"></i> Quick Add Task</h3>
          <button className="btn-icon" onClick={onClose}><i className="fas fa-times"></i></button>
        </div>
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
  );
}