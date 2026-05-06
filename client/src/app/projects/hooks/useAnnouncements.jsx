'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL;
const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

const sortAnnouncements = (list) =>
  [...list].sort((a, b) => b.is_pinned - a.is_pinned || new Date(b.created_at) - new Date(a.created_at));

export function useAnnouncements(projectId, onAnnouncementCreated, onAnnouncementDeleted) {
  const queryClient = useQueryClient();

  // Fetch Announcements
  const { data: announcements = [], isLoading: loadingAnnouncements } = useQuery({
    queryKey: ['projects', projectId, 'announcements'],
    queryFn: async () => {
      const res = await fetch(`${API}/projects/${projectId}/announcements`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to fetch broadcasts');
      const data = await res.json();
      return sortAnnouncements(data);
    },
    enabled: !!projectId,
  });

  // Create Announcement
  const createMutation = useMutation({
    mutationFn: async (formData) => {
      const res = await fetch(`${API}/projects/${projectId}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed to post broadcast');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'announcements'] });
      toast.success('Broadcast posted!');
      onAnnouncementCreated?.();
    },
    onError: (err) => toast.error(err.message),
  });

  // Acknowledge Announcement
  const acknowledgeMutation = useMutation({
    mutationFn: async (announcementId) => {
      const res = await fetch(`${API}/projects/${projectId}/announcements/${announcementId}/acknowledge`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to update acknowledgment');
      return res.json();
    },
    onSuccess: ({ acknowledged }, announcementId) => {
      queryClient.setQueryData(
        ['projects', projectId, 'announcements'],
        (prev = []) => prev.map((a) =>
          a.id === announcementId
            ? { ...a, is_acknowledged: acknowledged, ack_count: acknowledged ? a.ack_count + 1 : Math.max(0, a.ack_count - 1) }
            : a
        )
      );
    },
    onError: (err) => toast.error(err.message),
  });

  // Delete Announcement
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`${API}/projects/${projectId}/announcements/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error('Failed to delete on the server');
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'announcements'] });
      onAnnouncementDeleted?.();
      toast.success('Announcement deleted');
    },
    onError: () => toast.error('Could not delete Announcement.'),
  });

  const handleCreateAnnouncement = async (formData) => {
    try {
      await createMutation.mutateAsync(formData);
      return true;
    } catch {
      return false;
    }
  };

  const handleAcknowledge = (announcementId) => {
    acknowledgeMutation.mutate(announcementId);
  };

  const deleteAnnouncement = (id) => {
    deleteMutation.mutate(id);
  };

  return {
    announcements,
    loadingAnnouncements,
    handleCreateAnnouncement,
    handleAcknowledge,
    deleteAnnouncement,
  };
}