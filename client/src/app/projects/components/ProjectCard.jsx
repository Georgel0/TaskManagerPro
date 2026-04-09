import { formatDate } from "@/lib";
import { ProjectActionMenu } from "./Modals";

export function ProjectCard({ project, userId, onOpen, onEdit, onDelete, onMembers, onLeave }) {
  const isOwner = project.owner_id === userId;
  const taskCount = project.task_count ?? 0;
  const memberCount = project.member_count ?? 1;

  return (
    <div className="project-card">
      <div className="project-card-header">
        <div className="project-card-title-group">
          <h3>{project.name}</h3>
          <span className={`badge ${isOwner ? 'badge-owner' : 'badge-member'}`}>
            {isOwner ? 'Owner' : 'Member'}
          </span>
        </div>

        <div className="project-action-buttons">
          <ProjectActionMenu
            isOwner={isOwner}
            project={project}
            onEdit={onEdit}
            onDelete={onDelete}
            onLeave={onLeave}
          />
        </div>
      </div>

      <div className="project-card-body">
        <p className="project-card-description">
          {project.description || 'No description provided.'}
        </p>
        <div className="project-card-footer">
          <span className="project-card-date" title={`Created at: ${formatDate(project.created_at)}`}>
            <i className="fas fa-calendar-plus"></i>{' '}
            {formatDate(project.created_at)}
          </span>
          <div className="project-card-chips">
            <button
              className="project-member-count"
              title="View Members"
              onClick={(e) => { e.stopPropagation(); onMembers(project); }}
            >
              <i className="fas fa-users"></i> {memberCount}
            </button>
            <button
              className="project-task-count"
              title="View Tasks"
              onClick={() => onOpen(project)}
            >
              <i className="fas fa-tasks"></i> {taskCount} task{taskCount !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}