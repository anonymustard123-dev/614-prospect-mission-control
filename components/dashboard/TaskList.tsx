'use client';

import { useState } from 'react';
import { Task } from '@/types';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface TaskListProps {
  moduleId: string;
  tasks: Task[];
  loading: boolean;
  onTaskAdded: (task: Task) => void;
  onTaskUpdated: (task: Task) => void;
  onTaskDeleted: (taskId: string) => void;
}

export function TaskList({
  moduleId,
  tasks,
  loading,
  onTaskAdded,
  onTaskUpdated,
  onTaskDeleted,
}: TaskListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    start_date: '',
    end_date: '',
  });

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

  const handleUpdate = async (taskId: string) => {
    try {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      const { data, error } = await supabase
        .from('tasks')
        .update({
          title: formData.title,
          start_date: formData.start_date,
          end_date: formData.end_date,
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        onTaskUpdated(data);
        setEditingId(null);
        setFormData({ title: '', start_date: '', end_date: '' });
      }
    } catch (error) {
      console.error('Error updating task:', error);
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

  const startEdit = (task: Task) => {
    setEditingId(task.id);
    setFormData({
      title: task.title,
      start_date: task.start_date,
      end_date: task.end_date,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({ title: '', start_date: '', end_date: '' });
  };

  return (
    <div className="flex h-full flex-col bg-zinc-900">
      {/* Header */}
      <div className="border-b border-zinc-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-100">Tasks</h3>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Task
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-zinc-400">
            Loading tasks...
          </div>
        ) : tasks.length === 0 && !isAdding ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-zinc-400">No tasks yet</p>
            <button
              onClick={() => setIsAdding(true)}
              className="mt-4 text-blue-400 hover:text-blue-300"
            >
              Add your first task
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Add Task Form */}
            {isAdding && (
              <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-4">
                <input
                  type="text"
                  placeholder="Task title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="mb-3 w-full rounded bg-zinc-700 px-3 py-2 text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="mb-3 grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                    className="rounded bg-zinc-700 px-3 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                    className="rounded bg-zinc-700 px-3 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAdd}
                    className="flex flex-1 items-center justify-center gap-2 rounded bg-blue-600 px-3 py-2 text-sm text-white transition-colors hover:bg-blue-700"
                  >
                    <Check className="h-4 w-4" />
                    Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex items-center justify-center gap-2 rounded bg-zinc-700 px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-600"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Task Items */}
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`rounded-lg border p-4 transition-colors ${
                  task.is_completed
                    ? 'border-green-700/50 bg-zinc-800/50'
                    : 'border-zinc-700 bg-zinc-800'
                }`}
              >
                {editingId === task.id ? (
                  <div>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className="mb-3 w-full rounded bg-zinc-700 px-3 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="mb-3 grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            start_date: e.target.value,
                          })
                        }
                        className="rounded bg-zinc-700 px-3 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            end_date: e.target.value,
                          })
                        }
                        className="rounded bg-zinc-700 px-3 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(task.id)}
                        className="flex flex-1 items-center justify-center gap-2 rounded bg-blue-600 px-3 py-2 text-sm text-white transition-colors hover:bg-blue-700"
                      >
                        <Check className="h-4 w-4" />
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex items-center justify-center gap-2 rounded bg-zinc-700 px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-600"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleComplete(task)}
                            className={`mt-0.5 h-5 w-5 rounded border-2 transition-colors ${
                              task.is_completed
                                ? 'border-green-500 bg-green-500'
                                : 'border-zinc-500'
                            }`}
                          >
                            {task.is_completed && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </button>
                          <h4
                            className={`font-medium ${
                              task.is_completed
                                ? 'text-zinc-500 line-through'
                                : 'text-zinc-100'
                            }`}
                          >
                            {task.title}
                          </h4>
                        </div>
                        <p className="ml-7 mt-1 text-sm text-zinc-400">
                          {new Date(task.start_date).toLocaleDateString()} -{' '}
                          {new Date(task.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(task)}
                          className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-100"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
