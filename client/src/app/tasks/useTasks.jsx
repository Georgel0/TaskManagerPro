'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

export function useTasks(user) {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!highlightId || tasks.length === 0) return;
    setFilter('All');

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
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const [tasksRes, projectsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects`, { headers: { 'Authorization': `Bearer ${token}` } })
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
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...taskData, assigned_user_id: user.id })
      });

      if (!response.ok) throw new Error('Failed to create task');
      
      const newTask = await response.json();
      setTasks([newTask, ...tasks]);

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
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(taskData)
      });

      if (!response.ok) throw new Error('Failed to update task');

      const updatedTask = await response.json();
      setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));

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
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to delete task');

      setTasks(tasks.filter(t => t.id !== id));

      toast.success('Task deleted!');
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'All') return true;
    if (filter === 'Active') return task.status !== 'Done';
    if (filter === 'Completed') return task.status === 'Done';
    return true;
  });

  return {
    projects,
    loading,
    error,
    filter,
    setFilter,
    isSubmitting,
    filteredTasks,
    createTask,
    updateTask,
    deleteTask
  };
}