'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL;
const getToken = () => localStorage.getItem('token');

export function useArchive() {
  const queryClient = useQueryClient();

  const { data: archivedProjects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['archive', 'projects'],
    queryFn: async () => {
      const res = await fetch(`${API}/archive/projects`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to fetch archived projects');
      return res.json();
    },
  });

  const { data: archivedTasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['archive', 'tasks'],
    queryFn: async () => {
      const res = await fetch(`${API}/archive/tasks`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to fetch archived tasks');
      return res.json();
    },
  });

  const archiveProjectMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`${API}/archive/projects/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to archive project');
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['archive', 'projects'] });
      queryClient.invalidateQueries({ queryKey: ['archive', 'tasks'] });
      toast.success('Project archived.');
    },
    onError: (err) => toast.error(err.message),
  });

  const restoreProjectMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`${API}/archive/projects/${id}/restore`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to restore project');
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['archive', 'projects'] });
      queryClient.invalidateQueries({ queryKey: ['archive', 'tasks'] });
      toast.success('Project restored.');
    },
    onError: (err) => toast.error(err.message),
  });

  const permanentDeleteProjectMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`${API}/archive/projects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to delete project');
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData(['archive', 'projects'], (prev = []) =>
        prev.filter((p) => p.id !== id)
      );
      toast.success('Project permanently deleted.');
    },
    onError: (err) => toast.error(err.message),
  });

  const archiveTaskMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`${API}/archive/tasks/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to archive task');
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['archive', 'tasks'] });
      toast.success('Task archived.');
    },
    onError: (err) => toast.error(err.message),
  });

  const restoreTaskMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`${API}/archive/tasks/${id}/restore`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to restore task');
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['archive', 'tasks'] });
      toast.success('Task restored.');
    },
    onError: (err) => toast.error(err.message),
  });

  const permanentDeleteTaskMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`${API}/archive/tasks/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to delete task');
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData(['archive', 'tasks'], (prev = []) =>
        prev.filter((t) => t.id !== id)
      );
      toast.success('Task permanently deleted.');
    },
    onError: (err) => toast.error(err.message),
  });

  return {
    archivedProjects,
    archivedTasks,
    loadingProjects,
    loadingTasks,

    archiveProject: archiveProjectMutation.mutate,
    restoreProject: restoreProjectMutation.mutate,
    permanentDeleteProject: permanentDeleteProjectMutation.mutate,

    archiveTask: archiveTaskMutation.mutate,
    restoreTask: restoreTaskMutation.mutate,
    permanentDeleteTask: permanentDeleteTaskMutation.mutate,
  };
}