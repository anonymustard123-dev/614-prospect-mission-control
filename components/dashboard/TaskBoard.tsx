'use client';

import { useState, useMemo } from 'react';
import { Task } from '@/types';
import { Plus, Check, X, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface TaskBoardProps {
  moduleId: string;
  tasks: Task[];
  loading: boolean;
  onTaskAdded: (task: Task) => void;
  onTaskUpdated: (task: Task) => void;
  onTaskDeleted: (taskId: string) => void;
  onTaskClick: (task: Task) => void;
}

export function TaskBoard({
  moduleId,
  tasks,
  loading,
  onTaskAdded,
  onTaskUpdated,
  onTaskDeleted,
  onTaskClick,
}: TaskBoardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    start_date: '',
    end_date: '',
  });

  // Filter out subtasks - only show top-level tasks
  const topLevelTasks = useMemo(() => {
    return tasks.filter((task) => !task.parent_id);
  }, [tasks]);

  const handleAdd = async () => {
    if (!formData.title || !formData.start_date || !formData.end_date) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          module_id: moduleId,
          title: formData.title,
          start_date: formData.start_date,
          end_date: formData.end_date,
          is_completed: false,
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        onTaskAdded(data);
        setFormData({ title: '', start_date: '', end_date: '' });
        setIsAdding(false);
      }
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };


  const handleDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
      onTaskDeleted(taskId);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({ is_completed: !task.is_completed })
        .eq('id', task.id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        onTaskUpdated(data);
      }
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setFormData({ title: '', start_date: '', end_date: '' });
  };

  const isOverdue = (endDate: string) => {
    return new Date(endDate) < new Date() && endDate !== '';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-zinc-950">
      {/* Task List */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-zinc-400">
            Loading tasks...
          </div>
        ) : (
          <div className="space-y-1">
            {/* Add Task Row */}
            {isAdding && (
              <div className="rounded-lg border border-white/10 bg-zinc-900/50 p-4">
                <input
                  type="text"
                  placeholder="Task name"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="mb-3 w-full rounded bg-zinc-800 px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <div className="mb-3 grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                    className="rounded bg-zinc-800 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                    className="rounded bg-zinc-800 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    <Check className="h-4 w-4" />
                    Add Task
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex items-center gap-2 rounded bg-zinc-800 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-700"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Add New Item Button */}
            {!isAdding && (
              <button
                onClick={() => setIsAdding(true)}
                className="flex w-full items-center gap-3 rounded-lg border border-dashed border-white/20 bg-zinc-900/30 px-4 py-3 text-left text-zinc-400 transition-colors hover:border-white/40 hover:bg-zinc-900/50 hover:text-zinc-200"
              >
                <Plus className="h-5 w-5" />
                <span className="font-medium">Add New Item</span>
              </button>
            )}

            {/* Task Rows */}
            {topLevelTasks.map((task) => (
              <div
                key={task.id}
                className={`group flex items-center gap-4 rounded-lg border border-white/10 bg-zinc-900/30 px-4 py-3 transition-all hover:bg-zinc-900/50 ${
                  task.is_completed ? 'opacity-60' : ''
                }`}
              >
                {/* Column 1: Checkbox */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleComplete(task);
                  }}
                  className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                    task.is_completed
                      ? 'border-green-500 bg-green-500 checkbox-checked'
                      : 'border-zinc-600 hover:border-zinc-400'
                  }`}
                >
                  {task.is_completed && (
                    <Check className="h-4 w-4 text-white" />
                  )}
                </button>

                {/* Column 2: Task Name - Clickable */}
                <div
                  onClick={() => onTaskClick(task)}
                  className={`flex-1 cursor-pointer transition-colors hover:text-blue-400 ${
                    task.is_completed
                      ? 'text-zinc-500 line-through'
                      : 'text-white'
                  }`}
                >
                  {task.title}
                </div>

                {/* Column 3: Due Date */}
                <div
                  className={`font-mono text-sm ${
                    isOverdue(task.end_date) && !task.is_completed
                      ? 'text-red-400'
                      : 'text-zinc-400'
                  }`}
                >
                  {formatDate(task.end_date)}
                </div>

                {/* Column 4: Assignee */}
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs text-zinc-300">
                  <User className="h-4 w-4" />
                </div>

                {/* Actions */}
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskClick(task);
                    }}
                    className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                    title="View details"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(task.id);
                    }}
                    className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-red-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            {topLevelTasks.length === 0 && !isAdding && (
              <div className="py-12 text-center text-zinc-500">
                No tasks yet. Click "Add New Item" to get started.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
