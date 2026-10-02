'use client';

// ========================================
// IMAGINE - Connection Label Picker
// Suggestions de labels lors de la création de liens
// ========================================

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Zap,
  Link2,
  Clock,
  AlertTriangle,
  ThumbsUp,
  Loader2,
  Check,
} from 'lucide-react';
import { useAI } from '@/hooks';
import { cn } from '@/lib/utils';
import type { ImagineNode } from '@/types';

interface ConnectionLabelPickerProps {
  fromNode: ImagineNode;
  toNode: ImagineNode;
  position: { x: number; y: number };
  onSelect: (label: string, relationType: string) => void;
  onCancel: () => void;
}

interface LabelSuggestion {
  label: string;
  type: 'causal' | 'semantic' | 'temporal' | 'conflict' | 'support';
  confidence: number;
  explanation: string;
}

const typeIcons: Record<string, React.ElementType> = {
  causal: Zap,
  semantic: Link2,
  temporal: Clock,
  conflict: AlertTriangle,
  support: ThumbsUp,
};

const typeColors: Record<string, string> = {
  causal: 'text-imagine-projection bg-imagine-projection/10 border-imagine-projection/30',
  semantic: 'text-imagine-nebula-light bg-imagine-nebula/10 border-imagine-nebula/30',
  temporal: 'text-imagine-drift bg-imagine-drift/10 border-imagine-drift/30',
  conflict: 'text-imagine-conflict bg-imagine-conflict/10 border-imagine-conflict/30',
  support: 'text-imagine-coherence bg-imagine-coherence/10 border-imagine-coherence/30',
};

const defaultLabels: LabelSuggestion[] = [
  { label: 'mène à', type: 'causal', confidence: 0.8, explanation: 'Relation de cause à effet' },
  { label: 'dépend de', type: 'causal', confidence: 0.7, explanation: 'Dépendance' },
  { label: 'lié à', type: 'semantic', confidence: 0.5, explanation: 'Connexion thématique' },
  { label: 'contredit', type: 'conflict', confidence: 0.6, explanation: 'Opposition' },
  { label: 'soutient', type: 'support', confidence: 0.7, explanation: 'Renforcement' },
];

export default function ConnectionLabelPicker({
  fromNode,
  toNode,
  position,
  onSelect,
  onCancel,
}: ConnectionLabelPickerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<LabelSuggestion[]>(defaultLabels);
  const [customLabel, setCustomLabel] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  
  const { suggestConnectionLabel } = useAI();

  // Fetch AI suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const result = await suggestConnectionLabel(fromNode, toNode);
        if (result && result.length > 0) {
          setSuggestions(result as LabelSuggestion[]);
        }
      } catch {
        // Keep default labels
      }
      setIsLoading(false);
    };

    fetchSuggestions();
  }, [fromNode, toNode, suggestConnectionLabel]);

  // Get node preview text
  const getNodePreview = (node: ImagineNode): string => {
    if (node.type === 'text') {
      const content = (node as any).content || '';
      return content.slice(0, 30) + (content.length > 30 ? '...' : '');
    }
    return node.type;
  };

  const handleSelect = (suggestion: LabelSuggestion) => {
    onSelect(suggestion.label, suggestion.type);
  };

  const handleCustomSubmit = () => {
    if (customLabel.trim()) {
      onSelect(customLabel.trim(), 'semantic');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed z-[100] pointer-events-auto"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className="bg-imagine-bg-elevated/98 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl w-80 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/5 bg-gradient-to-r from-imagine-intuition/10 to-transparent">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-imagine-text-muted truncate max-w-[100px]">
              {getNodePreview(fromNode)}
            </span>
            <ArrowRight className="w-4 h-4 text-imagine-intuition flex-shrink-0" />
            <span className="text-imagine-text-muted truncate max-w-[100px]">
              {getNodePreview(toNode)}
            </span>
          </div>
          <p className="text-xs text-imagine-text-subtle mt-1">
            Quel type de relation ?
          </p>
        </div>

        {/* Suggestions */}
        <div className="p-2 max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 text-imagine-projection animate-spin" />
              <span className="ml-2 text-xs text-imagine-text-muted">Analyse de la relation...</span>
            </div>
          ) : (
            <div className="space-y-1">
              {suggestions.map((suggestion, index) => {
                const Icon = typeIcons[suggestion.type] || Link2;
                return (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSelect(suggestion)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all',
                      'hover:scale-[1.02] hover:shadow-md',
                      typeColors[suggestion.type]
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{suggestion.label}</span>
                        <span className="text-[10px] opacity-60">
                          {Math.round(suggestion.confidence * 100)}%
                        </span>
                      </div>
                      {suggestion.explanation && (
                        <p className="text-[10px] opacity-70 mt-0.5">
                          {suggestion.explanation}
                        </p>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* Custom label */}
        <div className="px-3 py-2 border-t border-white/5">
          {showCustom ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
                placeholder="Label personnalisé..."
                className="flex-1 px-2 py-1.5 rounded-lg bg-imagine-bg text-sm text-imagine-text placeholder:text-imagine-text-subtle border border-white/10 focus:border-imagine-projection/50 outline-none"
                autoFocus
              />
              <button
                onClick={handleCustomSubmit}
                disabled={!customLabel.trim()}
                title="Appliquer le label personnalisé"
                aria-label="Appliquer le label personnalisé"
                className={cn(
                  'p-1.5 rounded-lg transition-colors',
                  customLabel.trim()
                    ? 'bg-imagine-projection text-imagine-bg'
                    : 'bg-white/5 text-imagine-text-subtle'
                )}
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowCustom(true)}
              className="w-full text-xs text-imagine-text-muted hover:text-imagine-text py-1 transition-colors"
            >
              + Label personnalisé
            </button>
          )}
        </div>

        {/* Cancel */}
        <div className="px-3 py-2 border-t border-white/5 bg-imagine-bg/30">
          <button
            onClick={onCancel}
            className="w-full py-1.5 text-xs text-imagine-text-subtle hover:text-imagine-text transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    </motion.div>
  );
}
