'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context';
import './dashboard.css';

export default function Dashboard() {
  const { user } = useApp();
  
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/';
        return;
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Failed to fetch dashboard data');

        const data = await response.json();
        setDashboardData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

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
      <div className="dashboard-container">
        <div className="error-card">
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const { statistics, activeTasks, upcomingDeadlines } = dashboardData;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>Welcome back, {user.name}</h1>
          <p className="text-secondary">Here are your projects.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary">
            <i className="fas fa-plus"></i> New Task
          </button>
          <Link href='/projects' className="btn btn-primary">
            <i className="fas fa-arrow-right"></i> See Projects
          </Link>
        </div>
      </header>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon bg-primary-light">
            <i className="fas fa-tasks text-primary"></i>
          </div>
          <div className="stat-info">
            <h3>Total Tasks</h3>
            <p className="stat-number">{statistics.totalTasks}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-warning-light">
            <i className="fas fa-hourglass-half text-warning"></i>
          </div>
          <div className="stat-info">
            <h3>Pending</h3>
            <p className="stat-number">{statistics.pendingTasks}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-success-light">
            <i className="fas fa-check-circle text-success"></i>
          </div>
          <div className="stat-info">
            <h3>Completed</h3>
            <p className="stat-number">{statistics.completedTasks}</p>
          </div>
        </div>
      </section>

      <div className="dashboard-content-grid">

        <section className="card dashboard-card">
          <div className="card-header">
            <h2><i className="fas fa-list-ul"></i> Active Tasks</h2>
            <Link href="/tasks" className="btn btn-icon"><i className="fas fa-arrow-right"></i></Link>
          </div>
          <div className="card-body p-0">
            {activeTasks.length === 0 ? (
              <p className="empty-state">No active tasks right now.</p>
            ) : (
              <ul className="task-list">
                {activeTasks.map(task => (
                  <li key={task.id} className="task-item">
                    <div className="task-item-main">
                      <span className={`status-dot status-${task.status.toLowerCase().replace(' ', '-')}`}></span>
                      <div className="task-details">
                        <h4>{task.title}</h4>
                        <span className="text-xs text-secondary">
                          Due: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}
                        </span>
                      </div>
                    </div>
                    <div className="task-item-meta">
                      <span className={`badge priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
                      <span className="badge status-badge">{task.status}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="card dashboard-card">
          <div className="card-header">
            <h2><i className="fas fa-clock"></i> Upcoming Deadlines</h2>
          </div>
          <div className="card-body p-0">
            {upcomingDeadlines.length === 0 ? (
              <p className="empty-state">No immediate deadlines in the next 7 days.</p>
            ) : (
              <ul className="task-list">
                {upcomingDeadlines.map(task => (
                  <li key={task.id} className="task-item border-left-warning">
                    <div className="task-item-main">
                      <div className="task-details">
                        <h4>{task.title}</h4>
                        <span className="text-xs text-warning">
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
    </div>
  );
}