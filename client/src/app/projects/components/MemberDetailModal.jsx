import { useState } from 'react';
import { getInitials } from '@/lib';

export function MemberDetailModal({ member, isOwner, currentUserId, onClose, onUpdateRoleDescription }) {
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editDescription, setEditDescription] = useState(member.role_description || '');

  const totalTasks = (m) =>
    (m.todo_count ?? 0) + (m.in_progress_count ?? 0) + (m.done_count ?? 0);

  const handleSave = async () => {
    if (onUpdateRoleDescription) {
      await onUpdateRoleDescription(member.id, editDescription);
      member.role_description = editDescription;
    }
    setIsEditingDesc(false);
  };

  const canEditBio = isOwner || currentUserId === member.id;

  return (
    <div className="modal-overlay nested-modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Member Profile</h3>
          <button className="btn-icon" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body member-detail-body">
          {/* Header */}
          <div className="member-detail-header">
            <div className="member-avatar-large">
              {member.avatar
                ? <img src={member.avatar} alt={member.name} />
                : <span>{getInitials(member.name)}</span>
              }
            </div>
            <div className="member-detail-titles">
              <h2>{member.name}</h2>
              <p>{member.email}</p>
              <span className={`badge ${member.role === 'owner' ? 'badge-owner' : 'badge-member'}`}>
                {member.role === 'owner' ? 'Project Owner' : 'Project Member'}
              </span>
            </div>
          </div>

          <div className="member-detail-stats">
            <div className="stat-box">
              <span className="stat-num">{totalTasks(member)}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat-box">
              <span className="stat-num">{member.done_count || 0}</span>
              <span className="stat-label">Done</span>
            </div>
            <div className="stat-box">
              <span className="stat-num">{member.in_progress_count || 0}</span>
              <span className="stat-label">In Progress</span>
            </div>
            <div className="stat-box">
              <span className="stat-num">{member.todo_count || 0}</span>
              <span className="stat-label">To Do</span>
            </div>
          </div>

          <div className="member-detail-bio">
            <div className="bio-header">
              <h4>Role &amp; Responsibilities</h4>
              {canEditBio && !isEditingDesc && (
                <button className="btn-icon" onClick={() => setIsEditingDesc(true)} title="Edit">
                  <i className="fas fa-pen"></i>
                </button>
              )}
            </div>

            {isEditingDesc ? (
              <>
                <textarea
                  className="form-control"
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Describe this member's role..."
                />
                <div className="bio-edit-actions">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => { setIsEditingDesc(false); setEditDescription(member.role_description || ''); }}
                  >
                    Cancel
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={handleSave}>
                    Save
                  </button>
                </div>
              </>
            ) : (
              <p className="bio-text">
                {member.role_description || 'No role description yet.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}