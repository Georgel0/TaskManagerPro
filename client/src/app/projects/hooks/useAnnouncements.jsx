'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL;
const getToken = () => localStorage.getItem('token');

export function useAnnouncements(projectId) {
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

        setAnnouncements(await res.json());
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

      toast.success('Broadcast posted!');
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
            ack_count: acknowledged ? a.ack_count + 1 : a.ack_count - 1
          };
        }
        return a;
      }));
    } catch (err) {
      toast.error(err.message);
    }
  };

  return {
    announcements,
    loadingAnnouncements: loading,
    handleCreateAnnouncement,
    handleAcknowledge
  };
}