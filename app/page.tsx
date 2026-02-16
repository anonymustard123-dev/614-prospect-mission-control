'use client';

import { useState, useRef } from 'react';
import { Menu } from 'lucide-react';
import { MissionMap, MissionMapRef } from '@/components/map/MissionMap';
import { ModuleDashboard } from '@/components/dashboard/ModuleDashboard';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Module } from '@/types';

export default function Home() {
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mapRef = useRef<MissionMapRef>(null);

  const handleSidebarModuleClick = (module: Module) => {
    if (mapRef.current) {
      mapRef.current.flyToModule(module);
    }
    setMobileMenuOpen(false);
  };

  return (
    <main className="relative flex h-screen w-screen overflow-hidden bg-zinc-950">
      {/* Mobile: floating Menu button (top-left) */}
      <button
        type="button"
        aria-label="Open menu"
        onClick={() => setMobileMenuOpen(true)}
        className="fixed left-4 top-4 z-30 flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-black/50 backdrop-blur-md text-white shadow-lg transition-colors hover:bg-white/10 md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Sidebar: desktop fixed + mobile drawer */}
      <Sidebar
        onModuleClick={handleSidebarModuleClick}
        isMobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Map: full viewport on mobile; right of sidebar on desktop */}
      <div className="absolute inset-0 md:pl-80">
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
