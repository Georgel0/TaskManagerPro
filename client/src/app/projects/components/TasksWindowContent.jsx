'use client';
import { useQuery } from '@tanstack/react-query';
import { TasksModal } from './Modals';

const API = process.env.NEXT_PUBLIC_API_URL;
const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

export function TasksWindowContent({ project, onClose }) {
	const { data: tasks = [], isFetching: loading } = useQuery({
		queryKey: ['projects', project.id, 'tasks'],
		queryFn: async () => {
			const res = await fetch(`${API}/tasks?project_id=${project.id}`, {
				headers: { Authorization: `Bearer ${getToken()}` },
			});
			if (!res.ok) throw new Error('Failed to fetch tasks');
			return res.json();
		},
		enabled: !!project.id,
	});

	return <TasksModal project={project} tasks={tasks} loading={loading} onClose={onClose} />;
}