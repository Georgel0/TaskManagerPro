import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addMemberSchema, validate } from '@/lib/validators';
import { getInitials } from '@/lib';

export function MembersModal({ project, members, loading, isOwner, onAddMember, onRemoveMember, onClose, onTransferOwnership }) {
  const [email, setEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [emailError, setEmailError] = useState(null);
  const [transferConfirmId, setTransferConfirmId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (event.target.closest('.menu-btn') || event.target.closest('.action-dropdown-menu')) {
        return;
      }
      setOpenMenuId(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMemberClick = (member) => {
    onClose();
    router.push(`/tasks?project_id=${project.id}&user_id=${member.id}`);
  };

  const totalTasks = (member) =>
    (member.todo_count ?? 0) + (member.in_progress_count ?? 0) + (member.done_count ?? 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validate(addMemberSchema, { email });
    if (errors?.email) {
      setEmailError(errors.email);
      return;
    }

    const isAlreadyMember = members.some(
      (member) => member.email.toLowerCase() === email.toLowerCase().trim()
    );

    if (isAlreadyMember) {
      setEmailError('This user is already a member of the project.');
      return;
    }

    setEmailError(null);
    setIsAdding(true);

    try {
      await onAddMember(email);
      setEmail('');
    } catch (error) {
      setEmailError('Failed to add member. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const toggleMenu = (e, memberId) => {
    e.preventDefault();
    e.stopPropagation();

    setOpenMenuId((prevId) => (prevId === memberId ? null : memberId));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <i className="fas fa-users"></i> {project.name} — Team
          </h3>
          <button className="btn-icon" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body modal-body-scroll">
          {loading ? (
            <p className="text-center text-secondary">Loading members...</p>
          ) : (
            <ul className="members-list">
              {members.map((member) => (
                <li key={member.id} className="member-item">

                  <div className="member-avatar">
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.name} />
                    ) : (
                      <span>{getInitials(member.name)}</span>
                    )}
                  </div>

                  <button
                    className="member-clickable-area"
                    onClick={() => handleMemberClick(member)}
                    title={`View ${member.name}'s tasks`}
                  >

                    <div className="member-info">
                      <span className="member-name">{member.name}</span>
                      <span className="member-email">{member.email}</span>

                      {totalTasks(member) === 0 ? (
                        <span className="member-no-tasks">No tasks assigned</span>
                      ) : (
                        <div className="member-task-stats">
                          {member.todo_count > 0 && (
                            <span className="member-stat member-stat-todo">
                              {member.todo_count} To Do
                            </span>
                          )}
                          {member.in_progress_count > 0 && (
                            <span className="member-stat member-stat-progress">
                              {member.in_progress_count} In Progress
                            </span>
                          )}
                          {member.done_count > 0 && (
                            <span className="member-stat member-stat-done">
                              {member.done_count} Done
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </button>

                  <div className="member-actions-container">
                    <span className={`badge ${member.role === 'owner' ? 'badge-owner' : 'badge-member'}`}>
                      {member.role === 'owner' ? 'Owner' : 'Member'}
                    </span>

                    {isOwner && member.role !== 'owner' && (
                      <div className="member-actions">
                        {transferConfirmId === member.id ? (
                          <div className="transfer-confirm">
                            <span className="transfer-confirm-text">Make owner?</span>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => { onTransferOwnership(member.id); setTransferConfirmId(null); }}
                            >
                              Yes
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => setTransferConfirmId(null)}
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <div className="action-dropdown-wrapper">
                            <button
                              className="btn-icon menu-btn"
                              title="More actions"
                              onClick={(e) => toggleMenu(e, member.id)}
                            >
                              <i className="fas fa-bars"></i>
                            </button>

                            {openMenuId === member.id && (
                              <div className="action-dropdown-menu">
                                <button
                                  className="dropdown-item"
                                  title="Make Owner"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTransferConfirmId(member.id);
                                    setOpenMenuId(null);
                                  }}
                                >
                                  <i className="fas fa-crown"></i>
                                </button>
                                <button
                                  className="dropdown-item"
                                  title="Remove Member"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onRemoveMember(member.id);
                                    setOpenMenuId(null);
                                  }}
                                >
                                  <i className="fas fa-user-minus"></i>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </li>
              ))}
            </ul>
          )}

          {isOwner && (
            <form className="add-member-form" onSubmit={handleSubmit} noValidate>
              <h4>Add Member</h4>
              <div className="add-member-input-group">
                <div className="add-member-input-wrapper">
                  <input
                    type="email"
                    className={`form-control ${emailError ? 'input-error' : ''}`}
                    placeholder="Enter user email..."
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(null);
                    }}
                  />
                  {emailError && (
                    <span className="field-error">
                      <i className="fas fa-exclamation-circle"></i> {emailError}
                    </span>
                  )}
                </div>
                <button type="submit" className="btn btn-primary" disabled={isAdding}>
                  {isAdding ? 'Adding...' : <><i className="fas fa-user-plus"></i> Add</>}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}