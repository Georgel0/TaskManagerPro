'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL;
const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

export function useComments(taskId) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  // Fetch Comments
  const { data: comments = [], isLoading: loading } = useQuery({
    queryKey: ['comments', taskId],
    queryFn: async () => {
      const res = await fetch(`${API}/comments/${taskId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to fetch comments');
      return res.json();
    },
    enabled: !!taskId,
  });

  // Create Comment
  const createMutation = useMutation({
    mutationFn: async (comment) => {
      const res = await fetch(`${API}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ task_id: taskId, comment }),
      });
      if (!res.ok) throw new Error('Failed to post comment');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
    },
    onError: (err) => toast.error(err.message),
  });

  // Edit Comment
  const editMutation = useMutation({
    mutationFn: async ({ id, text }) => {
      const res = await fetch(`${API}/comments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ comment: text }),
      });
      if (!res.ok) throw new Error('Failed to update comment');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
      cancelEdit();
    },
    onError: (err) => toast.error(err.message),
  });

  // Delete Comment
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`${API}/comments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to delete comment');
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
    },
    onError: (err) => toast.error(err.message),
  });

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
    editMutation.mutate({ id, text: editText });
  };

  const isSubmitting =
    createMutation.isPending || editMutation.isPending || deleteMutation.isPending;

  return {
    comments,
    loading,
    isSubmitting,
    editingId,
    editText,
    setEditText,
    createComment: createMutation.mutate,
    startEdit,
    cancelEdit,
    saveEdit,
    deleteComment: deleteMutation.mutate,
  };
}