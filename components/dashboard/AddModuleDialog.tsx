'use client';

import { useState } from 'react';
import { X, Droplet, Zap, Wifi, Box, MapPin, Anchor, Wrench, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AddModuleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onModuleAdded: () => void;
}

const availableIcons = [
  { key: 'droplet', component: Droplet, label: 'Water' },
  { key: 'zap', component: Zap, label: 'Power' },
  { key: 'wifi', component: Wifi, label: 'Network' },
  { key: 'box', component: Box, label: 'Box' },
  { key: 'mappin', component: MapPin, label: 'Location' },
  { key: 'anchor', component: Anchor, label: 'Anchor' },
  { key: 'wrench', component: Wrench, label: 'Tool' },
  { key: 'user', component: User, label: 'User' },
];

const presetColors = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#10b981', // green
  '#f59e0b', // yellow
  '#ef4444', // red
  '#06b6d4', // cyan
];

export function AddModuleDialog({
  isOpen,
  onClose,
  onModuleAdded,
}: AddModuleDialogProps) {
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('droplet');
  const [selectedColor, setSelectedColor] = useState('#3b82f6');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('modules').insert({
        name: name.trim(),
        type: 'Misc', // Default type
        lat: 40.7299,
        lng: -80.0500,
        status: 'pending',
        icon_key: selectedIcon,
        color: selectedColor,
      });

      if (error) throw error;

      // Reset form
      setName('');
      setSelectedIcon('droplet');
      setSelectedColor('#3b82f6');
      onModuleAdded();
      onClose();
    } catch (error) {
      console.error('Error adding module:', error);
      alert('Failed to add module. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 z-[210] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-white/10 bg-zinc-950/95 backdrop-blur-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Add New Module</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6">
          {/* Name Input */}
          <div className="mb-6">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Module Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter module name"
              className="w-full rounded-lg border border-white/10 bg-zinc-900/50 px-4 py-2 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              autoFocus
              required
            />
          </div>

          {/* Icon Selection */}
          <div className="mb-6">
            <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Icon
            </label>
            <div className="grid grid-cols-4 gap-3">
              {availableIcons.map((icon) => {
                const IconComponent = icon.component;
                const isSelected = selectedIcon === icon.key;
                return (
                  <button
                    key={icon.key}
                    type="button"
                    onClick={() => setSelectedIcon(icon.key)}
                    className={`flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/20'
                        : 'border-white/10 bg-zinc-900/30 hover:border-white/20'
                    }`}
                  >
                    <IconComponent
                      className={`h-6 w-6 ${
                        isSelected ? 'text-blue-400' : 'text-zinc-400'
                      }`}
                    />
                    <span className="text-[10px] text-zinc-500">
                      {icon.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Selection */}
          <div className="mb-6">
            <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Color
            </label>
            <div className="flex gap-3">
              {presetColors.map((color) => {
                const isSelected = selectedColor === color;
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`h-10 w-10 rounded-full transition-all ${
                      isSelected
                        ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-zinc-950'
                        : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {isSelected && (
                      <div className="flex h-full items-center justify-center">
                        <div className="h-3 w-3 rounded-full bg-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-white/10 bg-zinc-900/50 px-4 py-2 font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Module'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
