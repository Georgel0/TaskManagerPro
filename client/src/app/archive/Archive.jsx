'use client';
import { useState } from 'react';
import { useArchive } from '@/hooks/useArchive';
import { RemovalModal } from '@/components/ui';
import { formatDate } from '@/lib';
import './archive.css';

export default function Archive() {
  const {
    archivedProjects, archivedTasks,
    loadingProjects, loadingTasks,
    restoreProject, permanentDeleteProject,
    restoreTask, permanentDeleteTask,
  } = useArchive();

  const [pendingDelete, setPendingDelete] = useState(null);

  const handleConfirmDelete = () => {
    if (pendingDelete?.type === 'project') permanentDeleteProject(pendingDelete?.id);
    else permanentDeleteTask(pendingDelete?.id);
    setPendingDelete(null);
  };

  return (
    <div className="page-content">
      <div className="archive-header">
        <h2><i className="fas fa-box-archive"></i> Archive</h2>
        <p className="archive-subtitle">
          Archived items are hidden from your workspace. Restore them anytime or delete permanently.
        </p>
      </div>

      <section className="archive-section">
        <h3 className="archive-section-title">
          <i className="fas fa-folder"></i> Projects
          {archivedProjects.length > 0 && (
            <span className="archive-count">{archivedProjects.length}</span>
          )}
        </h3>

        {loadingProjects ? (
          <p className="archive-loading">Loading...</p>
        ) : archivedProjects.length === 0 ? (
          <p className="archive-empty">No archived projects.</p>
        ) : (
          <ul className="archive-list">
            {archivedProjects.map((p) => (
              <li key={p.id} className="archive-item">
                <div className="archive-item-info">
                  <span className="archive-item-name">{p.name}</span>
                  <span className="archive-item-meta">
                    {p.task_count} task{p.task_count !== 1 ? 's' : ''} ·
                    {p.member_count} member{p.member_count !== 1 ? 's' : ''} ·
                    Archived {formatDate(p.archived_at)}
                  </span>
                  {p.description && (
                    <span className="archive-item-desc">{p.description}</span>
                  )}
                </div>
                <div className="archive-item-actions">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => restoreProject(p.id)}
                    title="Restore project"
                  >
                    <i className="fas fa-rotate-left"></i> Restore
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => setPendingDelete({ type: 'project', id: p.id, name: p.name })}
                    title="Permanently delete"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="archive-section">
        <h3 className="archive-section-title">
          <i className="fas fa-tasks"></i> Tasks
          {archivedTasks.length > 0 && (
            <span className="archive-count">{archivedTasks.length}</span>
          )}
        </h3>

        {loadingTasks ? (
          <p className="archive-loading">Loading...</p>
        ) : archivedTasks.length === 0 ? (
          <p className="archive-empty">No archived tasks.</p>
        ) : (
          <ul className="archive-list">
            {archivedTasks.map((t) => (
              <li key={t.id} className="archive-item">
                <div className="archive-item-info">
                  <span className="archive-item-name">{t.title}</span>
                  <span className="archive-item-meta">
                    <i className={`fas ${t.project_name ? 'fa-folder' : 'fa-user'}`}></i>{' '}
                    {t.project_name || 'Personal Task'} ·
                    Archived {formatDate(t.archived_at)}
                  </span>
                  {t.description && (
                    <span className="archive-item-desc">{t.description}</span>
                  )}
                </div>
                <div className="archive-item-actions">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => restoreTask(t.id)}
                    title="Restore task"
                  >
                    <i className="fas fa-rotate-left"></i> Restore
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => setPendingDelete({ type: 'task', id: t.id, name: t.title })}
                    title="Permanently delete"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <RemovalModal
        isOpen={!!pendingDelete}
        item={pendingDelete}
        title="Permanent Deletion"
        message={
          <>
            Permanently delete <strong>{pendingDelete?.name}</strong>?
            {pendingDelete?.type === 'project' && ' All tasks and files inside will be gone forever.'}
            {pendingDelete?.type === 'task' && ' All comments and attachments will be gone forever.'}
            {' '}This cannot be undone.
          </>
        }
        onConfirm={handleConfirmDelete}
        onClose={() => setPendingDelete(null)}
        isSubmitting={false}
      />
    </div>
  );
}