'use client';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL;
const getToken = () => {
  if (typeof window !== 'undefined') return localStorage.getItem('token');
  return null;
};

export function useProjects() {
  const queryClient = useQueryClient();

  const [selectedProject, setSelectedProject] = useState(null);
  const [createForm, setCreateForm] = useState({ name: '', description: '', tags: [], color: null });
  const [editForm, setEditForm] = useState({ name: '', description: '', tags: [], color: null });
  const [activeTagFilter, setActiveTagFilter] = useState('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTasksModalOpen, setIsTasksModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isAnnouncementsModalOpen, setIsAnnouncementsModalOpen] = useState(false);
  const [quickAddProject, setQuickAddProject] = useState(null);
  const [readmeProject, setReadmeProject] = useState(null);

  const { data: projects = [], isLoading: loading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch(`${API}/projects`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json();
    },
    enabled: !!getToken(),
  });

  const setProjects = (updater) => {
    queryClient.setQueryData(['projects'], (oldData) =>
      typeof updater === 'function' ? updater(oldData || []) : updater
    );
  };

  // All unique tags across all projects for the filter bar
  const allTags = useMemo(() => {
    const seen = new Set();
    for (const p of projects) {
      for (const tag of p.tags || []) seen.add(tag);
    }
    return Array.from(seen).sort();
  }, [projects]);

  const filteredProjects = useMemo(() =>
    activeTagFilter
      ? projects.filter((p) => (p.tags || []).includes(activeTagFilter))
      : projects,
    [projects, activeTagFilter]
  );

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
    onSuccess: (newProject, variables) => {
      queryClient.setQueryData(['projects'], (prev = []) => [
        { ...newProject, task_count: 0, done_task_count: 0, member_count: 1 + variables.pendingMembers.length, announcement_count: 0, is_starred: false },
        ...prev,
      ]);
      setIsCreateModalOpen(false);
      setCreateForm({ name: '', description: '', tags: [], color: null });
      toast.success('Project created!');
    },
    onError: (err) => toast.error(err.message),
  });

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
      toast.success('Project updated!');
    },
    onError: (err) => toast.error(err.message),
  });

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

  const starMutation = useMutation({
    mutationFn: async (projectId) => {
      const res = await fetch(`${API}/projects/${projectId}/star`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to toggle star');
      return { ...(await res.json()), projectId };
    },
    onSuccess: ({ starred, projectId }) => {
      queryClient.setQueryData(['projects'], (prev = []) => {
        const updated = prev.map((p) => p.id === projectId ? { ...p, is_starred: starred } : p);
        return [...updated].sort((a, b) => b.is_starred - a.is_starred || new Date(b.created_at) - new Date(a.created_at));
      });
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCreate = (e, pendingMembers = [], finalForm = createForm) => {
    e.preventDefault();
    createMutation.mutate({ form: finalForm, pendingMembers });
  };

  const handleEdit = (e, pendingMembers, finalForm = editForm) => {
    e.preventDefault();
    editMutation.mutate(finalForm);
  };

  const handleDelete = () => deleteMutation.mutate();
  const handleStar = (projectId) => starMutation.mutate(projectId);

  const openEdit = (project) => {
    setSelectedProject(project);
    setEditForm({ name: project.name, description: project.description || '', tags: project.tags || [], color: project.color || null });
    setIsEditModalOpen(true);
  };

  const openDelete = (project) => { setSelectedProject(project); setIsDeleteModalOpen(true); };
  const openAnnouncements = (project) => { setSelectedProject(project); setIsAnnouncementsModalOpen(true); };
  const openTasks = (project) => { setSelectedProject(project); setIsTasksModalOpen(true); };
  const openMembers = (project) => { setSelectedProject(project); setIsMembersModalOpen(true); };
  const openQuickAdd = (project) => setQuickAddProject(project);

  const handleAnnouncementCreated = (projectId) => {
    setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, announcement_count: (p.announcement_count ?? 0) + 1 } : p));
  };

  const handleAnnouncementDeleted = (projectId) => {
    setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, announcement_count: Math.max(0, (p.announcement_count ?? 0) - 1) } : p));
  };

  return {
    projects: filteredProjects, allProjects: projects, setProjects,
    loading, error: error?.message,
    isSubmitting: createMutation.isPending || editMutation.isPending || deleteMutation.isPending,
    selectedProject, setSelectedProject,
    createForm, setCreateForm,
    editForm, setEditForm,
    activeTagFilter, setActiveTagFilter, allTags,
    isCreateModalOpen, setIsCreateModalOpen,
    isEditModalOpen, setIsEditModalOpen,
    isDeleteModalOpen, setIsDeleteModalOpen,
    isTasksModalOpen, setIsTasksModalOpen,
    isMembersModalOpen, setIsMembersModalOpen,
    isAnnouncementsModalOpen, setIsAnnouncementsModalOpen,
    quickAddProject, setQuickAddProject,
    readmeProject, setReadmeProject,
    projectTasks, loadingTasks,
    handleCreate, handleEdit, handleDelete, handleStar,
    openEdit, openDelete, openTasks, openMembers,
    openAnnouncements, openQuickAdd,
    handleAnnouncementCreated, handleAnnouncementDeleted,
  };
}