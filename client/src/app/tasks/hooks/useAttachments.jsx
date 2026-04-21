'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL;
const getToken = () => localStorage.getItem('token');

export function useAttachments(taskId) {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!taskId) return;

    const fetchAttachments = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/tasks/${taskId}/attachments`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (!res.ok) throw new Error('Failed to fetch attachments');
        setAttachments(await res.json());
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAttachments();
  }, [taskId]);

  const uploadAttachment = async (file) => {
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API}/tasks/${taskId}/attachments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
        // No Content-Type header — let browser set it with the boundary
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setAttachments((prev) => [data, ...prev]);
      toast.success('File uploaded!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const deleteAttachment = async (id) => {
    try {
      const res = await fetch(`${API}/attachments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to delete attachment');

      setAttachments((prev) => prev.filter((a) => a.id !== id));
      toast.success('Attachment removed.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return { attachments, loading, isUploading, uploadAttachment, deleteAttachment };
}