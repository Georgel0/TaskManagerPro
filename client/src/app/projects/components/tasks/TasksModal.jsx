'use client';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

const API = process.env.NEXT_PUBLIC_API_URL;
const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

export function TasksModal({ project, tasks, loading, onClose }) {
  const router = useRouter();

  const handleTaskClick = (taskId) => {
    onClose();
    router.push(`/tasks?highlight=${taskId}`);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3><i className="fas fa-tasks"></i> {project.name}</h3>
          <button className="btn-icon" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body modal-body-scroll">
          {loading ? (
            <p>Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <>
              <p className="empty-state">No tasks in this project yet.</p>
              <Link href='/tasks' className="empty-state-btn" title='Tasks'>
                <i className="fas fa-arrow-right"></i> Tasks
              </Link>
            </>
          ) : (
            <ul className="project-tasks-list">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="project-task-item"
                  onClick={() => handleTaskClick(task.id)}
                >
                  <div>
                    <span className="project-task-item-title" >{task.title}</span>
                    <span title="Deadline">
                      <i className="fas fa-calendar"></i>{' '}
                      {task.deadline
                        ? new Date(task.deadline).toLocaleDateString()
                        : 'No deadline'}
                    </span>
                  </div>
                  <div>
                    <span className={`badge priority-${task.priority?.toLowerCase() || 'medium'}`} title="Priority">
                      {task.priority || 'Medium'}
                    </span>
                    <span className="badge status-badge" title="Status">{task.status}</span>
                    <i className="fas fa-arrow-right"></i>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} title='Close'>Close</button>
        </div>
      </div>
    </div>
  );
}

export function TasksWindowContent({ project, onClose }) {
  const { data: tasks = [], isFetching: loading } = useQuery({
    queryKey: ['projects', project.id, 'tasks'],
    queryFn: async () => {
      const res = await fetch(`${API}/tasks?project_id=${project.id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to fetch tasks');
      return res.json();
    },
    enabled: !!project.id,
  });

  return <TasksModal project={project} tasks={tasks} loading={loading} onClose={onClose} />;
}