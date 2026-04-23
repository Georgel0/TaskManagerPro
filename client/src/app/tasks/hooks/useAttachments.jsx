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

export function useAttachments(taskId, onAttachmentCountChange) {
  const queryClient = useQueryClient();

  // Fetch Attachments
  const { data: attachments = [], isLoading: loading } = useQuery({
    queryKey: ['attachments', taskId],
    queryFn: async () => {
      const res = await fetch(`${API}/tasks/${taskId}/attachments`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to fetch attachments');
      return res.json();
    },
    enabled: !!taskId,
  });

  // Upload Attachment
  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API}/tasks/${taskId}/attachments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      return data;
    },
    onSuccess: (newAttachment) => {
      queryClient.setQueryData(['attachments', taskId], (prev = []) => [newAttachment, ...prev]);
      onAttachmentCountChange?.(1);
      toast.success('File uploaded!');
    },
    onError: (err) => toast.error(err.message),
  });

  // Delete Attachment
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`${API}/attachments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to delete attachment');
      return id;
    },
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData(['attachments', taskId], (prev = []) =>
        prev.filter((a) => a.id !== deletedId)
      );
      onAttachmentCountChange?.(-1);
      toast.success('Attachment removed.');
      return id;
    },
    onError: (err) => toast.error(err.message),
  });

  return {
    attachments,
    loading,
    isUploading: uploadMutation.isPending,
    uploadAttachment: uploadMutation.mutate,
    deleteAttachment: deleteMutation.mutate,
  };
}