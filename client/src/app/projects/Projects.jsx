'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context';
import toast from 'react-hot-toast';
import './projects.css';

export default function Projects() {
  const { user } = useApp();
  const router = useRouter();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const [isTasksModalOpen, setIsTasksModalOpen] = useState(false);
  const [projectTasks, setProjectTasks] = useState([]);
  const [loadingProjectTasks, setLoadingProjectTasks] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      setProjects(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to create project');

      const newProject = await response.json();
      setProjects([newProject, ...projects]);
      setIsModalOpen(false);
      setFormData({ name: '', description: '' });

      toast.success('Project created successfully!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteProject = async (id) => {
    setIsSubmitting(true);
    if (!id) return;
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete project');

      setProjects(projects.filter(p => p.id !== id));
      toast.success('Project deleted!');

      setIsDeleteModalOpen(false);
      setSelectedProject(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openProjectTasks = async (project) => {
    setSelectedProject(project);
    setIsTasksModalOpen(true);
    setLoadingProjectTasks(true);

    const token = localStorage.getItem('token');

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tasks?project_id=${project.id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (!response.ok) throw new Error('Failed to fetch tasks');

      const data = await response.json();
      setProjectTasks(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingProjectTasks(false);
    }
  };

  if (loading || !user) return (
    <div className='loading-state'>
      <div className="pulse-ring"></div>
      <p>Loading Projects...</p>
    </div>
  );

  return (
    <div className="page-content">
      <div className="projects-header">
        <h2><i className="fas fa-folder-open"></i> My Projects</h2>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <i className="fas fa-plus"></i> New Project
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {projects.length === 0 ? (
        <div className="card projects-empty-state">
          <i className="fas fa-folder-plus projects-empty-icon"></i>
          <p className="mb-3">You don't have any projects yet. Create one to get started.</p>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <i className="fas fa-plus"></i> New Project
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(project => (
            <div key={project.id} className="card project-card" onClick={() => openProjectTasks(project)}>
              <div className="project-card-header">
                <div className="project-title-group">
                  <h3>{project.name}</h3>
                  {project.owner_id === user.id ? (
                    <span className="badge badge-owner">Owner</span>
                  ) : (
                    <span className="badge badge-member">Member</span>
                  )}
                </div>
                {project.owner_id === user.id && (
                  <button
                    className="btn-icon delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProject(project);
                      setIsDeleteModalOpen(true);
                    }}
                    title="Delete Project"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                )}
              </div>
              <div className="card-body">
                <p className="project-description">{project.description || 'No description provided.'}</p>
                <div className="project-meta">
                  <span><i className="fas fa-calendar-alt"></i> Created: {new Date(project.created_at).toLocaleDateString()}</span>
                  <span className="project-task-count">
                    <i className="fas fa-tasks"></i> {project.task_count ?? 0} task{project.task_count !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Project</h3>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleCreateProject}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Project Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    className="form-control"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-error">Confirm Deletion</h2>
              <button className="btn-icon" onClick={() => setIsDeleteModalOpen(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p className="mb-3 text-secondary">Are you sure you want to delete <strong>{selectedProject?.name}</strong>?
                This action is permanent and all tasks will be removed.</p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsDeleteModalOpen(false)}
                title='Close Modal'>
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmDeleteProject(selectedProject?.id);
                }}
                className="btn btn-danger"
                title='Delete'
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isTasksModalOpen && selectedProject && (
        <div className="modal-overlay" onClick={() => setIsTasksModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-tasks"></i> {selectedProject.name}</h3>
              <button className="btn-icon" onClick={() => setIsTasksModalOpen(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body modal-body-scroll">
              {loadingProjectTasks ? (
                <p className="text-center text-secondary">Loading tasks...</p>
              ) : projectTasks.length === 0 ? (
                <p className="empty-state">No tasks in this project yet.</p>
              ) : (
                <ul className="project-tasks-list">
                  {projectTasks.map(task => (
                    <li
                      key={task.id}
                      className="project-task-item"
                      onClick={() => {
                        setIsTasksModalOpen(false);
                        router.push(`/tasks?highlight=${task.id}`);
                      }}
                    >
                      <div className="project-task-info">
                        <span className="project-task-title">{task.title}</span>
                        <span className="text-xs text-secondary">
                          <i className="fas fa-calendar"></i> {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}
                        </span>
                      </div>
                      <div className="project-task-meta">
                        <span className={`badge priority-${task.priority?.toLowerCase() || 'medium'}`}>
                          {task.priority || 'Medium'}
                        </span>
                        <span className="badge status-badge">{task.status}</span>
                        <i className="fas fa-arrow-right text-secondary"></i>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsTasksModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}