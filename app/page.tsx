'use client';

import { useState, useRef } from 'react';
import { MissionMap, MissionMapRef } from '@/components/map/MissionMap';
import { ModuleDashboard } from '@/components/dashboard/ModuleDashboard';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Module } from '@/types';

export default function Home() {
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const mapRef = useRef<MissionMapRef>(null);

  const handleSidebarModuleClick = (module: Module) => {
    // Fly to the module on the map
    if (mapRef.current) {
      mapRef.current.flyToModule(module);
    }
  };

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-zinc-950">
      {/* Sidebar */}
      <Sidebar onModuleClick={handleSidebarModuleClick} />

      {/* Map */}
      <div className="flex-1">
        <MissionMap ref={mapRef} onModuleClick={setSelectedModule} />
      </div>

      {/* Module Dashboard Modal */}
      {selectedModule && (
        <ModuleDashboard
          module={selectedModule}
          onClose={() => setSelectedModule(null)}
        />
      )}
    </main>
  );
}
