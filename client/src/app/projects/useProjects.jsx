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
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

  const [selectedProject, setSelectedProject] = useState(null);
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [editForm, setEditForm] = useState({ name: '', description: '' });

  const [projectTasks, setProjectTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  const [projectMembers, setProjectMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

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

  const handleCreate = async (e, pendingMembers = []) => {
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

      if (pendingMembers.length > 0) {
        await Promise.all(
          pendingMembers.map((member) =>
            fetch(`${API}/projects/${newProject.id}/members`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${getToken()}`,
              },
              body: JSON.stringify({ email: member.email }),
            })
          )
        );
      }

      setProjects((prev) => [
        { ...newProject, task_count: 0, member_count: 1 + pendingMembers.length },
        ...prev,
      ]);
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

  const openMembers = async (project) => {
    setSelectedProject(project);
    setIsMembersModalOpen(true);
    setLoadingMembers(true);

    try {
      const res = await fetch(`${API}/projects/${project.id}/members`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      if (!res.ok) throw new Error('Failed to fetch members');

      setProjectMembers(await res.json());
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleAddMember = async (email) => {
    try {
      const res = await fetch(`${API}/projects/${selectedProject.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add member');

      setProjectMembers((prev) => [...prev, data]);
      setProjects((prev) =>
        prev.map((p) =>
          p.id === selectedProject.id
            ? { ...p, member_count: (p.member_count ?? 1) + 1 }
            : p
        )
      );

      toast.success(`${data.name} added to the project!`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      const res = await fetch(
        `${API}/projects/${selectedProject.id}/members/${memberId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );

      if (!res.ok) throw new Error('Failed to remove member');

      setProjectMembers((prev) => prev.filter((m) => m.id !== memberId));
      setProjects((prev) =>
        prev.map((p) =>
          p.id === selectedProject.id
            ? { ...p, member_count: Math.max((p.member_count ?? 1) - 1, 1) }
            : p
        )
      );

      toast.success('Member removed.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleTransferOwnership = async (memberId) => {
    if (!selectedProject?.id) return;

    try {
      const res = await fetch(
        `${API}/projects/${selectedProject.id}/members/${memberId}/transfer`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );

      if (!res.ok) throw new Error('Failed to transfer ownership.');

      setProjects((prev) =>
        prev.map((p) =>
          p.id === selectedProject.id ? { ...p, owner_id: memberId } : p
        )
      );

      setProjectMembers((prev) =>
        prev.map((m) => {
          if (m.role === 'owner') return { ...m, role: 'member' };
          if (m.id === memberId) return { ...m, role: 'owner' };
          return m;
        })
      );

      setSelectedProject((prev) => ({ ...prev, owner_id: memberId }));

      toast.success('Ownership transferred successfully.');
    } catch (err) {
      toast.error(err.message);
    }
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
    projectMembers,
    loadingMembers,

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
    isMembersModalOpen,
    setIsMembersModalOpen,

    // Actions
    handleCreate,
    handleEdit,
    handleDelete,
    handleAddMember,
    handleRemoveMember,
    handleTransferOwnership,
    openTasks,
    openEdit,
    openDelete,
    openMembers
  };
}