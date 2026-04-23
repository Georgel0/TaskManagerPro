import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApp } from '@/context';
import { validate, createTaskSchema } from '@/lib/validators';

export function useDashboard() {
  const { user } = useApp();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', status: 'To Do', priority: 'Medium', deadline: '', project_id: ''
  });
  const [fieldErrors, setFieldErrors] = useState({});

  const API = process.env.NEXT_PUBLIC_API_URL;

  // Fetch Dashboard Data
  const { data, isPending: loading, error } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        throw new Error('Unauthorized');
      }

      const [dashRes, projectsRes] = await Promise.all([
        fetch(`${API}/dashboard`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/projects`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (!dashRes.ok || !projectsRes.ok) throw new Error('Failed to fetch data');

      return {
        dashboard: await dashRes.json(),
        projects: await projectsRes.json(),
      };
    },
  });

  // Create Quick Task
  const createTaskMutation = useMutation({
    mutationFn: async (payload) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...payload, assigned_user_id: user.id }),
      });

      if (!response.ok) throw new Error('Failed to create task');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Task created successfully!');
      setIsModalOpen(false);
      setFormData({ title: '', description: '', status: 'To Do', priority: 'Medium', deadline: '', project_id: '' });
      
      // Automatically refetch the dashboard data so the UI updates
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleCreateTask = async (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      project_id: formData.project_id ? Number(formData.project_id) : undefined,
      deadline: formData.deadline || null,
    };

    const errors = validate(createTaskSchema, payload);
    if (errors) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    createTaskMutation.mutate(payload);
  };

  return {
    user,
    dashboardData: data?.dashboard || null,
    projects: data?.projects || [],
    loading,
    error: error?.message || null,
    
    isModalOpen,
    setIsModalOpen,
    isSubmitting: createTaskMutation.isPending, 
    formData,
    setFormData,
    fieldErrors,
    setFieldErrors,
    handleCreateTask,
  };
}