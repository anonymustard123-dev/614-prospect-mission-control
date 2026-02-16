'use client';

import { useState, useEffect } from 'react';
import { Task } from '@/types';
import { X, Plus, Check, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface TaskDetailDrawerProps {
  task: Task;
  moduleId: string;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated: (task: Task) => void;
  onSubtaskAdded: (subtask: Task) => void;
  onSubtaskUpdated: (subtask: Task) => void;
  onSubtaskDeleted: (subtaskId: string) => void;
}

export function TaskDetailDrawer({
  task,
  moduleId,
  isOpen,
  onClose,
  onTaskUpdated,
  onSubtaskAdded,
  onSubtaskUpdated,
  onSubtaskDeleted,
}: TaskDetailDrawerProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [startDate, setStartDate] = useState(task.start_date);
  const [endDate, setEndDate] = useState(task.end_date);
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStartDate(task.start_date);
      setEndDate(task.end_date);
      loadSubtasks();
    }
  }, [task, isOpen]);

  useEffect(() => {
    if (isOpen) {
      const channel = supabase
        .channel(`subtasks-${task.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tasks',
            filter: `parent_id=eq.${task.id}`,
          },
          () => {
            loadSubtasks();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [task.id, isOpen]);

  const loadSubtasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('parent_id', task.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setSubtasks(data || []);
    } catch (error) {
      console.error('Error loading subtasks:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          title,
          description: description || null,
          start_date: startDate,
          end_date: endDate,
        })
        .eq('id', task.id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        onTaskUpdated(data);
      }
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          module_id,
          parent_id: task.id,
          title: newSubtaskTitle,
          start_date: startDate,
          end_date: endDate,
          is_completed: false,
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        onSubtaskAdded(data);
        setSubtasks((prev) => [...prev, data]);
        setNewSubtaskTitle('');
      }
    } catch (error) {
      console.error('Error adding subtask:', error);
    }
  };

  const handleToggleSubtask = async (subtask: Task) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({ is_completed: !subtask.is_completed })
        .eq('id', subtask.id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        onSubtaskUpdated(data);
        setSubtasks((prev) =>
          prev.map((t) => (t.id === subtask.id ? data : t))
        );
      }
    } catch (error) {
      console.error('Error toggling subtask:', error);
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!confirm('Delete this subtask?')) return;

    try {
      const { error } = await supabase.from('tasks').delete().eq('id', subtaskId);
      if (error) throw error;
      onSubtaskDeleted(subtaskId);
      setSubtasks((prev) => prev.filter((t) => t.id !== subtaskId));
    } catch (error) {
      console.error('Error deleting subtask:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 z-[120] h-full w-[500px] transform border-l border-white/10 bg-zinc-950/95 backdrop-blur-2xl shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b border-white/10 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Task Details</h3>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {/* Title */}
            <div className="mb-6">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSave}
                className="w-full rounded-lg border border-white/10 bg-zinc-900/50 px-4 py-3 text-xl font-semibold text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Task title"
              />
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleSave}
                rows={6}
                className="w-full rounded-lg border border-white/10 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Add detailed notes, requirements, or context..."
              />
            </div>

            {/* Dates */}
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Start Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    onBlur={handleSave}
                    className="w-full rounded-lg border border-white/10 bg-zinc-900/50 px-4 py-2 pl-10 font-mono text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  End Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    onBlur={handleSave}
                    className="w-full rounded-lg border border-white/10 bg-zinc-900/50 px-4 py-2 pl-10 font-mono text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Subtasks Section */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Subtasks ({subtasks.length})
                </label>
              </div>

              {/* Add Subtask */}
              <div className="mb-4 flex gap-2">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddSubtask();
                    }
                  }}
                  placeholder="Add subtask..."
                  className="flex-1 rounded-lg border border-white/10 bg-zinc-900/50 px-4 py-2 text-sm text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  onClick={handleAddSubtask}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>

              {/* Subtasks List */}
              <div className="space-y-2">
                {subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className={`flex items-center gap-3 rounded-lg border border-white/10 bg-zinc-900/30 px-4 py-3 transition-colors ${
                      subtask.is_completed ? 'opacity-60' : ''
                    }`}
                  >
                    <button
                      onClick={() => handleToggleSubtask(subtask)}
                      className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-all ${
                        subtask.is_completed
                          ? 'border-green-500 bg-green-500'
                          : 'border-zinc-600 hover:border-zinc-400'
                      }`}
                    >
                      {subtask.is_completed && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </button>
                    <span
                      className={`flex-1 text-sm ${
                        subtask.is_completed
                          ? 'text-zinc-500 line-through'
                          : 'text-zinc-100'
                      }`}
                    >
                      {subtask.title}
                    </span>
                    <button
                      onClick={() => handleDeleteSubtask(subtask.id)}
                      className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-red-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                {subtasks.length === 0 && (
                  <div className="py-8 text-center text-sm text-zinc-500">
                    No subtasks yet. Add one above.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-white/10 px-6 py-4">
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
