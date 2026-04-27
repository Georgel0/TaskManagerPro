import { Suspense } from 'react';
import Tasks from './Tasks';

export default function TasksPage() {
  return (
    <Suspense fallback={<div>Loading your tasks...</div>}>
      <Tasks />
    </Suspense>
  );
}