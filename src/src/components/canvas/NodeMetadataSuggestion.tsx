'use client';

// ========================================
// IMAGINE - Node Metadata Suggestion
// Suggestions de métadonnées pour les nœuds
// ========================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tag,
  Key,
  FileText,
  Star,
  Lightbulb,
  Check,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useImagineStore } from '@/store';
import { useAI } from '@/hooks';
import { cn } from '@/lib/utils';
import type { ImagineNode } from '@/types';

interface NodeMetadataSuggestionProps {
  node: ImagineNode;
  onClose: () => void;
}

interface MetadataSuggestion {
  tags: string[];
  keywords: string[];
  description: string;
  category?: string;
  importance: 'low' | 'medium' | 'high';
  relatedConcepts: string[];
}

export default function NodeMetadataSuggestion({ node, onClose }: NodeMetadataSuggestionProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [suggestion, setSuggestion] = useState<MetadataSuggestion | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  
  const { updateNode } = useImagineStore();
  const { generateNodeMetadata } = useAI();

  // Generate metadata on mount
  useEffect(() => {
    const fetchMetadata = async () => {
      setIsLoading(true);
      const result = await generateNodeMetadata(node);
      if (result) {
        setSuggestion(result);
        setSelectedTags(result.tags);
        setSelectedKeywords(result.keywords.slice(0, 5));
      }
      setIsLoading(false);
    };

    fetchMetadata();
  }, [node, generateNodeMetadata]);

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Toggle keyword selection
  const toggleKeyword = (keyword: string) => {
    setSelectedKeywords(prev =>
      prev.includes(keyword)
        ? prev.filter(k => k !== keyword)
        : [...prev, keyword]
    );
  };

  // Apply selected metadata
  const handleApply = () => {
    updateNode(node.id, {
      metadata: {
        ...node.metadata,
        tags: selectedTags,
        // Store additional metadata in a custom field
      },
    } as Partial<ImagineNode>);
    onClose();
  };

  const importanceColors = {
    low: 'text-imagine-text-subtle',
    medium: 'text-imagine-nebula',
    high: 'text-imagine-mature',
  };

  const importanceLabels = {
    low: 'Faible',
    medium: 'Moyenne',
    high: 'Élevée',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className="absolute -top-2 left-full ml-3 z-50 w-72"
    >
      <div className="bg-imagine-bg-elevated/98 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-gradient-to-r from-imagine-projection/10 to-transparent">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-imagine-projection" />
            <span className="text-xs font-medium text-imagine-text">Métadonnées suggérées</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 rounded hover:bg-white/10 text-imagine-text-muted"
              title={expanded ? "Réduire" : "Développer"}
              aria-label={expanded ? "Réduire le panneau" : "Développer le panneau"}
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-white/10 text-imagine-text-muted"
              title="Fermer"
              aria-label="Fermer les suggestions"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-imagine-projection animate-spin" />
                  <span className="ml-2 text-xs text-imagine-text-muted">Analyse en cours...</span>
                </div>
              ) : suggestion ? (
                <div className="p-3 space-y-3">
                  {/* Description */}
                  {suggestion.description && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] text-imagine-text-subtle uppercase tracking-wide">
                        <FileText className="w-3 h-3" />
                        Description
                      </div>
                      <p className="text-xs text-imagine-text leading-relaxed bg-imagine-bg/50 p-2 rounded-lg">
                        {suggestion.description}
                      </p>
                    </div>
                  )}

                  {/* Tags */}
                  {suggestion.tags.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] text-imagine-text-subtle uppercase tracking-wide">
                        <Tag className="w-3 h-3" />
                        Tags (cliquez pour sélectionner)
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {suggestion.tags.map((tag, i) => (
                          <button
                            key={i}
                            onClick={() => toggleTag(tag)}
                            className={cn(
                              'px-2 py-0.5 rounded-full text-[10px] font-medium transition-all',
                              selectedTags.includes(tag)
                                ? 'bg-imagine-projection text-imagine-bg'
                                : 'bg-white/5 text-imagine-text-muted hover:bg-white/10'
                            )}
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Keywords */}
                  {suggestion.keywords.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] text-imagine-text-subtle uppercase tracking-wide">
                        <Key className="w-3 h-3" />
                        Mots-clés
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {suggestion.keywords.map((keyword, i) => (
                          <button
                            key={i}
                            onClick={() => toggleKeyword(keyword)}
                            className={cn(
                              'px-1.5 py-0.5 rounded text-[10px] transition-all',
                              selectedKeywords.includes(keyword)
                                ? 'bg-imagine-nebula/30 text-imagine-nebula-light'
                                : 'bg-white/5 text-imagine-text-subtle hover:bg-white/10'
                            )}
                          >
                            {keyword}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Importance & Category */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Star className={cn('w-3 h-3', importanceColors[suggestion.importance])} />
                      <span className="text-imagine-text-muted">
                        Importance: <span className={importanceColors[suggestion.importance]}>
                          {importanceLabels[suggestion.importance]}
                        </span>
                      </span>
                    </div>
                    {suggestion.category && (
                      <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-imagine-text-subtle">
                        {suggestion.category}
                      </span>
                    )}
                  </div>

                  {/* Related concepts */}
                  {suggestion.relatedConcepts.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] text-imagine-text-subtle uppercase tracking-wide">
                        <Lightbulb className="w-3 h-3" />
                        Concepts à explorer
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {suggestion.relatedConcepts.map((concept, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-imagine-coherence/10 text-imagine-coherence"
                          >
                            → {concept}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                    <button
                      onClick={handleApply}
                      disabled={selectedTags.length === 0}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all',
                        selectedTags.length > 0
                          ? 'bg-imagine-projection text-imagine-bg hover:bg-imagine-projection/90'
                          : 'bg-white/5 text-imagine-text-subtle cursor-not-allowed'
                      )}
                    >
                      <Check className="w-3 h-3" />
                      Appliquer ({selectedTags.length} tags)
                    </button>
                    <button
                      onClick={onClose}
                      className="px-3 py-2 rounded-lg text-xs font-medium bg-white/5 text-imagine-text-muted hover:bg-white/10 transition-colors"
                    >
                      Ignorer
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-imagine-text-muted">
                  Aucune suggestion disponible
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
