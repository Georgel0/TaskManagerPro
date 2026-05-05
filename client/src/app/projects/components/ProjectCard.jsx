import { formatDate } from "@/lib";
import { ProjectActionMenu } from "./Modals";

export function ProjectCard({ project, userId, onOpen, onEdit, onDelete, onMembers, onLeave, onAnnouncements, onStar, onQuickAdd, onReadme }) {
  const isOwner = project.owner_id === userId;
  const taskCount = project.task_count ?? 0;
  const doneCount = project.done_task_count ?? 0;
  const memberCount = project.member_count ?? 1;
  const announcementCount = project.announcement_count ?? 0;
  const progressPct = taskCount > 0 ? Math.round((doneCount / taskCount) * 100) : 0;
  const projectColor = project.color || 'var(--accent-color)';

  return (
    <div className="project-card" style={{ '--project-color': projectColor }}>
      <div className="project-card-color-bar"></div>

      <div className="project-card-header">
        <div className="project-card-title-group">
          <h3>{project.name}</h3>
          <span className={`badge ${isOwner ? 'badge-owner' : 'badge-member'}`}>
            {isOwner ? 'Owner' : 'Member'}
          </span>
        </div>

        <div className="project-card-header-actions">
          <button
            className={`btn-icon project-star-btn ${project.is_starred ? 'starred' : ''}`}
            onClick={(e) => { e.stopPropagation(); onStar(project.id); }}
            title={project.is_starred ? 'Unstar project' : 'Star project'}
          >
            <i className={project.is_starred ? 'fas fa-star' : 'far fa-star'}></i>
          </button>
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

        {project.tags?.length > 0 && (
          <div className="project-tags">
            {project.tags.map((tag) => (
              <span key={tag} className="project-tag">{tag}</span>
            ))}
          </div>
        )}

        {taskCount > 0 && (
          <div className="project-progress">
            <div className="project-progress-bar-track">
              <div
                className="project-progress-bar-fill"
                style={{ width: `${progressPct}%` }}
              ></div>
            </div>
            <span className="project-progress-label">{doneCount}/{taskCount} done</span>
          </div>
        )}

        <div className="project-card-footer">
          <span className="project-card-date" title={`Created: ${formatDate(project.created_at)}`}>
            <i className="fas fa-calendar-plus"></i> {formatDate(project.created_at)}
          </span>
          <div className="project-card-chips">
            <button className="project-chip" title="View Members" onClick={(e) => { e.stopPropagation(); onMembers(project); }}>
              <i className="fas fa-users"></i> {memberCount}
            </button>
            <button className="project-chip" title="View Tasks" onClick={() => onOpen(project)}>
              <i className="fas fa-tasks"></i> {taskCount}
            </button>
            <button className="project-chip" title="Announcements" onClick={(e) => { e.stopPropagation(); onAnnouncements(project); }}>
              <i className="fas fa-bullhorn"></i> {announcementCount}
            </button>
            <button className="project-chip project-chip-add" title="Quick Add Task" onClick={(e) => { e.stopPropagation(); onQuickAdd(project); }}>
              <i className="fas fa-plus"></i>
            </button>
            <button className="project-chip" title="Project README" onClick={(e) => { e.stopPropagation(); onReadme(project); }}>
              <i className="fas fa-book-open"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}