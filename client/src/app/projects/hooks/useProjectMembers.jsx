'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL;
const getToken = () => localStorage.getItem('token');

export function useProjectMembers(selectedProject, setProjects) {
  const [projectMembers, setProjectMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    if (!selectedProject?.id) return;

    const fetchMembers = async () => {
      setLoadingMembers(true);
      try {
        const res = await fetch(`${API}/projects/${selectedProject.id}/members`, {
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

    fetchMembers();
  }, [selectedProject?.id]);

  const handleAddMember = async (email) => {
    try {
      const res = await fetch(`${API}/projects/${selectedProject.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add member');

      setProjectMembers((prev) => [...prev, data]);
      setProjects((prev) =>
        prev.map((p) =>
          p.id === selectedProject.id ? { ...p, member_count: (p.member_count ?? 1) + 1 } : p
        )
      );
      
      toast.success(`${data.name} added to the project!`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      const res = await fetch(`${API}/projects/${selectedProject.id}/members/${memberId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
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

  const handleTransferOwnership = async (memberId, setSelectedProject) => {
    try {
      const res = await fetch(
        `${API}/projects/${selectedProject.id}/members/${memberId}/transfer`,
        { method: 'PUT', headers: { Authorization: `Bearer ${getToken()}` } }
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

  const handleProjectLeave = async (projectToLeave, setSelectedProject) => {
    try {
      const res = await fetch(`${API}/projects/${projectToLeave.id}/leave`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to leave.');
      }

      setProjects((prev) => prev.filter((p) => p.id !== projectToLeave.id));
      setSelectedProject(null);

      toast.success(`You left "${projectToLeave.name}".`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleUpdateRoleDescription = async (memberId, description) => {
    try {
      const res = await fetch(
        `${API}/projects/${selectedProject.id}/members/${memberId}/role`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify({ role_description: description }),
        }
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update role description');
      }

      setProjectMembers((prev) =>
        prev.map((m) => m.id === memberId ? { ...m, role_description: description } : m)
      );
      toast.success('Role description updated!');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return {
    projectMembers,
    loadingMembers,
    handleAddMember,
    handleRemoveMember,
    handleTransferOwnership,
    handleProjectLeave,
    handleUpdateRoleDescription,
  };
}