'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL;
const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

export function useProjectMembers(selectedProject, setProjects) {
  const queryClient = useQueryClient();
  const projectId = selectedProject?.id;

  // Fetch Members
  const { data: projectMembers = [], isLoading: loadingMembers } = useQuery({
    queryKey: ['projects', projectId, 'members'],
    queryFn: async () => {
      const res = await fetch(`${API}/projects/${projectId}/members`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to fetch members');
      return res.json();
    },
    enabled: !!projectId,
  });

  // Add Member
  const addMemberMutation = useMutation({
    mutationFn: async (email) => {
      const res = await fetch(`${API}/projects/${projectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add member');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'members'] });
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, member_count: (p.member_count ?? 1) + 1 } : p
        )
      );
      toast.success(`${data.name} added to the project!`);
    },
    onError: (err) => toast.error(err.message),
  });

  // Remove Member
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId) => {
      const res = await fetch(`${API}/projects/${projectId}/members/${memberId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to remove member');
      return memberId;
    },
    onSuccess: (memberId) => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'members'] });
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? { ...p, member_count: Math.max((p.member_count ?? 1) - 1, 1) }
            : p
        )
      );
      toast.success('Member removed.');
    },
    onError: (err) => toast.error(err.message),
  });

  // Transfer Ownership
  const transferMutation = useMutation({
    mutationFn: async ({ memberId }) => {
      const res = await fetch(`${API}/projects/${projectId}/members/${memberId}/transfer`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to transfer ownership.');
      return memberId;
    },
    // Handle setSelectedProject inside the wrapper to keep the signature same
    onError: (err) => toast.error(err.message),
  });

  // Leave Project
  const leaveMutation = useMutation({
    mutationFn: async (projectToLeave) => {
      const res = await fetch(`${API}/projects/${projectToLeave.id}/leave`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to leave.');
      }
      return projectToLeave;
    },
    onSuccess: (projectToLeave) => {
      setProjects((prev) => prev.filter((p) => p.id !== projectToLeave.id));
      toast.success(`You left "${projectToLeave.name}".`);
    },
    onError: (err) => toast.error(err.message),
  });

  // Update Role Description 
  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, description }) => {
      const res = await fetch(`${API}/projects/${projectId}/members/${memberId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ role_description: description }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update role description');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'members'] });
      toast.success('Role description updated!');
    },
    onError: (err) => toast.error(err.message),
  });

  const handleAddMember = (email) => addMemberMutation.mutate(email);

  const handleRemoveMember = (memberId) => removeMemberMutation.mutate(memberId);

  const handleTransferOwnership = async (memberId, setSelectedProject) => {
    transferMutation.mutate({ memberId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'members'] });
        setProjects((prev) =>
          prev.map((p) => (p.id === projectId ? { ...p, owner_id: memberId } : p))
        );
        setSelectedProject((prev) => ({ ...prev, owner_id: memberId }));
        toast.success('Ownership transferred successfully.');
      }
    });
  };

  const handleProjectLeave = (projectToLeave, setSelectedProject) => {
    leaveMutation.mutate(projectToLeave, {
      onSuccess: () => {
        setSelectedProject(null);
      }
    });
  };

  const handleUpdateRoleDescription = (memberId, description) => 
    updateRoleMutation.mutate({ memberId, description });

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