'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL;
const getToken = () => localStorage.getItem('token');

export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTasksModalOpen, setIsTasksModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [selectedProject, setSelectedProject] = useState(null);
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [editForm, setEditForm] = useState({ name: '', description: '' });

  const [projectTasks, setProjectTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API}/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to fetch projects');
      
      setProjects(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(createForm),
      });
      if (!res.ok) throw new Error('Failed to create project');

      const newProject = await res.json();

      setProjects((prev) => [newProject, ...prev]);
      setIsCreateModalOpen(false);
      setCreateForm({ name: '', description: '' });

      toast.success('Project created successfully!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API}/projects/${selectedProject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(editForm),
      });

      if (!res.ok) throw new Error('Failed to update project');

      const updated = await res.json();
      setProjects((prev) =>
        prev.map((p) =>
          p.id === updated.id
            ? { ...p, name: updated.name, description: updated.description }
            : p
        )
      );
      setIsEditModalOpen(false);
      setSelectedProject(null);

      toast.success('Project updated successfully!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProject?.id) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API}/projects/${selectedProject.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      if (!res.ok) throw new Error('Failed to delete project');

      setProjects((prev) => prev.filter((p) => p.id !== selectedProject.id));

      setIsDeleteModalOpen(false);
      setSelectedProject(null);

      toast.success('Project deleted!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openTasks = async (project) => {
    setSelectedProject(project);
    setIsTasksModalOpen(true);
    setLoadingTasks(true);

    try {
      const res = await fetch(`${API}/tasks?project_id=${project.id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      if (!res.ok) throw new Error('Failed to fetch tasks');

      setProjectTasks(await res.json());
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingTasks(false);
    }
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

  return {
    // Data
    projects,
    loading,
    error,
    isSubmitting,
    projectTasks,
    loadingTasks,
    selectedProject,

    // Forms
    createForm,
    setCreateForm,
    editForm,
    setEditForm,

    // Modal toggles
    isCreateModalOpen,
    setIsCreateModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    isTasksModalOpen,
    setIsTasksModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,

    // Actions
    handleCreate,
    handleEdit,
    handleDelete,
    openTasks,
    openEdit,
    openDelete,
  };
}