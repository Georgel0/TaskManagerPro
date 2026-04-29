import { Suspense } from 'react';
import Tasks, { TasksSkeleton } from './Tasks';

export default function TasksPage() {
  return (
    <Suspense fallback={ <TasksSkeleton /> }>
      <Tasks />
    </Suspense>
  );
}