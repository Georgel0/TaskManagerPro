'use client';
import { useEffect, useState } from 'react';
import { useApp } from '@/context';
import toast from 'react-hot-toast';
import './tasks.css';

export default function Tasks() {
  const { user } = useApp();

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', status: 'To Do', priority: 'Medium', deadline: '', project_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const [tasksRes, projectsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!tasksRes.ok || !projectsRes.ok) throw new Error('Failed to fetch data');
      
      const tasksData = await tasksRes.json();
      const projectsData = await projectsRes.json();
      
      setTasks(tasksData);
      setProjects(projectsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
        body: JSON.stringify({...formData, assigned_user_id: user.id })
      });

      if (!response.ok) throw new Error('Failed to create task');
      
      const newTask = await response.json();
      setTasks([newTask, ...tasks]);
      setIsModalOpen(false);
      setFormData({ title: '', description: '', status: 'To Do', priority: 'Medium', deadline: '', project_id: '' });

      toast.success('Task created successfully!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete task');
      
      setTasks(tasks.filter(t => t.id !== id));
      toast.success('Task deleted!');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading || !user) return <div className='loading-state'><div className="pulse-ring"></div><p>Loading Tasks...</p></div>;

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
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <i className="fas fa-plus"></i> New Task 
        </button>
      </div>

      <div className="tasks-filters">
        {['All', 'Active', 'Completed'].map(f => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'} filter-btn`}
          >
            {f}
          </button>
        ))}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="card">
        <div className="card-body p-0">
          {filteredTasks.length === 0 ? (
            <p className="empty-state">No tasks found for this filter.</p>
          ) : (
            <ul className="tasks-list" style={{ listStyle: 'none', padding: 0 }}>
              {filteredTasks.map(task => (
                <li key={task.id} className="tasks-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', borderBottom: '1px solid var(--border-color)' }}>
                  <div className="task-info-group">
                    <h4 className="task-title">{task.title}</h4>
                    <span className="task-due-date text-xs text-secondary">
                      <i className="fas fa-calendar"></i> Due: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}
                    </span>
                  </div>
                  <div className="task-meta-group" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span className={`badge priority-${task.priority?.toLowerCase() || 'medium'}`}>
                      {task.priority || 'Medium'}
                    </span>
                    <span className="badge status-badge">
                      {task.status || 'To Do'}
                    </span>
                    <button className="btn-icon delete-btn" onClick={() => handleDeleteTask(task.id)} title="Delete Task">
                      <i className="fas fa-trash text-error"></i>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Task</h3>
              <button className="btn-icon close-modal-btn" onClick={() => setIsModalOpen(false)}><i className="fas fa-times"></i></button>
            </div>
            
            {projects.length === 0 ? (
              <div className="modal-body text-center">
                <p className="text-warning"><i className="fas fa-exclamation-triangle"></i> You need to create a project first before adding tasks.</p>
              </div>
            ) : (
              <form onSubmit={handleCreateTask}>
                <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                  <div className="form-group">
                    <label>Task Title *</label>
                    <input type="text" className="form-control" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                  </div>
                  
                  <div className="form-group">
                    <label>Project *</label>
                    <select className="form-control" required value={formData.project_id} onChange={(e) => setFormData({...formData, project_id: e.target.value})}>
                      <option value="" disabled>Select a project</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>

                  <div className="form-group" style={{ display: 'flex', gap: '15px' }}>
                    <div style={{ flex: 1 }}>
                      <label>Priority</label>
                      <select className="form-control" value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})}>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label>Status</label>
                      <select className="form-control" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Done">Done</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Deadline</label>
                    <input type="date" className="form-control" value={formData.deadline} onChange={(e) => setFormData({...formData, deadline: e.target.value})} />
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea className="form-control" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}></textarea>
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