import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useApp } from '@/context';
import { validate, createTaskSchema } from '@/lib/validators';

export function useDashboard() {
  const { user } = useApp();
  const router = useRouter();

  const [dashboardData, setDashboardData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', status: 'To Do', priority: 'Medium', deadline: '', project_id: ''
  });
  const [fieldErrors, setFieldErrors] = useState({});

  const API = process.env.NEXT_PUBLIC_API_URL;

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    try {
      const [dashRes, projectsRes] = await Promise.all([
        fetch(`${API}/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API}/projects`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
      ]);

      if (!dashRes.ok || !projectsRes.ok) throw new Error('Failed to fetch data');

      const dashData = await dashRes.json();
      const projectsData = await projectsRes.json();

      setDashboardData(dashData);
      setProjects(projectsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
    setIsSubmitting(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...payload, assigned_user_id: user.id }),
      });

      if (!response.ok) throw new Error('Failed to create task');

      toast.success('Task created successfully!');
      setIsModalOpen(false);
      setFormData({ title: '', description: '', status: 'To Do', priority: 'Medium', deadline: '', project_id: '' });
      fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    user,
    dashboardData,
    projects,
    loading,
    error,
    isModalOpen,
    setIsModalOpen,
    isSubmitting,
    formData,
    setFormData,
    fieldErrors,
    setFieldErrors,
    handleCreateTask
  };
}