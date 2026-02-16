'use client';

import { useEffect, useState, useRef, useImperativeHandle, forwardRef, useMemo } from 'react';
import Map, { Marker, DragEvent, MapRef } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Module, Task } from '@/types';
import { supabase } from '@/lib/supabase';
import { ModuleMarker } from './ModuleMarker';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

interface MissionMapProps {
  onModuleClick: (module: Module) => void;
}

export interface MissionMapRef {
  flyToModule: (module: Module) => void;
  refreshModules: () => void;
}

export const MissionMap = forwardRef<MissionMapRef, MissionMapProps>(
  ({ onModuleClick }, ref) => {
    const [modules, setModules] = useState<Module[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const mapRef = useRef<MapRef>(null);

    useImperativeHandle(ref, () => ({
      flyToModule: (module: Module) => {
        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [module.lng, module.lat],
            zoom: 18,
            duration: 1500,
          });
        }
      },
      refreshModules: () => {
        loadModules();
      },
    }));

    useEffect(() => {
      loadModules();
      loadTasks();

      // Subscribe to real-time updates
      const modulesChannel = supabase
        .channel('map-modules-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'modules',
          },
          (payload) => {
            console.log('Module change detected in map:', payload);
            // Reload modules to get latest data including color and icon_key
            loadModules();
          }
        )
        .subscribe((status) => {
          console.log('Modules channel subscription status:', status);
        });

      const tasksChannel = supabase
        .channel('map-tasks-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tasks',
          },
          () => {
            loadTasks();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(modulesChannel);
        supabase.removeChannel(tasksChannel);
      };
    }, []);

    const loadModules = async () => {
      try {
        const { data, error } = await supabase
          .from('modules')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) throw error;
        
        // Force state update with new array reference to ensure re-render
        if (data) {
          setModules([...data]);
        } else {
          setModules([]);
        }
      } catch (error) {
        console.error('Error loading modules:', error);
      } finally {
        setLoading(false);
      }
    };

    const loadTasks = async () => {
      try {
        const { data, error } = await supabase.from('tasks').select('*');
        if (error) throw error;
        setTasks(data || []);
      } catch (error) {
        console.error('Error loading tasks:', error);
      }
    };

    // Compute status for each module based on tasks
    const moduleStatuses = useMemo(() => {
      const statusMap: Record<string, 'completed' | 'in_progress' | 'no_tasks'> = {};
      
      modules.forEach((module) => {
        const moduleTasks = tasks.filter((t) => t.module_id === module.id);
        
        if (moduleTasks.length === 0) {
          statusMap[module.id] = 'no_tasks';
        } else {
          const allCompleted = moduleTasks.every((t) => t.is_completed);
          statusMap[module.id] = allCompleted ? 'completed' : 'in_progress';
        }
      });
      
      return statusMap;
    }, [modules, tasks]);

    const handleMarkerDragEnd = async (moduleId: string, event: DragEvent) => {
      const { lng, lat } = event.lngLat;

      try {
        const { error } = await supabase
          .from('modules')
          .update({ lng, lat })
          .eq('id', moduleId);

        if (error) throw error;

        // Update local state
        setModules((prev) =>
          prev.map((m) => (m.id === moduleId ? { ...m, lng, lat } : m))
        );
      } catch (error) {
        console.error('Error updating module position:', error);
      }
    };

    if (loading) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-zinc-100">
          <div className="font-mono text-lg">LOADING MAP...</div>
        </div>
      );
    }

    return (
      <div className="relative h-screen w-full">
        {/* Vignette effect */}
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-radial from-transparent via-transparent to-black/30" />
        
        <Map
          ref={mapRef}
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={{
            longitude: -80.0500,
            latitude: 40.7300,
            zoom: 17,
          }}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/satellite-v9"
          doubleClickZoom={false}
        >
          {modules.map((module) => (
            <Marker
              key={`${module.id}-${module.color}-${module.icon_key}`}
              longitude={module.lng}
              latitude={module.lat}
              anchor="center"
              draggable
              onDragEnd={(e) => handleMarkerDragEnd(module.id, e)}
            >
              <ModuleMarker
                module={module}
                onClick={() => onModuleClick(module)}
                computedStatus={moduleStatuses[module.id] || 'no_tasks'}
              />
            </Marker>
          ))}
        </Map>
      </div>
    );
  }
);

MissionMap.displayName = 'MissionMap';
