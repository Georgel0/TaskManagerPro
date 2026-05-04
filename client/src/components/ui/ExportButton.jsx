'use client';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useExport } from '@/hooks';

export function ExportButton({
  options = [],
  label = 'Export',
  icon = 'fa-file-csv',
  variant = 'dropdown',
  size = 'icon',
  align = 'right',
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const ref = useRef(null);
  const { exportData, exportingKey } = useExport();
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const query = window.matchMedia('(max-width: 768px)');
    setIsMobile(query.matches);

    const handler = (e) => setIsMobile(e.matches);
    query.addEventListener('change', handler);
    return () => query.removeEventListener('change', handler);
  }, []);

  const handleExport = (option) => {
    setOpen(false);
    setShowModal(false);
    exportData(option);
  };

  const isLoading = exportingKey !== null;

  const renderButtonInner = (currentLoading, currentLabel) => (
    <>
      <i className={`fas ${currentLoading ? 'fa-spinner fa-spin' : icon}`}></i>
      {size !== 'icon' && !isMobile && (
        <>
          <span>{currentLoading ? 'Exporting…' : currentLabel}</span>
          <i className={`fas fa-chevron-${open ? 'up' : 'down'} export-chevron`}></i>
        </>
      )}
    </>
  );

  const renderTrigger = (onClick) => (
    <button
      className={`export-btn export-btn--${size} ${open ? 'export-btn--active' : ''} ${className}`}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      disabled={isLoading}
      title="Export options"
    >
      <i className={`fas ${isLoading ? 'fa-spinner fa-spin' : icon}`}></i>
      {size !== 'icon' && (
        <>
          <span>{!isMobile && (isLoading ? 'Exporting…' : label)}</span>
          <i className={`fas fa-chevron-down export-chevron`}></i>
        </>
      )}
    </button>
  );

  const modalJSX = showModal && (
    <div className="modal-overlay" onClick={() => setShowModal(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3><i className="fas fa-file-csv"></i> Export Data</h3>
          <button className="btn-icon" onClick={() => setShowModal(false)}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="modal-body">
          <p className="modal-confirm-text">Select an export format:</p>
          <div className="export-modal-list">
            {options.map((opt, i) => (
              <button
                key={i}
                className="export-menu__item"
                onClick={() => handleExport(opt)}
                style={{ borderBottom: '1px solid var(--border-color)', width: '100%', padding: '12px' }}
              >
                <span className="export-menu__item-icon">
                  <i className={`fas ${opt.icon || 'fa-table'}`}></i>
                </span>
                <span className="export-menu__item-body">
                  <span className="export-menu__item-label">{opt.label}</span>
                  <span className="export-menu__item-desc">{opt.description}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
        </div>
      </div>
    </div>
  );

  if (variant === 'modal') {
    return (
      <>
        <button
          className={`export-btn ...`}
          onClick={() => setShowModal(true)}
          disabled={isLoading}
        >
          {renderButtonInner(isLoading, label)}
        </button>
        {mounted && showModal && createPortal(modalJSX, document.body)}
      </>
    );
  }

  // Single-option shortcut
  if (variant === 'single' || options.length === 1) {
    const opt = options[0];
    const thisLoading = exportingKey === opt.endpoint;
    return (
      <button
        className={`export-btn export-btn--${size} ${className}`}
        onClick={(e) => { e.stopPropagation(); handleExport(opt); }}
        disabled={isLoading}
        title={opt.label}
        aria-label={opt.label}
      >
        {renderButtonInner(thisLoading, label)}
      </button>
    );
  }

  return (
    <div className="export-wrapper" ref={ref}>
      <button
        className={`export-btn export-btn--${size} ${open ? 'export-btn--active' : ''}  ${className}`}
        onClick={(e) => { e.stopPropagation(); setOpen(p => !p); }}
        disabled={isLoading}
        title="Export options"
        aria-haspopup="true"
        aria-expanded={open}
      >
        {renderButtonInner(isLoading, label)}
      </button>

      {open && (
        <div
          className={`export-menu export-menu--${align}`}
          role="menu"
        >
          <div className="export-menu__header">
            <i className="fas fa-file-csv"></i> Export as CSV
          </div>

          {options.map((opt, i) => {
            const thisLoading = exportingKey === opt.endpoint;
            return (
              <button
                key={i}
                className="export-menu__item"
                onClick={() => handleExport(opt)}
                disabled={isLoading}
                role="menuitem"
                title={opt.description || opt.label}
              >
                <span className="export-menu__item-icon">
                  <i className={`fas ${thisLoading ? 'fa-spinner fa-spin' : (opt.icon || 'fa-table')}`}></i>
                </span>
                <span className="export-menu__item-body">
                  <span className="export-menu__item-label">{opt.label}</span>
                  {opt.description && (
                    <span className="export-menu__item-desc">{opt.description}</span>
                  )}
                </span>
                <i className="fas fa-arrow-down export-menu__item-arrow"></i>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Pre-built option factories

export const taskExportOptions = (taskId) => [
  {
    label: 'Task Summary',
    description: 'Title, status, priority, deadline',
    icon: 'fa-file-alt',
    endpoint: `/task/${taskId}`,
    filename: `task-${taskId}.csv`,
  },
  {
    label: 'Task Full Report',
    description: 'Includes comments, attachments & subtasks',
    icon: 'fa-file-csv',
    endpoint: `/export/task/${taskId}?full=true`,
    filename: `task-${taskId}-full.csv`,
  },
];

export const myTasksExportOptions = (params = {}) => {
  const qs = new URLSearchParams({ include_done: 'false', ...params }).toString();
  const qsFull = new URLSearchParams({ ...params }).toString();
  return [
    {
      label: 'Active Tasks',
      description: 'All your pending tasks (flat list)',
      icon: 'fa-list-ul',
      endpoint: `/export/my-tasks?${qs}`,
      filename: 'my-active-tasks.csv',
    },
    {
      label: 'All Tasks (incl. Done)',
      description: 'Every task assigned to you',
      icon: 'fa-tasks',
      endpoint: `/export/my-tasks?include_done=true&${qsFull}`,
      filename: 'my-all-tasks.csv',
    },
    {
      label: 'Full Task Report',
      description: 'Tasks + subtasks, comments & attachments',
      icon: 'fa-file-csv',
      endpoint: `/export/my-tasks/full?${qsFull}`,
      filename: 'my-tasks-full.csv',
    },
  ];
};

export const projectExportOptions = (projectId) => [
  {
    label: 'Project Tasks',
    description: 'All tasks with counts',
    icon: 'fa-tasks',
    endpoint: `/export/project/${projectId}/tasks`,
    filename: `project-${projectId}-tasks.csv`,
  },
  {
    label: 'Project Tasks (Full)',
    description: 'Tasks + subtasks, comments & attachments',
    icon: 'fa-file-csv',
    endpoint: `/export/project/${projectId}/tasks?full=true`,
    filename: `project-${projectId}-tasks-full.csv`,
  },
  {
    label: 'Member List',
    description: 'Members with task stats',
    icon: 'fa-users',
    endpoint: `/export/project/${projectId}/members`,
    filename: `project-${projectId}-members.csv`,
  },
  {
    label: 'Announcements',
    description: 'All announcements with acknowledgment counts',
    icon: 'fa-bullhorn',
    endpoint: `/export/project/${projectId}/announcements`,
    filename: `project-${projectId}-announcements.csv`,
  },
  {
    label: 'Full Project Report',
    description: 'Everything: members, tasks, comments, attachments, announcements',
    icon: 'fa-folder-open',
    endpoint: `/export/project/${projectId}/full`,
    filename: `project-${projectId}-full-report.csv`,
  },
];