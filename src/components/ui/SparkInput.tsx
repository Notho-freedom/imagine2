'use client';

// ========================================
// IMAGINE - Spark Input
// Input de création rapide d'une idée
// ========================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Mic, Image as ImageIcon, Send, X } from 'lucide-react';
import { useImagineStore } from '@/store';
import { cn } from '@/lib/utils';

export default function SparkInput() {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { 
    ui, 
    setSparkInputOpen, 
    addNode,
    canvas,
  } = useImagineStore();

  const isOpen = ui.sparkInputOpen;

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle submit
  const handleSubmit = useCallback(() => {
    if (!input.trim()) return;

    // Calculate position for new node (center of viewport)
    const viewportCenterX = typeof window !== 'undefined' 
      ? (window.innerWidth / 2 - canvas.viewport.x) / canvas.viewport.zoom 
      : 0;
    const viewportCenterY = typeof window !== 'undefined'
      ? (window.innerHeight / 2 - canvas.viewport.y) / canvas.viewport.zoom
      : 0;

    addNode({
      type: 'text',
      content: input.trim(),
      position: {
        x: viewportCenterX - 125,
        y: viewportCenterY - 60,
      },
    });

    setInput('');
    setSparkInputOpen(false);
  }, [input, addNode, setSparkInputOpen, canvas.viewport]);

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSparkInputOpen(false);
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSparkInputOpen(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative w-full max-w-xl mx-4"
          >
            {/* Glow effect */}
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-imagine-projection/50 to-imagine-intuition/50 blur opacity-50" />

            {/* Main container */}
            <div className="relative rounded-2xl bg-imagine-bg-elevated border border-white/10 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-imagine-projection to-imagine-intuition flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-imagine-text">
                  Nouveau Spark
                </span>
                <button
                  onClick={() => setSparkInputOpen(false)}
                  className="ml-auto p-1 rounded hover:bg-white/10 text-imagine-text-muted hover:text-imagine-text transition-colors"
                  title="Fermer"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Input area */}
              <div className="p-4">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Décrivez votre idée..."
                  className="w-full min-h-[120px] bg-transparent text-imagine-text text-lg resize-none outline-none placeholder:text-imagine-text-subtle"
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
                <div className="flex items-center gap-2">
                  {/* Voice input */}
                  <button
                    onClick={() => setIsRecording(!isRecording)}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      isRecording
                        ? 'bg-imagine-forge text-white'
                        : 'hover:bg-white/10 text-imagine-text-muted hover:text-imagine-text'
                    )}
                    title="Entrée vocale"
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  {/* Image input */}
                  <button
                    className="p-2 rounded-lg hover:bg-white/10 text-imagine-text-muted hover:text-imagine-text transition-colors"
                    title="Ajouter une image"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-imagine-text-subtle">
                    ⌘↵ pour créer
                  </span>
                  <button
                    onClick={handleSubmit}
                    disabled={!input.trim()}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
                      input.trim()
                        ? 'bg-imagine-projection text-imagine-bg hover:bg-imagine-projection-light'
                        : 'bg-imagine-bg-light text-imagine-text-subtle cursor-not-allowed'
                    )}
                  >
                    <Send className="w-4 h-4" />
                    <span>Créer</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
