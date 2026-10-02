'use client';

// ========================================
// IMAGINE - Command Palette
// Palette de commandes (Cmd+K)
// ========================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  FileText,
  Link,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid3X3,
  Sparkles,
  Compass,
  Hammer,
  Download,
  Settings,
  Keyboard,
} from 'lucide-react';
import { useImagineStore } from '@/store';
import { cn } from '@/lib/utils';

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  action: () => void;
  shortcut?: string;
  category: 'create' | 'view' | 'edit' | 'navigate' | 'settings';
}

export default function CommandPalette() {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const {
    ui,
    setCommandPaletteOpen,
    setSparkInputOpen,
    addNode,
    deleteSelectedNodes,
    selectAll,
    clearSelection,
    zoom,
    resetViewport,
    fitToContent,
    toggleGrid,
    setMode,
    canvas,
  } = useImagineStore();

  const isOpen = ui.commandPaletteOpen;

  // Define commands
  const commands: Command[] = useMemo(() => [
    // Create
    {
      id: 'new-spark',
      label: 'Nouveau Spark',
      description: 'Créer une nouvelle idée',
      icon: Sparkles,
      action: () => setSparkInputOpen(true),
      shortcut: '⌘N',
      category: 'create',
    },
    {
      id: 'new-node',
      label: 'Nouveau nœud',
      description: 'Ajouter un nœud texte',
      icon: Plus,
      action: () => addNode({ type: 'text', content: '', position: { x: 0, y: 0 } }),
      category: 'create',
    },
    // View
    {
      id: 'zoom-in',
      label: 'Zoom avant',
      icon: ZoomIn,
      action: () => zoom(0.1),
      shortcut: '⌘+',
      category: 'view',
    },
    {
      id: 'zoom-out',
      label: 'Zoom arrière',
      icon: ZoomOut,
      action: () => zoom(-0.1),
      shortcut: '⌘-',
      category: 'view',
    },
    {
      id: 'fit-content',
      label: 'Ajuster à l\'écran',
      icon: Maximize2,
      action: fitToContent,
      shortcut: '1',
      category: 'view',
    },
    {
      id: 'reset-view',
      label: 'Réinitialiser la vue',
      icon: Maximize2,
      action: resetViewport,
      shortcut: '0',
      category: 'view',
    },
    {
      id: 'toggle-grid',
      label: 'Afficher/masquer la grille',
      icon: Grid3X3,
      action: toggleGrid,
      shortcut: 'G',
      category: 'view',
    },
    // Edit
    {
      id: 'select-all',
      label: 'Tout sélectionner',
      icon: FileText,
      action: selectAll,
      shortcut: '⌘A',
      category: 'edit',
    },
    {
      id: 'delete-selected',
      label: 'Supprimer la sélection',
      icon: Trash2,
      action: deleteSelectedNodes,
      shortcut: '⌫',
      category: 'edit',
    },
    // Navigate
    {
      id: 'mode-canvas',
      label: 'Mode Canvas',
      description: 'Mode édition standard',
      icon: FileText,
      action: () => setMode('canvas'),
      category: 'navigate',
    },
    {
      id: 'mode-drift',
      label: 'Mode Drift',
      description: 'Exploration libre',
      icon: Compass,
      action: () => setMode('drift'),
      category: 'navigate',
    },
    {
      id: 'mode-forge',
      label: 'Mode Forge',
      description: 'Transformer en livrable',
      icon: Hammer,
      action: () => setMode('forge'),
      category: 'navigate',
    },
    // Settings
    {
      id: 'shortcuts',
      label: 'Raccourcis clavier',
      icon: Keyboard,
      action: () => console.log('Show shortcuts'),
      category: 'settings',
    },
    {
      id: 'settings',
      label: 'Paramètres',
      icon: Settings,
      action: () => console.log('Open settings'),
      category: 'settings',
    },
  ], [addNode, deleteSelectedNodes, fitToContent, resetViewport, selectAll, setMode, setSparkInputOpen, toggleGrid, zoom]);

  // Filter commands based on search
  const filteredCommands = useMemo(() => {
    if (!search) return commands;
    const lowerSearch = search.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(lowerSearch) ||
        cmd.description?.toLowerCase().includes(lowerSearch)
    );
  }, [commands, search]);

  // Reset selected index when filtered commands change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) => (i + 1) % filteredCommands.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) =>
            i === 0 ? filteredCommands.length - 1 : i - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
            setCommandPaletteOpen(false);
            setSearch('');
          }
          break;
        case 'Escape':
          e.preventDefault();
          setCommandPaletteOpen(false);
          setSearch('');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, setCommandPaletteOpen]);

  const handleCommandClick = useCallback(
    (command: Command) => {
      command.action();
      setCommandPaletteOpen(false);
      setSearch('');
    },
    [setCommandPaletteOpen]
  );

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {};
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) groups[cmd.category] = [];
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  const categoryLabels: Record<string, string> = {
    create: 'Créer',
    view: 'Vue',
    edit: 'Éditer',
    navigate: 'Navigation',
    settings: 'Paramètres',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm"
          onClick={() => {
            setCommandPaletteOpen(false);
            setSearch('');
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-lg mx-4 rounded-xl bg-imagine-bg-elevated border border-white/10 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
              <Search className="w-5 h-5 text-imagine-text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher une commande..."
                className="flex-1 bg-transparent text-imagine-text outline-none placeholder:text-imagine-text-subtle"
                autoFocus
              />
              <kbd className="px-2 py-0.5 rounded bg-imagine-bg text-xs text-imagine-text-subtle">
                esc
              </kbd>
            </div>

            {/* Commands list */}
            <div className="max-h-[400px] overflow-y-auto py-2">
              {Object.entries(groupedCommands).map(([category, cmds]) => (
                <div key={category}>
                  <div className="px-4 py-1.5">
                    <span className="text-xs font-medium text-imagine-text-subtle uppercase tracking-wider">
                      {categoryLabels[category]}
                    </span>
                  </div>
                  {cmds.map((command) => {
                    const globalIndex = filteredCommands.indexOf(command);
                    const isSelected = globalIndex === selectedIndex;
                    return (
                      <button
                        key={command.id}
                        onClick={() => handleCommandClick(command)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2 text-left transition-colors',
                          isSelected
                            ? 'bg-white/10 text-imagine-text'
                            : 'text-imagine-text-muted hover:bg-white/5 hover:text-imagine-text'
                        )}
                      >
                        <command.icon className="w-4 h-4" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{command.label}</p>
                          {command.description && (
                            <p className="text-xs text-imagine-text-subtle truncate">
                              {command.description}
                            </p>
                          )}
                        </div>
                        {command.shortcut && (
                          <kbd className="px-2 py-0.5 rounded bg-imagine-bg text-xs text-imagine-text-subtle">
                            {command.shortcut}
                          </kbd>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}

              {filteredCommands.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-imagine-text-muted">
                    Aucune commande trouvée
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
