'use client';

import { useMemo } from 'react';
import { Task } from '@/types';
import { Gantt, Task as GanttTask, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';

interface GanttChartProps {
  tasks: Task[];
  loading: boolean;
}

export function GanttChart({ tasks, loading }: GanttChartProps) {
  const ganttTasks: GanttTask[] = useMemo(() => {
    return tasks.map((task) => {
      const startDate = new Date(task.start_date);
      const endDate = new Date(task.end_date);
      
      // Ensure dates are valid
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return null;
      }

      return {
        start: startDate,
        end: endDate,
        name: task.title,
        id: task.id,
        type: 'task',
        progress: task.is_completed ? 100 : 0,
        styles: {
          progressColor: task.is_completed ? '#10b981' : '#3b82f6',
          progressSelectedColor: task.is_completed ? '#059669' : '#2563eb',
          backgroundColor: task.is_completed ? '#065f46' : '#1e3a8a',
          backgroundSelectedColor: task.is_completed ? '#047857' : '#1e40af',
        },
      };
    }).filter((task): task is GanttTask => task !== null);
  }, [tasks]);

  const minDate = useMemo(() => {
    if (tasks.length === 0) return new Date();
    return new Date(
      Math.min(...tasks.map((t) => new Date(t.start_date).getTime()))
    );
  }, [tasks]);

  const maxDate = useMemo(() => {
    if (tasks.length === 0) return new Date();
    return new Date(
      Math.max(...tasks.map((t) => new Date(t.end_date).getTime()))
    );
  }, [tasks]);

  return (
    <div className="flex h-full flex-col bg-zinc-900">
      {/* Header */}
      <div className="border-b border-zinc-700 px-6 py-4">
        <h3 className="text-lg font-semibold text-zinc-100">Gantt Chart</h3>
      </div>

      {/* Chart */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-zinc-400">
            Loading chart...
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-zinc-400">No tasks to display</p>
            <p className="mt-2 text-sm text-zinc-500">
              Add tasks to see them on the Gantt chart
            </p>
          </div>
        ) : (
          <div className="gantt-container" style={{ height: '100%' }}>
            <Gantt
              tasks={ganttTasks}
              viewMode={ViewMode.Day}
              locale="en-US"
              listCellWidth="200px"
              columnWidth={60}
              preStepsCount={1}
              rtl={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}
