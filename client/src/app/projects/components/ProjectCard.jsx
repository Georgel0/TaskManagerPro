export function ProjectCard({ project, userId, onOpen, onEdit, onDelete, onMembers }) {
  const isOwner = project.owner_id === userId;
  const taskCount = project.task_count ?? 0;
  const memberCount = project.member_count ?? 1;

  return (
    <div className="card project-card" onClick={() => onOpen(project)}>
      <div className="project-card-header">
        <div className="project-title-group">
          <h3>{project.name}</h3>
          <span className={`badge ${isOwner ? 'badge-owner' : 'badge-member'}`}>
            {isOwner ? 'Owner' : 'Member'}
          </span>
        </div>

        {isOwner && (
          <div className="action-buttons">
            <button
              className="btn-icon edit-btn"
              title="Edit Project"
              onClick={(e) => { e.stopPropagation(); onEdit(project); }}
            >
              <i className="fas fa-pencil-alt"></i>
            </button>
            <button
              className="btn-icon delete-btn"
              title="Delete Project"
              onClick={(e) => { e.stopPropagation(); onDelete(project); }}
            >
              <i className="fas fa-trash"></i>
            </button>
          </div>
        )}
      </div>

      <div className="card-body">
        <p className="project-description">
          {project.description || 'No description provided.'}
        </p>
        <div className="project-meta">
          <span>
            <i className="fas fa-calendar-alt"></i> Created:{' '}
            {new Date(project.created_at).toLocaleDateString()}
          </span>

          <div className="project-meta-chips">
            <button
              className="project-member-count"
              title="View team"
              onClick={(e) => { e.stopPropagation(); onMembers(project); }}
            >
              <i className="fas fa-users"></i> {memberCount}
            </button>

            <span className="project-task-count">
              <i className="fas fa-tasks"></i> {taskCount} task{taskCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}