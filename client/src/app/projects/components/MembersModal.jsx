import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addMemberSchema, validate } from '@/lib/validators';
import { getInitials } from '@/lib';

export function MembersModal({ project, members, loading, isOwner, onAddMember, onRemoveMember, onClose }) {
  const [email, setEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [emailError, setEmailError] = useState(null);
  const router = useRouter();

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
                  <button
                    className="member-clickable-area"
                    onClick={() => handleMemberClick(member)}
                    title={`View ${member.name}'s tasks`}
                  >
                    <div className="member-avatar">
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.name} />
                      ) : (
                        <span>{getInitials(member.name)}</span>
                      )}
                    </div>

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

                  <div className="member-actions">
                    <span className={`badge ${member.role === 'owner' ? 'badge-owner' : 'badge-member'}`}>
                      {member.role === 'owner' ? 'Owner' : 'Member'}
                    </span>

                    {isOwner && member.role !== 'owner' && (
                      <button
                        className="btn-icon delete-btn"
                        title="Remove member"
                        onClick={() => onRemoveMember(member.id)}
                      >
                        <i className="fas fa-user-minus"></i>
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {isOwner && (
            <form className="add-member-form" onSubmit={handleSubmit} noValidate>
              <h4 className="add-member-title">Add Member</h4>
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