'use client';

import { useEffect, useState } from 'react';
import { Module, ModuleType, Task } from '@/types';
import { supabase } from '@/lib/supabase';
import {
  Droplet,
  Wifi,
  Zap,
  MapPin,
  Package,
  Box,
  Anchor,
  Wrench,
  User,
  Plus,
  Trash2,
  Pencil,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { AddModuleDialog } from './AddModuleDialog';
import { EditModuleDialog } from './EditModuleDialog';

interface SidebarProps {
  onModuleClick: (module: Module) => void;
  /** Mobile drawer: when true, sidebar is shown as overlay (used on small screens) */
  isMobileOpen?: boolean;
  /** Called when user closes the mobile drawer (backdrop or after selecting a module) */
  onMobileClose?: () => void;
}

interface ModuleWithTasks extends Module {
  tasks: Task[];
  computedStatus: 'completed' | 'in_progress' | 'no_tasks';
}

// Icon mapping for dynamic icons
const iconMap: Record<string, typeof Droplet> = {
  droplet: Droplet,
  zap: Zap,
  wifi: Wifi,
  mappin: MapPin,
  box: Box,
  anchor: Anchor,
  wrench: Wrench,
  user: User,
  // Fallback to type-based icons
  water: Droplet,
  fiber: Wifi,
  power: Zap,
  land: MapPin,
  misc: Package,
};

// Type-based icons (fallback)
const typeIcons: Record<ModuleType, typeof Droplet> = {
  Water: Droplet,
  Fiber: Wifi,
  Power: Zap,
  Land: MapPin,
  Misc: Package,
};

const computedStatusColors = {
  completed: 'bg-green-500',
  in_progress: 'bg-blue-500',
  no_tasks: 'bg-yellow-500',
};

const computedStatusIcons = {
  completed: CheckCircle2,
  in_progress: Clock,
  no_tasks: AlertCircle,
};

export function Sidebar({
  onModuleClick,
  isMobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const handleModuleClick = (module: Module) => {
    onModuleClick(module);
    onMobileClose?.();
  };
  const [modulesWithTasks, setModulesWithTasks] = useState<ModuleWithTasks[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [drawerAnimatingIn, setDrawerAnimatingIn] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setCurrentTime(new Date());
  }, []);

  useEffect(() => {
    if (isMobileOpen) {
      setDrawerAnimatingIn(true);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setDrawerAnimatingIn(false));
      });
      return () => cancelAnimationFrame(id);
    }
  }, [isMobileOpen]);

  useEffect(() => {
    loadModulesAndTasks();

    if (!isMounted) return;

    // Update clock every second
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Subscribe to real-time updates for both modules and tasks
    const modulesChannel = supabase
      .channel('modules-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'modules',
        },
        () => {
          loadModulesAndTasks();
        }
      )
      .subscribe();

    const tasksChannel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
        },
        () => {
          loadModulesAndTasks();
        }
      )
      .subscribe();

    return () => {
      if (clockInterval) clearInterval(clockInterval);
      supabase.removeChannel(modulesChannel);
      supabase.removeChannel(tasksChannel);
    };
  }, [isMounted]);

  const calculateComputedStatus = (
    tasks: Task[]
  ): 'completed' | 'in_progress' | 'no_tasks' => {
    // Safety check: ensure tasks is an array
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return 'no_tasks'; // 0 tasks = Yellow Exclamation
    }

    const allCompleted = tasks.every((task) => task.is_completed);
    return allCompleted ? 'completed' : 'in_progress';
  };

  const loadModulesAndTasks = async () => {
    try {
      // Load modules
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select('*')
        .order('created_at', { ascending: true });

      if (modulesError) throw modulesError;

      // Load all tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*');

      if (tasksError) throw tasksError;

      // Group tasks by module_id
      const tasksByModule = (tasksData || []).reduce(
        (acc, task) => {
          if (!acc[task.module_id]) {
            acc[task.module_id] = [];
          }
          acc[task.module_id].push(task);
          return acc;
        },
        {} as Record<string, Task[]>
      );

      // Combine modules with their tasks and compute status
      const modulesWithTasksData: ModuleWithTasks[] = (modulesData || []).map(
        (module) => ({
          ...module,
          tasks: tasksByModule[module.id] || [],
          computedStatus: calculateComputedStatus(tasksByModule[module.id] || []),
        })
      );

      setModulesWithTasks(modulesWithTasksData);
    } catch (error) {
      console.error('Error loading modules and tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatESTTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      timeZone: 'America/New_York',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + ' EST';
  };

  const handleDeleteModule = async (moduleId: string, moduleName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${moduleName}"? This will also delete all associated tasks.`
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase.from('modules').delete().eq('id', moduleId);
      if (error) throw error;
      // Reload modules (tasks will be cascade deleted)
      loadModulesAndTasks();
    } catch (error) {
      console.error('Error deleting module:', error);
      alert('Failed to delete module. Please try again.');
    }
  };

  const activeModules = loading
    ? 0
    : modulesWithTasks.filter((m) => m.computedStatus === 'in_progress').length;
  const avgLat =
    loading || modulesWithTasks.length === 0
      ? '40.7300'
      : (
          modulesWithTasks.reduce((sum, m) => sum + m.lat, 0) /
          modulesWithTasks.length
        ).toFixed(4);

  const sidebarContent = (
    <div className="flex h-full w-80 flex-col border-r border-white/10 bg-black/40 backdrop-blur-xl">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-5">
        <h1 className="text-xl font-bold tracking-wider text-white">
          PROJECT 614 PROSPECT ROAD
        </h1>
        <div className="mt-2 font-mono text-sm text-zinc-400">
          {isMounted && currentTime ? formatESTTime(currentTime) : 'Loading...'}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 border-b border-white/10 px-4 py-4">
        <div className="rounded border border-white/10 bg-black/30 px-3 py-2 backdrop-blur-sm">
          <div className="text-xs text-zinc-500">MODULES</div>
          <div className="mt-1 font-mono text-lg font-semibold text-white">
            {loading ? '--' : modulesWithTasks.length}
          </div>
        </div>
        <div className="rounded border border-white/10 bg-black/30 px-3 py-2 backdrop-blur-sm">
          <div className="text-xs text-zinc-500">STATUS</div>
          <div className="mt-1 font-mono text-sm font-semibold text-green-400">
            ACTIVE
          </div>
        </div>
        <div className="rounded border border-white/10 bg-black/30 px-3 py-2 backdrop-blur-sm">
          <div className="text-xs text-zinc-500">LAT</div>
          <div className="mt-1 font-mono text-sm font-semibold text-white">
            {avgLat}
          </div>
        </div>
      </div>

      {/* Module Feed */}
      <div className="h-[calc(100vh-200px)] overflow-y-auto px-4 py-4">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Module Feed
        </div>
        {loading ? (
          <div className="py-8 text-center font-mono text-sm text-zinc-500">
            LOADING...
          </div>
        ) : modulesWithTasks.length === 0 ? (
          <div className="py-8 text-center font-mono text-sm text-zinc-500">
            NO MODULES
          </div>
        ) : (
          <div className="space-y-2">
            {modulesWithTasks.map((module) => {
              // Use dynamic icon if available, otherwise fallback to type icon
              const iconKey = (module.icon_key || module.type.toLowerCase()).toLowerCase();
              const Icon = iconMap[iconKey] || typeIcons[module.type];
              const StatusIcon = computedStatusIcons[module.computedStatus];
              const statusColor = computedStatusColors[module.computedStatus];

              return (
                <div
                  key={module.id}
                  className="group relative w-full rounded border border-white/10 bg-black/30 p-3 transition-all hover:border-white/20 hover:bg-black/50 backdrop-blur-sm"
                >
                  <button
                    onClick={() => handleModuleClick(module)}
                    className="w-full text-left"
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div
                        className="flex-shrink-0"
                        style={{
                          color: module.color || undefined,
                        }}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-white truncate">
                            {module.name}
                          </div>
                          <StatusIcon
                            className={`h-4 w-4 flex-shrink-0 ${statusColor.replace('bg-', 'text-')}`}
                          />
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs">
                          <span className="text-zinc-400">{module.type}</span>
                          <span className="text-zinc-600">•</span>
                          <span className="font-mono text-zinc-500">
                            {module.computedStatus.toUpperCase().replace('_', ' ')}
                          </span>
                        </div>
                        <div className="mt-1 font-mono text-xs text-zinc-600">
                          {module.lat.toFixed(4)}, {module.lng.toFixed(4)}
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Action Buttons */}
                  <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {/* Edit Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingModule(module);
                        setIsEditDialogOpen(true);
                      }}
                      className="rounded p-1.5 text-zinc-500 transition-all hover:bg-blue-500/20 hover:text-blue-400"
                      title="Edit module"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteModule(module.id, module.name);
                      }}
                      className="rounded p-1.5 text-zinc-500 transition-all hover:bg-red-500/20 hover:text-red-400"
                      title="Delete module"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Module Button */}
        <div className="mt-4 border-t border-white/10 pt-4">
          <button
            onClick={() => setIsAddDialogOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 bg-black/30 px-4 py-3 text-sm font-medium text-zinc-400 transition-all hover:border-white/40 hover:bg-black/50 hover:text-zinc-200"
          >
            <Plus className="h-4 w-4" />
            Add Module
          </button>
        </div>
      </div>

      {/* Add Module Dialog */}
      <AddModuleDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onModuleAdded={loadModulesAndTasks}
      />

      {/* Edit Module Dialog */}
      <EditModuleDialog
        isOpen={isEditDialogOpen}
        module={editingModule}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingModule(null);
        }}
        onModuleUpdated={loadModulesAndTasks}
      />
    </div>
  );

  return (
    <>
      {/* Desktop: fixed sidebar (hidden on mobile) */}
      <div className="fixed left-0 top-0 z-40 hidden h-screen md:block">
        {sidebarContent}
      </div>

      {/* Mobile: drawer overlay + sliding panel */}
      {isMobileOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={onMobileClose}
          />
          <div
            className="fixed left-0 top-0 z-50 h-full w-80 shadow-2xl transition-transform duration-300 ease-out md:hidden"
            style={{
              transform: drawerAnimatingIn ? 'translateX(-100%)' : 'translateX(0)',
            }}
          >
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
}
