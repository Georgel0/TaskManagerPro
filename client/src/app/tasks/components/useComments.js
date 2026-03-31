'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL;
const getToken = () => localStorage.getItem('token');

export function useComments(taskId) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    if (!taskId) return;
    fetchComments();
  }, [taskId]);

  const fetchComments = async () => {
    setLoading(true);

    try {
      const res = await fetch(`${API}/comments/${taskId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      if (!res.ok) throw new Error('Failed to fetch comments');
      
      setComments(await res.json());
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createComment = async (comment) => {
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ task_id: taskId, comment }),
      });

      if (!res.ok) throw new Error('Failed to post comment');
      
      const newComment = await res.json();
      
      setComments((prev) => [...prev, newComment]);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (comment) => {
    setEditingId(comment.id);
    setEditText(comment.comment);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const saveEdit = async (id) => {
    if (!editText.trim()) return;
    setIsSubmitting(true);
    
    try {
      const res = await fetch(`${API}/comments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ comment: editText }),
      });
      
      if (!res.ok) throw new Error('Failed to update comment');
      
      const updated = await res.json();
      
      setComments((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      cancelEdit();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteComment = async (id) => {
    try {
      const res = await fetch(`${API}/comments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      
      if (!res.ok) throw new Error('Failed to delete comment');
      
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      toast.error(err.message);
    }
  };

  return {
    comments,
    loading,
    isSubmitting,
    editingId,
    editText,
    setEditText,
    createComment,
    startEdit,
    cancelEdit,
    saveEdit,
    deleteComment,
  };
}