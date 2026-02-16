'use client';

import { useMemo, useState, useEffect } from 'react';
import { Task } from '@/types';
import {
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  format,
  isSameDay,
  isToday,
  differenceInDays,
  startOfDay,
} from 'date-fns';

interface CustomRoadmapProps {
  tasks: Task[];
  loading: boolean;
  onTaskClick?: (task: Task) => void;
}

interface TimelineTask extends Task {
  left: number; // pixels from start
  width: number; // pixels width
  rowIndex: number;
}

interface DayInfo {
  date: Date;
  dayLabel: string; // "M 16"
  monthLabel: string; // "February 2026"
  isNewMonth: boolean;
}

export function CustomRoadmap({
  tasks,
  loading,
  onTaskClick,
}: CustomRoadmapProps) {
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const [dayWidth] = useState(40); // Width of each day column in pixels
  const [todayPosition, setTodayPosition] = useState(-1);
  const [isMounted, setIsMounted] = useState(false);
  const [today, setToday] = useState<Date | null>(null);

  // Filter out subtasks (only show top-level tasks)
  const topLevelTasks = useMemo(() => {
    return tasks.filter((task) => !task.parent_id);
  }, [tasks]);

  // Calculate date range and generate days (without today position)
  const { minDate, maxDate, days } = useMemo(() => {
    if (topLevelTasks.length === 0) {
      // Use a static date range for empty state to avoid hydration issues
      const staticDate = new Date('2026-01-01');
      const future = new Date(staticDate);
      future.setMonth(future.getMonth() + 3);
      return {
        minDate: staticDate,
        maxDate: future,
        days: [] as DayInfo[],
      };
    }

    const dates = topLevelTasks.flatMap((task) => [
      startOfDay(new Date(task.start_date)),
      startOfDay(new Date(task.end_date)),
    ]);
    const min = startOfDay(
      new Date(Math.min(...dates.map((d) => d.getTime())))
    );
    const max = startOfDay(
      new Date(Math.max(...dates.map((d) => d.getTime())))
    );

    // Add padding (2 weeks before, 2 weeks after)
    min.setDate(min.getDate() - 14);
    max.setDate(max.getDate() + 14);

    // Generate all days in range
    const allDays = eachDayOfInterval({ start: min, end: max });

    // Group days by month and create DayInfo
    const daysInfo: DayInfo[] = [];
    let lastMonth = '';

    allDays.forEach((day, idx) => {
      const monthLabel = format(day, 'MMMM yyyy');
      const isNewMonth = monthLabel !== lastMonth;
      if (isNewMonth) lastMonth = monthLabel;

      daysInfo.push({
        date: day,
        dayLabel: format(day, 'E d'), // "Mon 16"
        monthLabel,
        isNewMonth,
      });
    });

    return {
      minDate: min,
      maxDate: max,
      days: daysInfo,
    };
  }, [topLevelTasks]);

  // Calculate today position only on client side after mount
  useEffect(() => {
    setIsMounted(true);
    const todayDate = startOfDay(new Date());
    setToday(todayDate);
    
    if (days.length === 0) {
      setTodayPosition(-1);
      return;
    }

    const todayIdx = days.findIndex((d) => isSameDay(d.date, todayDate));
    setTodayPosition(todayIdx >= 0 ? todayIdx * dayWidth : -1);
  }, [days, dayWidth]);

  // Calculate task positions
  const timelineTasks: TimelineTask[] = useMemo(() => {
    return topLevelTasks.map((task, idx) => {
      const start = startOfDay(new Date(task.start_date));
      const end = startOfDay(new Date(task.end_date));

      const daysFromStart = differenceInDays(start, minDate);
      const duration = Math.max(1, differenceInDays(end, start) + 1);

      const left = daysFromStart * dayWidth;
      const width = duration * dayWidth;

      return {
        ...task,
        left: Math.max(0, left),
        width: Math.max(dayWidth, width),
        rowIndex: idx,
      };
    });
  }, [topLevelTasks, minDate, dayWidth]);

  const getTaskStyle = (task: Task) => {
    // Only calculate overdue status after mount to avoid hydration mismatch
    if (!isMounted || !today) {
      // Return default style during SSR
      if (task.is_completed) {
        return {
          backgroundColor: '#3f3f46',
          color: '#a1a1aa',
          border: 'none',
        };
      }
      if (task.color) {
        return {
          backgroundColor: task.color,
          color: '#ffffff',
          border: 'none',
        };
      }
      return {
        background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
        color: '#ffffff',
        border: 'none',
      };
    }

    const endDate = startOfDay(new Date(task.end_date));
    const isOverdue = endDate < today && !task.is_completed;

    if (task.is_completed) {
      return {
        backgroundColor: '#3f3f46',
        color: '#a1a1aa',
        border: 'none',
      };
    }

    if (isOverdue) {
      return {
        background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)',
        border: '2px solid #ef4444',
        boxShadow: '0 0 8px rgba(239, 68, 68, 0.5)',
        color: '#ffffff',
      };
    }

    if (task.color) {
      return {
        backgroundColor: task.color,
        color: '#ffffff',
        border: 'none',
      };
    }

    return {
      background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
      color: '#ffffff',
      border: 'none',
    };
  };

  const getDaysRemaining = (endDate: string) => {
    if (!today) return 'Calculating...';
    const end = startOfDay(new Date(endDate));
    const diff = differenceInDays(end, today);
    if (diff < 0) return `Overdue by ${Math.abs(diff)} days`;
    if (diff === 0) return 'Due today';
    if (diff === 1) return '1 day remaining';
    return `${diff} days remaining`;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-zinc-400">
        Loading roadmap...
      </div>
    );
  }

  if (topLevelTasks.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <p className="text-zinc-400">No tasks to display</p>
        <p className="mt-2 text-sm text-zinc-500">
          Add tasks in the Task Board to see them on the roadmap
        </p>
      </div>
    );
  }

  const timelineWidth = days.length * dayWidth;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-zinc-950">
      {/* Header - Two Row */}
      <div className="sticky top-0 z-20 border-b border-white/10 bg-zinc-950/95 backdrop-blur-sm">
        {/* Top Row - Month & Year */}
        <div className="relative h-10 border-b border-white/5">
          <div className="flex" style={{ width: `${250 + timelineWidth}px` }}>
            {/* Sidebar spacer */}
            <div className="w-[250px] border-r border-white/10 bg-zinc-900/50 px-4 py-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Tasks
              </div>
            </div>

            {/* Month labels */}
            <div className="relative flex-1">
              {days
                .filter((day) => day.isNewMonth)
                .map((day, idx) => {
                  const monthStart = startOfMonth(day.date);
                  const monthEnd = endOfMonth(day.date);
                  
                  // Find the first and last day of this month in our days array
                  let monthStartIdx = days.findIndex((d) =>
                    isSameDay(d.date, monthStart)
                  );
                  let monthEndIdx = days.findIndex((d) =>
                    isSameDay(d.date, monthEnd)
                  );

                  // If month start not found, use the first occurrence of this month
                  if (monthStartIdx === -1) {
                    monthStartIdx = days.findIndex((d) =>
                      format(d.date, 'MMMM yyyy') === day.monthLabel
                    );
                  }

                  // If month end not found, find the last occurrence
                  if (monthEndIdx === -1) {
                    const monthDays = days.filter(
                      (d) => format(d.date, 'MMMM yyyy') === day.monthLabel
                    );
                    if (monthDays.length > 0) {
                      monthEndIdx = days.findIndex((d) =>
                        isSameDay(d.date, monthDays[monthDays.length - 1].date)
                      );
                    }
                  }

                  if (monthStartIdx === -1) return null;

                  const left = monthStartIdx * dayWidth;
                  const width =
                    monthEndIdx >= monthStartIdx
                      ? (monthEndIdx - monthStartIdx + 1) * dayWidth
                      : dayWidth * 30; // Fallback to ~30 days

                  return (
                    <div
                      key={`${day.monthLabel}-${idx}`}
                      className="absolute border-r border-white/5 px-3 py-2"
                      style={{
                        left: `${left}px`,
                        width: `${width}px`,
                      }}
                    >
                      <div className="text-sm font-semibold text-zinc-300">
                        {day.monthLabel}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Bottom Row - Individual Days */}
        <div className="relative h-8">
          <div className="flex" style={{ width: `${250 + timelineWidth}px` }}>
            {/* Sidebar spacer */}
            <div className="w-[250px] border-r border-white/10 bg-zinc-900/50" />

            {/* Day labels */}
            <div className="relative flex">
              {days.map((day, idx) => (
                <div
                  key={idx}
                  className="absolute border-r border-white/5 text-center"
                  style={{
                    left: `${idx * dayWidth}px`,
                    width: `${dayWidth}px`,
                  }}
                >
                  <div className="pt-1 text-[10px] font-medium text-zinc-400">
                    {day.dayLabel}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Body - Sidebar + Timeline */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Task Names (Fixed) */}
        <div className="w-[250px] flex-shrink-0 border-r border-white/10 bg-zinc-900/30">
          <div className="h-full overflow-y-auto">
            {topLevelTasks.map((task, idx) => (
              <div
                key={task.id}
                className="flex h-12 items-center border-b border-white/5 px-4 hover:bg-zinc-900/50 transition-colors"
                style={{ minHeight: '48px' }}
              >
                <div className="flex-1 truncate text-sm font-medium text-zinc-100">
                  {task.title}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Timeline (Scrollable) */}
        <div className="flex-1 overflow-auto">
          <div
            className="relative"
            style={{ width: `${timelineWidth}px`, minHeight: '100%' }}
          >
            {/* Grid Background - Vertical lines for each day */}
            <div className="absolute inset-0">
              {days.map((_, idx) => (
                <div
                  key={idx}
                  className="absolute h-full border-r border-white/5"
                  style={{
                    left: `${idx * dayWidth}px`,
                    width: `${dayWidth}px`,
                  }}
                />
              ))}
            </div>

            {/* Today Marker - Only show after mount to avoid hydration mismatch */}
            {isMounted && todayPosition >= 0 && (
              <div
                className="pointer-events-none absolute top-0 z-10 h-full"
                style={{ left: `${todayPosition}px` }}
              >
                <div className="absolute top-0 h-full w-0.5 border-l-2 border-red-500" />
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-lg">
                  LIVE
                </div>
              </div>
            )}

            {/* Task Rows */}
            <div className="relative">
              {topLevelTasks.map((_, idx) => (
                <div
                  key={idx}
                  className="relative border-b border-white/5"
                  style={{ height: '48px', minHeight: '48px' }}
                />
              ))}
            </div>

            {/* Task Bars */}
            {timelineTasks.map((task) => {
              const style = getTaskStyle(task);
              const isHovered = hoveredTask === task.id;

              return (
                <div
                  key={task.id}
                  className="absolute z-10"
                  style={{
                    top: `${task.rowIndex * 48 + 8}px`,
                    left: `${task.left}px`,
                    height: '32px',
                  }}
                  onMouseEnter={() => setHoveredTask(task.id)}
                  onMouseLeave={() => setHoveredTask(null)}
                  onClick={() => onTaskClick?.(task)}
                >
                  {/* Task Bar */}
                  <div
                    className="group flex h-8 cursor-pointer items-center gap-2 rounded-lg px-3 shadow-lg transition-all hover:h-9 hover:shadow-xl"
                    style={{
                      width: `${task.width}px`,
                      minWidth: '60px',
                      ...style,
                    }}
                  >
                    {/* Task Name */}
                    <span className="flex-1 truncate text-xs font-medium">
                      {task.title}
                    </span>

                    {/* Avatar */}
                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-[10px] font-semibold">
                      {getInitials(task.title)}
                    </div>
                  </div>

                  {/* Tooltip */}
                  {isHovered && (
                    <div
                      className="absolute bottom-full z-20 mb-2 w-64 rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs shadow-xl"
                      style={{
                        left: '50%',
                        transform: 'translateX(-50%)',
                      }}
                    >
                      <div className="font-semibold text-white">{task.title}</div>
                      {task.description && (
                        <div className="mt-1 text-zinc-400 line-clamp-2">
                          {task.description}
                        </div>
                      )}
                      <div className="mt-2 space-y-1 font-mono text-zinc-500">
                        <div>
                          Start:{' '}
                          {format(new Date(task.start_date), 'MMM d, yyyy')}
                        </div>
                        <div>
                          End: {format(new Date(task.end_date), 'MMM d, yyyy')}
                        </div>
                        <div className="text-zinc-400">
                          {getDaysRemaining(task.end_date)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
