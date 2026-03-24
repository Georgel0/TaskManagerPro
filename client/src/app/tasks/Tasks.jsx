'use client';
import { useEffect, useState } from 'react';
import { useApp } from '@/context';
import './tasks.css';

export default function Tasks() {
  const { user } = useApp();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const fetchTasks = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch tasks');
        
        const data = await response.json();
        setTasks(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  if (loading || !user) {
    return (
      <div className='loading-state'>
        <div className="pulse-ring"></div>
        <p>Loading Tasks...</p>
      </div>
    );
  }

  const filteredTasks = tasks.filter(task => {
    if (filter === 'All') return true;
    if (filter === 'Active') return task.status !== 'Done';
    if (filter === 'Completed') return task.status === 'Done';
    return true;
  });

  return (
    <div className="page-content">
      <div className="tasks-header">
        <h2><i className="fas fa-tasks"></i> All Tasks</h2>
        <button className="btn btn-primary">
          <i className="fas fa-plus"></i> New Task 
        </button>
      </div>

      <div className="tasks-filters">
        {['All', 'Active', 'Completed'].map(f => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            className={`filter-btn ${filter === f ? 'active' : ''}`}
          >
            {f}
          </button>
        ))}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="card">
        <div className="card-body p-0">
          {filteredTasks.length === 0 ? (
            <p className="tasks-empty-state">
              No tasks found for this filter.
            </p>
          ) : (
            <ul className="tasks-list">
              {filteredTasks.map(task => (
                <li key={task.id} className="tasks-item">
                  <div className="task-info-group">
                    <h4 className="task-title">{task.title}</h4>
                    <span className="task-due-date">
                      <i className="fas fa-calendar"></i> Due: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}
                    </span>
                  </div>
                  <div className="task-meta-group">
                    <span className={`badge priority-${task.priority?.toLowerCase() || 'medium'}`}>
                      {task.priority || 'Medium'}
                    </span>
                    <span className="badge status-badge">
                      {task.status || 'To Do'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}