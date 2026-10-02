'use client';

// ========================================
// IMAGINE - Main Page
// Le moteur de décision, avec la carte en vue secondaire
// ========================================

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Layers, Waypoints } from 'lucide-react';
import { Canvas } from '@/components/canvas';
import {
  WelcomeScreen,
  SparkInput,
  Toolbar,
  Sidebar,
  CommandPalette,
  MiniMap,
} from '@/components/ui';
import { ProjectionBoard } from '@/components/projection';
import { useImagineStore } from '@/store';
import { cn } from '@/lib/utils';

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [mounted, setMounted] = useState(false);

  const view = useImagineStore((s) => s.ui.view);
  const setView = useImagineStore((s) => s.setView);
  const nodes = useImagineStore((s) => s.nodes);
  const setProject = useImagineStore((s) => s.setProject);

  // Handle hydration
  useEffect(() => {
    setMounted(true);

    setProject({
      id: 'default',
      name: 'Mon espace de pensée',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerId: 'user',
      settings: {
        gridEnabled: true,
        gridSize: 40,
        snapToGrid: false,
        defaultNodeType: 'text',
        aiEnabled: true,
      },
    });
  }, [setProject]);

  // Skip welcome if nodes exist
  useEffect(() => {
    if (mounted && nodes.length > 0) {
      setShowWelcome(false);
    }
  }, [mounted, nodes.length]);

  // Handle keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        useImagineStore.getState().setCommandPaletteOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!mounted) {
    return (
      <div className="fixed inset-0 bg-imagine-bg flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-imagine-projection border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-imagine-bg">
      <AnimatePresence mode="wait">
        {showWelcome ? (
          <WelcomeScreen
            key="welcome"
            onStart={() => setShowWelcome(false)}
          />
        ) : (
          <div key="app" className="w-full h-full">
            <AnimatePresence mode="wait">
              {view === 'projection' ? (
                <motion.div
                  key="projection"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-full h-full"
                >
                  <ProjectionBoard />
                </motion.div>
              ) : (
                <motion.div
                  key="map"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-full h-full"
                >
                  <Canvas />
                  <Toolbar />
                  <Sidebar />
                  <MiniMap />
                </motion.div>
              )}
            </AnimatePresence>

            <SparkInput />
            <CommandPalette />

            {/* Bascule de vue */}
            <ViewSwitch
              view={view}
              onToggle={() => setView(view === 'projection' ? 'map' : 'projection')}
            />
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}

function ViewSwitch({
  view,
  onToggle,
}: {
  view: 'projection' | 'map';
  onToggle: () => void;
}) {
  const Icon = view === 'projection' ? Layers : Waypoints;
  const label = view === 'projection' ? 'Carte' : 'Projection';

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      onClick={onToggle}
      title={label}
      className={cn(
        'fixed bottom-4 left-4 z-40 flex items-center gap-2 px-3 py-2 rounded-xl glass',
        'text-imagine-text-muted hover:text-imagine-text transition-colors'
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="text-xs">{label}</span>
    </motion.button>
  );
}