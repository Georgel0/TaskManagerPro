import { useState } from "react";
import { deleteAccountSchema, validate } from '@/lib/validators';
import toast from "react-hot-toast";

export function DangerZone({ handleLogout }) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const confirmDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleteError('');

    const errors = validate(deleteAccountSchema, { password: deletePassword });
    if (errors) return setDeleteError(errors.password);

    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ password: deletePassword }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete account.');

      handleLogout();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <div className="card danger-zone">
        <div className="danger-icon-wrapper">
          <i className="fas fa-exclamation-triangle"></i>
        </div>
        <div className="danger-text">
          <h3 className="profile-danger-title">Danger Zone</h3>
          <p className="profile-danger-desc">
            Permanently remove your account and all related data. This action is irreversible.
          </p>
        </div>
        <button
          className="btn btn-danger btn-full"
          title="Delete Account"
          onClick={() => { setIsDeleteModalOpen(true); setDeletePassword(''); setDeleteError(''); }}
        >
          Delete Account
        </button>
      </div>

      {isDeleteModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="modal-content danger-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="profile-danger-title">Confirm Deletion</h2>
              <button className="btn-icon" onClick={() => setIsDeleteModalOpen(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={confirmDeleteAccount} noValidate>
              <div className="modal-body">
                <p className="profile-modal-desc">
                  This action is permanent. All your projects, tasks, and data will be completely wiped from our servers. <strong>You cannot undo this.</strong>
                </p>
                <div className="form-group">
                  <label>Confirm your password</label>
                  <input
                    className={`form-control ${deleteError ? 'input-error' : ''}`}
                    type="password"
                    placeholder="Enter your password to confirm"
                    value={deletePassword}
                    onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(''); }}
                    autoFocus
                  />
                  {deleteError && <span className="field-error">{deleteError}</span>}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)} title="Close">
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger" title="Delete">
                  Permanently Delete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}



export function ProfileStatsExpanded({ stats }) {
  const [open, setOpen] = useState(false);

  const rows = [
    { icon: 'fa-folder-open', label: 'Projects Owned', value: stats?.activity?.owned ?? 0 },
    { icon: 'fa-users', label: 'Projects Joined', value: stats?.activity?.collaboration ?? 0 },
    { icon: 'fa-tasks', label: 'In Progress', value: stats?.tasks - (stats?.completed ?? 0) - (stats?.performance?.overdue ?? 0) },
    { icon: 'fa-exclamation-circle', label: 'Urgent (High Priority)', value: stats?.urgent ?? 0, accent: 'warning' },
    { icon: 'fa-calendar-times', label: 'Overdue', value: stats?.performance?.overdue ?? 0, accent: 'error' },
    { icon: 'fa-clock', label: 'Due This Week', value: stats?.performance?.upcoming ?? 0, accent: 'accent' },
    { icon: 'fa-paperclip', label: 'Attachments', value: stats?.activity?.resources ?? 0 },
    { icon: 'fa-bell', label: 'Unread Notifications', value: stats?.activity?.unread ?? 0 },
  ];

  return (
    <>
      <div className={`profile-stats-expanded ${open ? 'profile-stats-expanded-open' : ''}`}>
        <div className="profile-stats-expanded-inner">
          <div className="profile-stats-divider" />
          {rows.map((row) => (
            <div key={row.label} className="profile-stat-row" title={row.label}>
              <span className={`profile-stat-row-icon ${row.accent ? `profile-stat-row-icon-${row.accent}` : ''}`}>
                <i className={`fas ${row.icon}`}></i>
              </span>
              <span className="profile-stat-row-label">{row.label}</span>
              <span className={`profile-stat-row-value ${row.accent ? `profile-stat-row-value-${row.accent}` : ''}`}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button
        className="profile-stats-toggle"
        onClick={() => setOpen((p) => !p)}
        title={open ? 'Show less' : 'Show more'}
      >
        {open ? (
          <><i className="fas fa-chevron-up"></i> Show less</>
        ) : (
          <><i className="fas fa-chevron-down"></i> Show more</>
        )}
      </button>
    </>
  );
}

export const ProfileSkeleton = () => (
  <div className="profile-page-container">
    <div className="profile-header-content">
      <div className="skeleton skeleton-title"></div>
      <div className="skeleton skeleton-subtitle"></div>
    </div>

    <div className="profile-layout page-content">
      <div className="profile-sidebar">
        <div className="card profile-overview">
          <div className="skeleton skeleton-avatar"></div>
          <div className="skeleton skeleton-name skeleton-center"></div>
          <div className="skeleton skeleton-badge skeleton-center"></div>
          <div className="skeleton skeleton-line"></div>
          <div className="skeleton skeleton-line"></div>
          <div className="skeleton skeleton-btn-block"></div>
        </div>

        <div className="card profile-stats-card">
          <div className="skeleton skeleton-name" style={{ width: '80px' }}></div>
          <div className="profile-stats-grid">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton skeleton-stat-box"></div>
            ))}
          </div>
          <div className="skeleton skeleton-btn-block" style={{ height: '30px', marginTop: '20px' }}></div>
        </div>

        <div className="skeleton" style={{ height: '180px', width: '100%' }}></div>
      </div>

      <div className="profile-settings-grid">
        {[1, 2].map(card => (
          <div key={card} className="card settings-card">
            <div className="skeleton skeleton-name" style={{ width: '200px' }}></div>
            <div className="skeleton skeleton-line" style={{ width: '300px', marginBottom: '30px' }}></div>

            {[1, 2].map(form => (
              <div key={form} style={{ marginBottom: '32px', padding: '24px', background: 'var(--sec-background)', borderRadius: 'var(--radius-md)' }}>
                <div className="skeleton skeleton-form-label"></div>
                <div className="skeleton skeleton-input"></div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);