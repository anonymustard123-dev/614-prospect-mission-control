'use client';

import { Task } from '@/types';
import { CustomRoadmap } from './CustomRoadmap';

interface TimelineTabProps {
  tasks: Task[];
  loading: boolean;
  onTaskClick?: (task: Task) => void;
}

export function TimelineTab({
  tasks,
  loading,
  onTaskClick,
}: TimelineTabProps) {
  return (
    <CustomRoadmap
      tasks={tasks}
      loading={loading}
      onTaskClick={onTaskClick}
    />
  );
}
