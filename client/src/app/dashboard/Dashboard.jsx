'use client';
import Link from 'next/link';
import { formatDate } from '@/lib';
import { useDashboard } from './useDashboard';
import { QuickTaskModal, DashboardSkeleton } from './components';
import './dashboard.css';

const getUrgencyText = (deadlineDate) => {
  if (!deadlineDate) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(deadlineDate);
  deadline.setHours(0, 0, 0, 0);

  const diffTime = deadline - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays > 1) return `In ${diffDays} days`;
  return 'Overdue';
};

export default function Dashboard() {
  const {
    user, dashboardData, projects, loading, error,
    isModalOpen, setIsModalOpen, isSubmitting, formData, setFormData,
    fieldErrors, setFieldErrors, handleCreateTask
  } = useDashboard();

  if (loading || !user) {
    return <DashboardSkeleton />;
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

  const { statistics, activeTasks, upcomingDeadlines, overdueTasks = [] } = dashboardData;

  const completionRate = statistics.totalTasks > 0
    ? Math.round((statistics.completedTasks / statistics.totalTasks) * 100)
    : 0;

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFieldErrors({});
  };

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
        <div className="stat-card" title="Overall task completion rate">
          <div className="stat-icon stat-icon-info">
            <i className="fas fa-chart-pie"></i>
          </div>
          <div className="stat-info stat-info-full">
            <div className="stat-header-row">
              <p className="stat-label">Completion</p>
              <h3>{completionRate}%</h3>
            </div>
            <div className="stat-progress-container">
              <div className="stat-progress-fill" style={{ width: `${completionRate}%` }}></div>
            </div>
          </div>
        </div>
      </section>

      <div className="dashboard-content-grid">
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

                        {task.project_name && (
                          <span className="dash-task-project" title={`Project: ${task.project_name}`}>
                            <i className="fas fa-folder-open"></i> {task.project_name}
                          </span>
                        )}

                        <span className="dash-task-info-item" title="Task Deadline">
                          <i className="fas fa-stopwatch"></i>
                          {task.deadline ? formatDate(task.deadline) : 'No date'}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <div className="dashboard-side-column">

          {overdueTasks.length > 0 && (
            <section className="card">
              <div className="card-header">
                <h2><i className="fas fa-exclamation-triangle text-danger"></i> Overdue</h2>
              </div>
              <div className="card-body dashboard-card-body">
                <ul className="dash-task-list">
                  {overdueTasks.map(task => (
                    <li key={task.id} className="dash-task-link">
                      <Link href={`/tasks?highlight=${task.id}`}>
                        <div className="dash-task-item dash-task-overdue">
                          <h4>{task.title}</h4>
                          <span className="dash-task-overdue-text" title="Task is past its deadline">
                            <i className="fas fa-calendar-times"></i>
                            {task.project_name ? `${task.project_name} — Overdue` : 'Overdue'}
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          <section className="card">
            <div className="card-header">
              <h2><i className="fas fa-clock"></i> Upcoming Deadlines</h2>
            </div>
            <div className="card-body dashboard-card-body">
              {upcomingDeadlines.length === 0 ? (
                <p className="empty-state">No upcoming deadlines.</p>
              ) : (
                <ul className="dash-task-list">
                  {upcomingDeadlines.map(task => (
                    <li key={task.id} className="dash-task-link">
                      <Link href={`/tasks?highlight=${task.id}`}>
                        <div className="dash-task-item dash-task-upcoming">
                          <div className="dash-task-upcoming-info">
                            <h4>{task.title}</h4>
                            <span
                              className={`badge priority-${task.priority?.toLowerCase() || 'medium'}`}
                              title={`Priority: ${task.priority}`}
                            >
                              {task.priority || 'Medium'}
                            </span>
                          </div>
                          <span className="dash-task-due" title="Approaching deadline">
                            <i className="fas fa-exclamation-circle"></i>
                            Due {getUrgencyText(task.deadline)}
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>

      <QuickTaskModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        projects={projects}
        formData={formData}
        setFormData={setFormData}
        fieldErrors={fieldErrors}
        setFieldErrors={setFieldErrors}
        isSubmitting={isSubmitting}
        onSubmit={handleCreateTask}
      />
    </div>
  );
}