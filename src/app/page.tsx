'use client';

// ========================================
// IMAGINE - Main Page
// Page principale de l'application
// ========================================

import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Canvas } from '@/components/canvas';
import { 
  WelcomeScreen, 
  SparkInput, 
  Toolbar, 
  Sidebar,
  CommandPalette,
  MiniMap,
} from '@/components/ui';
import { useImagineStore } from '@/store';

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { nodes, setProject } = useImagineStore();

  // Handle hydration
  useEffect(() => {
    setMounted(true);
    
    // Initialize default project if none exists
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
            {/* Main canvas */}
            <Canvas />

            {/* UI overlays */}
            <Toolbar />
            <Sidebar />
            <SparkInput />
            <CommandPalette />
            <MiniMap />
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
