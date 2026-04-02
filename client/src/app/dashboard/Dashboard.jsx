'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useApp } from '@/context';
import { formatDate } from '@/lib';
import './dashboard.css';

export default function Dashboard() {
  const { user } = useApp();
  const router = useRouter();

  const [dashboardData, setDashboardData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', status: 'To Do', priority: 'Medium', deadline: '', project_id: ''
  });

  const API = process.env.NEXT_PUBLIC_API_URL;

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    try {
      const [dashRes, projectsRes] = await Promise.all([
        fetch(`${API}/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API}/projects`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
      ]);

      if (!dashRes.ok || !projectsRes.ok) throw new Error('Failed to fetch data');

      const dashData = await dashRes.json();
      const projectsData = await projectsRes.json();

      setDashboardData(dashData);
      setProjects(projectsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          project_id: Number(formData.project_id),
          assigned_user_id: user.id,
        })
      });

      if (!response.ok) throw new Error('Failed to create task');

      toast.success('Task created successfully!');
      setIsModalOpen(false);
      setFormData({ title: '', description: '', status: 'To Do', priority: 'Medium', deadline: '', project_id: '' });

      fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className='loading-state' title="Loading workspace data">
        <div className="pulse-ring"></div>
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content">
        <div className="dashboard-error" title="Error loading dashboard">
          <i className="fas fa-exclamation-triangle dashboard-error-icon"></i>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const { statistics, activeTasks, upcomingDeadlines } = dashboardData;

  return (
    <div className="page-content dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>Welcome back, {user.name}</h1>
          <p className="dashboard-subtitle">Workspace overview.</p>
        </div>
        <div className="dashboard-header-actions">
          <button 
            className="btn btn-primary" 
            onClick={() => setIsModalOpen(true)}
            title="Create a new task for your projects"
          >
            <i className="fas fa-plus"></i> New Task
          </button>
          <Link 
            href='/projects' 
            className="btn btn-secondary dashboard-projects-btn"
            title="View and manage all your projects"
          >
            <i className="fas fa-folder-open"></i>  Projects <i className="fas fa-arrow-right"></i>
          </Link>
        </div>
      </header>

      <section className="stats-grid">
        <div className="stat-card" title="Total number of tasks assigned to you">
          <div className="stat-icon stat-icon-primary">
            <i className="fas fa-tasks"></i>
          </div>
          <div className="stat-info">
            <p className="stat-label">Total</p>
            <h3>{statistics.totalTasks}</h3>
          </div>
        </div>
        <div className="stat-card" title="Number of tasks currently in progress or to-do">
          <div className="stat-icon stat-icon-warning">
            <i className="fas fa-hourglass-half"></i>
          </div>
          <div className="stat-info">
            <p className="stat-label">Pending</p>
            <h3>{statistics.pendingTasks}</h3>
          </div>
        </div>
        <div className="stat-card" title="Number of successfully completed tasks">
          <div className="stat-icon stat-icon-success">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-info">
            <p className="stat-label">Done</p>
            <h3>{statistics.completedTasks}</h3>
          </div>
        </div>
      </section>

      <div className="dashboard-content-grid">
        {/* Active Tasks Section */}
        <section className="card">
          <div className="card-header">
            <h2><i className="fas fa-list-ul"></i> Active Tasks</h2>
            <Link href="/tasks" className="btn-icon" title="View all tasks in detail">
              <i className="fas fa-external-link-alt"></i>
            </Link>
          </div>
          <div className="card-body dashboard-card-body">
            {activeTasks.length === 0 ? (
              <p className="empty-state">No active tasks right now.</p>
            ) : (
              <div className="dash-task-list">
                {activeTasks.map(task => (
                  <Link 
                    key={task.id} 
                    href={`/tasks?highlight=${task.id}`} 
                    className="dash-task-link"
                    title={`View details for task: ${task.title}`}
                  >
                    <div className="dash-task-item">
                      <div className="dash-task-row">
                        <h4 className="dash-task-title">{task.title}</h4>
                        <span 
                          className="dash-task-user" 
                          title={`Assigned to ${task.assigned_user_name}`}
                        >
                          <i className="fas fa-user-circle"></i>
                          {task.assigned_user_name.split(' ')[0]}
                        </span>
                      </div>
                      <div className="dash-task-meta-row">
                        <div className="dash-task-badge-group">
                          <span 
                            className={`badge priority-${task.priority?.toLowerCase() || 'medium'}`}
                            title={`Priority: ${task.priority || 'Medium'}`}
                          >
                            {task.priority || 'Medium'}
                          </span>
                          <span 
                            className="badge status-badge"
                            title={`Status: ${task.status || 'To Do'}`}
                          >
                            {task.status || 'To Do'}
                          </span>
                        </div>
                        <span className="dash-task-info-item" title="Task Deadline">
                          <i className="fas fa-stopwatch"></i>
                          {task.deadline ? formatDate(task.deadline) : 'No date'}
                        </span>
                        <span className="dash-task-info-item" title={`Task created on ${formatDate(task.created_at)}`}>
                          <i className="far fa-calendar-alt"></i>
                          {formatDate(task.created_at)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <h2><i className="fas fa-clock"></i> Deadlines</h2>
          </div>
          <div className="card-body dashboard-card-body">
            {upcomingDeadlines.length === 0 ? (
              <p className="empty-state">No upcoming deadlines.</p>
            ) : (
              <ul className="dash-task-list">
                {upcomingDeadlines.map(task => (
                  <li key={task.id} className="dash-task-link">
                    <div className="dash-task-item dash-task-upcoming">
                      <h4>{task.title}</h4>
                      <span className="dash-task-due" title="Approaching deadline">
                        <i className="fas fa-exclamation-circle"></i>
                        Due {new Date(task.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Quick Add Task</h3>
              <button 
                className="btn-icon" 
                onClick={() => setIsModalOpen(false)}
                title="Close modal"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="modal-body dashboard-empty-project-modal">
                <p className="dashboard-warning-text">
                  <i className="fas fa-exclamation-triangle"></i> You must create a project first.
                </p>
                <Link href="/projects" className="btn btn-primary" title="Go to projects page to create one">
                  Create Project
                </Link>
              </div>
            ) : (
              <form onSubmit={handleCreateTask}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Task Title *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="Task description..."
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      title="Enter the name or summary of the task"
                    />
                  </div>

                  <div className="form-group">
                    <label>Project *</label>
                    <select
                      className="form-control"
                      required
                      value={formData.project_id}
                      onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                      title="Select the project this task belongs to"
                    >
                      <option value="" disabled>Select Project</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Priority</label>
                      <select
                        className="form-control"
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        title="Set the task priority level"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Deadline</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.deadline}
                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                        title="Choose a completion deadline"
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setIsModalOpen(false)}
                    title="Cancel and close"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={isSubmitting}
                    title="Click to create the task"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Task'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}