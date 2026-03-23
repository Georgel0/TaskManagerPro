'use client';
import { useEffect, useState } from 'react';
import { useApp } from '@/context';
import './tasks.css'

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
    <div className="page-content" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2><i className="fas fa-tasks"></i> All Tasks</h2>
        <button className="btn btn-primary" style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: 'none', backgroundColor: 'var(--accent-color)', color: '#fff', cursor: 'pointer' }}>
          <i className="fas fa-plus"></i> New Task
        </button>
      </div>

      <div className="filters" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        {['All', 'Active', 'Completed'].map(f => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            style={{ 
              padding: '6px 12px', 
              borderRadius: '20px', 
              border: '1px solid var(--border-color)',
              backgroundColor: filter === f ? 'var(--accent-color)' : 'var(--card-background)',
              color: filter === f ? '#fff' : 'var(--pri-text-color)',
              cursor: 'pointer'
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {error && <div className="error-message" style={{ color: 'var(--error-color)' }}>{error}</div>}

      <div className="card dashboard-card">
        <div className="card-body p-0">
          {filteredTasks.length === 0 ? (
            <p className="empty-state" style={{ padding: '20px', textAlign: 'center', color: 'var(--sec-text-color)' }}>
              No tasks found for this filter.
            </p>
          ) : (
            <ul className="task-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {filteredTasks.map(task => (
                <li key={task.id} className="task-item" style={{ padding: '15px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="task-item-main">
                    <h4 style={{ margin: '0 0 5px 0' }}>{task.title}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--sec-text-color)' }}>
                      <i className="fas fa-calendar"></i> Due: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}
                    </span>
                  </div>
                  <div className="task-meta" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span className={`badge priority-${task.priority?.toLowerCase() || 'medium'}`} style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px' }}>
                      {task.priority || 'Medium'}
                    </span>
                    <span className="badge status-badge" style={{ backgroundColor: 'var(--sec-background)', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px' }}>
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