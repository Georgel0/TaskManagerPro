export function ProjectCard({ project, userId, onOpen, onEdit, onDelete, onMembers }) {
  const isOwner = project.owner_id === userId;
  const taskCount = project.task_count ?? 0;
  const memberCount = project.member_count ?? 1;

  return (
    <div className="project-card">
      <div>
        <div>
          <h3>{project.name}</h3>
          <span className={`badge ${isOwner ? 'badge-owner' : 'badge-member'}`}>
            {isOwner ? 'Owner' : 'Member'}
          </span>
        </div>

        {isOwner && (
          <div>
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

      <div>
        <p>
          {project.description || 'No description provided.'}
        </p>
        <div>
          <span>
            <i className="fas fa-calendar-alt"></i> Created:{' '}
            {new Date(project.created_at).toLocaleDateString()}
          </span>

          <div>
            <button
              className="project-member-count"
              title="View team"
              onClick={(e) => { e.stopPropagation(); onMembers(project); }}
            >
              <i className="fas fa-users"></i> {memberCount}
            </button>

            <button 
              className="project-task-count" 
              onClick={() => onOpen(project)}
              title="View Members"
            >
              <i className="fas fa-tasks"></i> {taskCount} task{taskCount !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}