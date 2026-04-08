'use client';
import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { useApp } from '@/context';

const API = process.env.NEXT_PUBLIC_API_URL;
const getToken = () => localStorage.getItem('token');

export function useTasks() {
  const { user } = useApp();

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [statusFilter, setStatusFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');

  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const urlProjectId = searchParams.get('project_id');
  const urlUserId = searchParams.get('user_id');

  useEffect(() => {
    fetchData();
  }, []);

  // Apply URL params once data is loaded
  useEffect(() => {
    if (loading) return;
    if (urlProjectId) setProjectFilter(urlProjectId);
    if (urlUserId) setUserFilter(urlUserId);
  }, [loading, urlProjectId, urlUserId]);

  useEffect(() => {
    if (!highlightId || tasks.length === 0) return;
    setStatusFilter('All');
    setProjectFilter('');
    setUserFilter('');

    setTimeout(() => {
      const el = document.getElementById(`task-${highlightId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('task-highlight');
        setTimeout(() => el.classList.remove('task-highlight'), 1500);
      }
    }, 150);
  }, [highlightId, tasks]);

  const fetchData = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const [tasksRes, projectsRes] = await Promise.all([
        fetch(`${API}/tasks`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/projects`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (!tasksRes.ok || !projectsRes.ok) throw new Error('Failed to fetch data');

      setTasks(await tasksRes.json());
      setProjects(await projectsRes.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (taskData) => {
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(taskData),
      });

      if (!res.ok) throw new Error('Failed to create task');

      const newTask = await res.json();
      setTasks((prev) => [newTask, ...prev]);

      toast.success('Task created successfully!');
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateTask = async (id, taskData) => {
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(taskData),
      });

      if (!res.ok) throw new Error('Failed to update task');

      const updatedTask = await res.json();

      setTasks((prev) =>
        prev.map((t) =>
          t.id === updatedTask.id
            ? {
              ...t,
              ...updatedTask,
              assigned_user_name: taskData.assigned_user_id
                ? taskData.assigned_user_name
                : null,
            }
            : t
        )
      );
      
      toast.success('Task updated successfully!');
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteTask = async (id) => {
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API}/tasks/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      if (!res.ok) throw new Error('Failed to delete task');

      setTasks((prev) => prev.filter((t) => t.id !== id));

      toast.success('Task deleted!');
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Users from the currently selected project (for the user dropdown)
  const usersInSelectedProject = useMemo(() => {
    if (!projectFilter) return [];

    const projectTasks = tasks.filter((t) => String(t.project_id) === String(projectFilter));

    const seen = new Set();
    const users = [];

    for (const t of projectTasks) {
      if (t.assigned_user_id && !seen.has(t.assigned_user_id)) {
        seen.add(t.assigned_user_id);
        users.push({ id: t.assigned_user_id, name: t.assigned_user_name ?? `User #${t.assigned_user_id}` });
      }
    }

    return users;
  }, [tasks, projectFilter]);

  const filteredTasks = useMemo(() =>
    tasks.filter((task) => {
      if (statusFilter === 'Active' && task.status === 'Done') return false;
      if (statusFilter === 'Completed' && task.status !== 'Done') return false;
      if (projectFilter && String(task.project_id) !== String(projectFilter)) return false;
      if (userFilter && String(task.assigned_user_id) !== String(userFilter)) return false;
      return true;
    }),
    [tasks, statusFilter, projectFilter, userFilter]
  );

  const clearFilters = () => {
    setStatusFilter('All');
    setProjectFilter('');
    setUserFilter('');
  };

  const hasActiveFilters = statusFilter !== 'All' || projectFilter !== '' || userFilter !== '';

  const handleCommentCountChange = (taskId, amount) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, comment_count: Math.max(0, (parseInt(t.comment_count) || 0) + amount) }
          : t
      )
    );
  };

  return {
    projects,
    loading,
    error,
    isSubmitting,
    filteredTasks,

    // filters
    statusFilter, setStatusFilter,
    projectFilter, setProjectFilter,
    userFilter, setUserFilter,
    usersInSelectedProject,
    hasActiveFilters,
    clearFilters,

    // actions
    createTask,
    updateTask,
    deleteTask,
    handleCommentCountChange
  };
}