'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL;
const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

export function useProjects() {
  const queryClient = useQueryClient();

  const [selectedProject, setSelectedProject] = useState(null);
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [editForm, setEditForm] = useState({ name: '', description: '' });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTasksModalOpen, setIsTasksModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isAnnouncementsModalOpen, setIsAnnouncementsModalOpen] = useState(false);

  const {
    data: projects = [],
    isLoading: loading,
    error
  } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch(`${API}/projects`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json();
    },
    enabled: !!getToken(),
  });

  // Helper to maintain compatibility with other hooks that call setProjects()
  const setProjects = (updater) => {
    queryClient.setQueryData(['projects'], (oldData) => {
      return typeof updater === 'function' ? updater(oldData || []) : updater;
    });
  };

  // Only fetches when the Tasks modal is open and a project is selected
  const { data: projectTasks = [], isFetching: loadingTasks } = useQuery({
    queryKey: ['projects', selectedProject?.id, 'tasks'],
    queryFn: async () => {
      const res = await fetch(`${API}/tasks?project_id=${selectedProject.id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to fetch tasks');
      return res.json();
    },
    enabled: isTasksModalOpen && !!selectedProject?.id,
  });

  // Create Project
  const createMutation = useMutation({
    mutationFn: async ({ form, pendingMembers }) => {
      const res = await fetch(`${API}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to create project');
      const newProject = await res.json();

      if (pendingMembers.length > 0) {
        await Promise.all(
          pendingMembers.map((member) =>
            fetch(`${API}/projects/${newProject.id}/members`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
              body: JSON.stringify({ email: member.email }),
            })
          )
        );
      }
      return newProject;
    },
    onSuccess: (newProject) => {
      queryClient.setQueryData(['projects'], (prev = []) => [
        { ...newProject, task_count: 0, member_count: 1 + pendingMembers.length, announcement_count: 0 },
        ...prev,
      ]);
      setIsCreateModalOpen(false);
      setCreateForm({ name: '', description: '' });
      toast.success('Project created successfully!');
    },
    onError: (err) => toast.error(err.message),
  });

  // Edit Project
  const editMutation = useMutation({
    mutationFn: async (form) => {
      const res = await fetch(`${API}/projects/${selectedProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to update project');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsEditModalOpen(false);
      setSelectedProject(null);
      toast.success('Project updated successfully!');
    },
    onError: (err) => toast.error(err.message),
  });

  // Delete Project
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API}/projects/${selectedProject.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to delete project');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsDeleteModalOpen(false);
      setSelectedProject(null);
      toast.success('Project deleted!');
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCreate = (e, pendingMembers = []) => {
    e.preventDefault();
    createMutation.mutate({ form: createForm, pendingMembers });
  };

  const handleEdit = (e) => {
    e.preventDefault();
    editMutation.mutate(editForm);
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const openEdit = (project) => {
    setSelectedProject(project);
    setEditForm({ name: project.name, description: project.description || '' });
    setIsEditModalOpen(true);
  };

  const openDelete = (project) => {
    setSelectedProject(project);
    setIsDeleteModalOpen(true);
  };

  const openAnnouncements = (project) => {
    setSelectedProject(project);
    setIsAnnouncementsModalOpen(true);
  };

  const openTasks = (project) => {
    setSelectedProject(project);
    setIsTasksModalOpen(true);
  };

  const openMembers = (project) => {
    setSelectedProject(project);
    setIsMembersModalOpen(true);
  };

  const handleAnnouncementCreated = (projectId) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, announcement_count: (p.announcement_count ?? 0) + 1 } : p
      )
    );
  };

  const handleAnnouncementDeleted = (projectId) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, announcement_count: Math.max(0, (p.announcement_count ?? 0) - 1) } : p
      )
    );
  };

  return {
    projects, setProjects,
    loading, error: error?.message,
    isSubmitting: createMutation.isPending || editMutation.isPending || deleteMutation.isPending,
    selectedProject, setSelectedProject,
    createForm, setCreateForm,
    editForm, setEditForm,
    isCreateModalOpen, setIsCreateModalOpen,
    isEditModalOpen, setIsEditModalOpen,
    isDeleteModalOpen, setIsDeleteModalOpen,
    isTasksModalOpen, setIsTasksModalOpen,
    isMembersModalOpen, setIsMembersModalOpen,
    isAnnouncementsModalOpen, setIsAnnouncementsModalOpen,
    projectTasks, loadingTasks,
    handleCreate, handleEdit, handleDelete,
    openEdit, openDelete, openTasks, openMembers,
    openAnnouncements, handleAnnouncementCreated,
    handleAnnouncementDeleted
  };
}