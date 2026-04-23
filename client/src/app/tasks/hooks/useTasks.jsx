'use client';
import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL;
const getToken = () => localStorage.getItem('token');

export function useTasks() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  const [statusFilter, setStatusFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');

  const highlightId = searchParams.get('highlight');
  const urlProjectId = searchParams.get('project_id');
  const urlUserId = searchParams.get('user_id');

  // Fetch Tasks
  const {
    data: tasks = [],
    isLoading: isTasksLoading,
    error: tasksError
  } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await fetch(`${API}/tasks`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (!res.ok) throw new Error('Failed to fetch tasks');
      return res.json();
    },
  });

  // Fetch Projects
  const {
    data: projects = [],
    isLoading: isProjectsLoading,
    error: projectsError
  } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch(`${API}/projects`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json();
    },
  });

  const loading = isTasksLoading || isProjectsLoading;
  const error = (tasksError?.message || projectsError?.message) || null;

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
  }, [highlightId, tasks.length]);

  // Create Task
  const createMutation = useMutation({
    mutationFn: async (taskData) => {
      const res = await fetch(`${API}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(taskData),
      });
      if (!res.ok) throw new Error('Failed to create task');
      return res.json();
    },
    onSuccess: (newTask) => {
      queryClient.setQueryData(['tasks'], (oldTasks = []) => [newTask, ...oldTasks]);
      toast.success('Task created successfully!');
    },
    onError: (err) => toast.error(err.message),
  });

  // Update Task
  const updateMutation = useMutation({
    mutationFn: async ({ id, taskData }) => {
      const res = await fetch(`${API}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(taskData),
      });
      if (!res.ok) throw new Error('Failed to update task');
      return { updatedTask: await res.json(), taskData };
    },
    onSuccess: ({ updatedTask, taskData }) => {
      // Optimistically update the cache instead of full refetch
      queryClient.setQueryData(['tasks'], (oldTasks = []) =>
        oldTasks.map((t) =>
          t.id === updatedTask.id
            ? {
              ...t,
              ...updatedTask,
              assigned_user_name: taskData.assigned_user_id ? taskData.assigned_user_name : null,
            }
            : t
        )
      );
      toast.success('Task updated successfully!');
    },
    onError: (err) => toast.error(err.message),
  });

  // Delete Task
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`${API}/tasks/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to delete task');
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData(['tasks'], (oldTasks = []) =>
        oldTasks.filter((t) => t.id !== deletedId)
      );
      toast.success('Task deleted!');
    },
    onError: (err) => toast.error(err.message),
  });


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
    queryClient.setQueryData(['tasks'], (oldTasks = []) =>
      oldTasks.map((t) =>
        t.id === taskId
          ? { ...t, comment_count: Math.max(0, (parseInt(t.comment_count) || 0) + amount) }
          : t
      )
    );
  };

  const handleAttachmentCountChange = (taskId, amount) => {
    queryClient.setQueryData(['tasks'], (oldTasks = []) =>
      oldTasks.map((t) =>
        t.id === taskId
          ? { ...t, attachment_count: Math.max(0, (parseInt(t.attachment_count) || 0) + amount) }
          : t
      )
    );
  };

  const createTask = async (taskData) => {
    try {
      await createMutation.mutateAsync(taskData);
      return true;
    } catch { return false; }
  };

  const updateTask = async (id, taskData) => {
    try {
      await updateMutation.mutateAsync({ id, taskData });
      return true;
    } catch { return false; }
  };

  const deleteTask = async (id) => {
    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch { return false; }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return {
    projects,
    loading,
    error,
    isSubmitting,
    filteredTasks,

    statusFilter, setStatusFilter,
    projectFilter, setProjectFilter,
    userFilter, setUserFilter,
    usersInSelectedProject,
    hasActiveFilters,
    clearFilters,

    createTask,
    updateTask,
    deleteTask,
    handleCommentCountChange,
    handleAttachmentCountChange
  };
}