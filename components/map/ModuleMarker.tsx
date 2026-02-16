'use client';

import { Module, ModuleType } from '@/types';
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
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';

interface ModuleMarkerProps {
  module: Module;
  onClick: () => void;
  computedStatus?: 'completed' | 'in_progress' | 'no_tasks';
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

// Status icons based on task completion
const statusIcons = {
  completed: CheckCircle2,
  in_progress: Clock,
  no_tasks: AlertCircle,
};

const statusColors = {
  completed: 'border-green-400 text-green-400',
  in_progress: 'border-blue-400 text-blue-400',
  no_tasks: 'border-yellow-400 text-yellow-400',
};

export function ModuleMarker({
  module,
  onClick,
  computedStatus = 'no_tasks',
}: ModuleMarkerProps) {
  // Use dynamic icon if available, otherwise fallback to type icon
  // Force recalculation when icon_key or type changes
  const iconKey = (module.icon_key || module.type.toLowerCase()).toLowerCase();
  const Icon = iconMap[iconKey] || typeIcons[module.type];
  
  // Use dynamic color if available, otherwise fallback to type color
  // Force recalculation when color changes
  const backgroundColor = module.color || '#6b7280'; // default gray
  
  const StatusIcon = statusIcons[computedStatus];
  const statusColor = statusColors[computedStatus];

  return (
    <button
      onClick={onClick}
      className="group relative flex cursor-pointer items-center justify-center transition-transform hover:scale-110"
      title={`${module.name} (${module.type})`}
    >
      {/* Outer ring for status */}
      <div
        className={`absolute h-16 w-16 rounded-full border-2 ${statusColor.split(' ')[0]} bg-zinc-900/80 backdrop-blur-sm`}
      />

      {/* Icon container */}
      <div
        className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full shadow-lg"
        style={{ backgroundColor }}
      >
        <Icon className="h-7 w-7 text-white" />
      </div>

      {/* Status indicator */}
      <div className="absolute -bottom-1 -right-1 z-20 rounded-full bg-zinc-900">
        <StatusIcon className={`h-5 w-5 ${statusColor.split(' ')[1]}`} />
      </div>

      {/* Tooltip on hover */}
      <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-100 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        {module.name}
      </div>
    </button>
  );
}
