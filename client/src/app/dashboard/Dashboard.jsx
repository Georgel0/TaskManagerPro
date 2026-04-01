'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context';
import toast from 'react-hot-toast';
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

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/';
      return;
    }

    try {
      const [dashRes, projectsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
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
      <div className='loading-state'>
        <div className="pulse-ring"></div>
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content">
        <div className="error-message dashboard-error">
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
          <p className="dashboard-subtitle">Here is your overview.</p>
        </div>
        <div className="dashboard-header-actions">
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} title='New Task'>
            <i className="fas fa-plus"></i> New Task
          </button>
          <Link href='/projects' className="btn btn-secondary dashboard-projects-btn" title='Projects'>
            <i className="fas fa-arrow-right"></i> Projects
          </Link>
        </div>
      </header>

      <section className="stats-grid">
        <div className="card stat-card">
          <div className="stat-icon stat-icon-primary">
            <i className="fas fa-tasks"></i>
          </div>
          <div className="stat-info">
            <p className="stat-label">Total Tasks</p>
            <h3>{statistics.totalTasks}</h3>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon stat-icon-warning">
            <i className="fas fa-hourglass-half"></i>
          </div>
          <div className="stat-info">
            <p className="stat-label">Pending</p>
            <h3>{statistics.pendingTasks}</h3>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon stat-icon-success">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-info">
            <p className="stat-label">Completed</p>
            <h3>{statistics.completedTasks}</h3>
          </div>
        </div>
      </section>

      <div className="dashboard-content-grid">
        <section className="card">
          <div className="card-header">
            <h2><i className="fas fa-list-ul"></i> Active Tasks</h2>
            <Link href="/tasks" className="btn-icon"><i className="fas fa-arrow-right"></i></Link>
          </div>
          <div className="card-body dashboard-card-body">
            {activeTasks.length === 0 ? (
              <p className="empty-state">No active tasks right now.</p>
            ) : (
              <ul className="dash-task-list">
                {activeTasks.map(task => (
                  <Link key={task.id} href={`/tasks?highlight=${task.id}`} className="dash-task-item dash-task-link">
                    <div className="dash-task-main">
                      <div className="dash-task-details">
                        <h4>{task.title}</h4>
                        <span className={`badge priority-${task.priority?.toLowerCase() || 'medium'}`}>
                          {task.priority || 'Medium'}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <h2><i className="fas fa-clock"></i> Upcoming Deadlines</h2>
          </div>
          <div className="card-body dashboard-card-body">
            {upcomingDeadlines.length === 0 ? (
              <p className="empty-state">No immediate deadlines in the next 7 days.</p>
            ) : (
              <ul className="dash-task-list">
                {upcomingDeadlines.map(task => (
                  <li key={task.id} className="dash-task-item dash-task-upcoming">
                    <div className="dash-task-main">
                      <div className="dash-task-details">
                        <h4>{task.title}</h4>
                        <span className="dash-task-due">
                          <i className="fas fa-exclamation-circle"></i> Due: {new Date(task.deadline).toLocaleDateString()}
                        </span>
                      </div>
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
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="modal-body dashboard-empty-project-modal">
                <p className="dashboard-warning-text">
                  <i className="fas fa-exclamation-triangle"></i> You must create a project before adding tasks.
                </p>
                <Link href="/projects" className="btn btn-primary">Go to Projects</Link>
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
                      placeholder="What needs to be done?"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Project *</label>
                    <select
                      className="form-control"
                      required
                      value={formData.project_id}
                      onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                    >
                      <option value="" disabled>Assign to project</option>
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
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
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