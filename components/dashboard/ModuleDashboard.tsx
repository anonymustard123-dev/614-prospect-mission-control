'use client';

import { useState, useEffect } from 'react';
import { Module, Task } from '@/types';
import { X, List, Calendar } from 'lucide-react';
import { TaskBoard } from './TaskBoard';
import { TimelineTab } from './TimelineTab';
import { TaskDetailDrawer } from './TaskDetailDrawer';
import { supabase } from '@/lib/supabase';

interface ModuleDashboardProps {
  module: Module;
  onClose: () => void;
}

export function ModuleDashboard({ module, onClose }: ModuleDashboardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'board' | 'timeline'>('board');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    loadTasks();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`tasks-${module.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `module_id=eq.${module.id}`,
        },
        () => {
          loadTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [module.id]);

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('module_id', module.id)
        .order('start_date', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskAdded = (task: Task) => {
    setTasks((prev) => [...prev, task]);
  };

  const handleTaskUpdated = (updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
  };

  const handleTaskDeleted = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (selectedTask?.id === taskId) {
      setIsDrawerOpen(false);
      setSelectedTask(null);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setSelectedTask(null);
  };

  const handleSubtaskAdded = (subtask: Task) => {
    setTasks((prev) => [...prev, subtask]);
  };

  const handleSubtaskUpdated = (subtask: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === subtask.id ? subtask : t))
    );
  };

  const handleSubtaskDeleted = (subtaskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== subtaskId));
  };

  // Filter out subtasks for progress calculation
  const topLevelTasks = tasks.filter((t) => !t.parent_id);
  const completedCount = topLevelTasks.filter((t) => t.is_completed).length;
  const totalCount = topLevelTasks.length;
  const progressPercentage =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative h-[85vh] w-[85vw] rounded-lg border border-white/10 bg-zinc-950/90 backdrop-blur-2xl shadow-2xl">
        {/* Header */}
        <div className="border-b border-white/10 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-3xl font-bold tracking-tight text-white">
                {module.name.toUpperCase()}
              </h2>
              <div className="mt-4">
                {/* Progress Bar */}
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-mono text-zinc-400">
                    {completedCount}/{totalCount} Tasks Completed
                  </span>
                  <span className="font-mono text-zinc-400">
                    {progressPercentage}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="ml-6 rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-100"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-white/10 px-8">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('board')}
              className={`flex items-center gap-2 border-b-2 px-4 py-4 transition-colors ${
                activeTab === 'board'
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <List className="h-4 w-4" />
              <span className="font-semibold">TASK BOARD</span>
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center gap-2 border-b-2 px-4 py-4 transition-colors ${
                activeTab === 'timeline'
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span className="font-semibold">TIMELINE</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="h-[calc(85vh-180px)] overflow-hidden">
          {activeTab === 'board' ? (
            <TaskBoard
              moduleId={module.id}
              tasks={tasks}
              loading={loading}
              onTaskAdded={handleTaskAdded}
              onTaskUpdated={handleTaskUpdated}
              onTaskDeleted={handleTaskDeleted}
              onTaskClick={handleTaskClick}
            />
          ) : (
            <TimelineTab
              tasks={tasks}
              loading={loading}
              onTaskClick={handleTaskClick}
            />
          )}
        </div>
      </div>

      {/* Task Detail Drawer */}
      {selectedTask && (
        <TaskDetailDrawer
          task={selectedTask}
          moduleId={module.id}
          isOpen={isDrawerOpen}
          onClose={handleDrawerClose}
          onTaskUpdated={handleTaskUpdated}
          onSubtaskAdded={handleSubtaskAdded}
          onSubtaskUpdated={handleSubtaskUpdated}
          onSubtaskDeleted={handleSubtaskDeleted}
        />
      )}
    </div>
  );
}
