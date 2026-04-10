'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL;
const getToken = () => localStorage.getItem('token');

const sortAnnouncements = (list) =>
  [...list].sort((a, b) => b.is_pinned - a.is_pinned || new Date(b.created_at) - new Date(a.created_at));

export function useAnnouncements(projectId, onAnnouncementCreated) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    const fetchAnnouncements = async () => {
      setLoading(true);

      try {
        const res = await fetch(`${API}/projects/${projectId}/announcements`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });

        if (!res.ok) throw new Error('Failed to fetch broadcasts');

        setAnnouncements(sortAnnouncements(await res.json()));
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, [projectId]);

  const handleCreateAnnouncement = async (formData) => {
    try {
      const res = await fetch(`${API}/projects/${projectId}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to post broadcast');

      // Refetch to get joined data (author_name, ack_count, total_members)
      const fetchRes = await fetch(`${API}/projects/${projectId}/announcements`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (fetchRes.ok) {
        const data = await fetchRes.json();
        setAnnouncements(sortAnnouncements(data));
      }

      toast.success('Broadcast posted!');
      onAnnouncementCreated?.();
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    }
  };

  const handleAcknowledge = async (announcementId) => {
    try {
      const res = await fetch(`${API}/projects/${projectId}/announcements/${announcementId}/acknowledge`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to update acknowledgment');

      const { acknowledged } = await res.json();

      setAnnouncements((prev) => prev.map((a) => {
        if (a.id === announcementId) {
          return {
            ...a,
            is_acknowledged: acknowledged,
            ack_count: acknowledged ? a.ack_count + 1 : Math.max(0, a.ack_count - 1)
          };
        }
        return a;
      }));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const deleteAnnouncement = async (id) => {
    try {
      const res = await fetch(`${API}/projects/${projectId}/announcements/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` }
      });

      if (!res.ok) throw new Error('Failed to delete on the server');

      setAnnouncements(prev => prev.filter(n => n.id !== id));
      toast.success('Announcement deleted');
    } catch (err) {
      toast.error('Could not delete Announcement.');
      console.error(err);
    }
  };

  return {
    announcements,
    loadingAnnouncements: loading,
    handleCreateAnnouncement,
    handleAcknowledge,
    deleteAnnouncement
  };
}