'use client';
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL;
const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : null;

export function useReadme(projectId) {
  const queryClient = useQueryClient();
  const [isDirty, setIsDirty] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['readme', projectId],
    queryFn: async () => {
      const res = await fetch(`${API}/projects/${projectId}/readme`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to fetch README');
      return res.json();
    },
    enabled: !!projectId,
  });

  const saveMutation = useMutation({
    mutationFn: async (content) => {
      const res = await fetch(`${API}/projects/${projectId}/readme`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('Failed to save README');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readme', projectId] });
      setIsDirty(false);
      toast.success('README saved!');
    },
    onError: (err) => toast.error(err.message),
  });

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API}/projects/${projectId}/readme/files`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Upload failed');
      return json;
    },
    onSuccess: (newFile) => {
      queryClient.setQueryData(['readme', projectId], (prev) => ({
        ...prev,
        files: [newFile, ...(prev?.files ?? [])],
      }));
      toast.success('File uploaded!');
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (fileId) => {
      const res = await fetch(`${API}/projects/${projectId}/readme/files/${fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to delete file');
      return fileId;
    },
    onSuccess: (fileId) => {
      queryClient.setQueryData(['readme', projectId], (prev) => ({
        ...prev,
        files: (prev?.files ?? []).filter((f) => f.id !== fileId),
      }));
      toast.success('File removed.');
    },
    onError: (err) => toast.error(err.message),
  });

  const markDirty = useCallback(() => setIsDirty(true), []);

  return {
    content: data?.content ?? '',
    files: data?.files ?? [],
    updatedAt: data?.updated_at,
    updatedByName: data?.updated_by_name,
    isLoading,
    isDirty,
    markDirty,
    save: saveMutation.mutate,
    isSaving: saveMutation.isPending,
    uploadFile: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
    deleteFile: deleteMutation.mutate,
  };
}