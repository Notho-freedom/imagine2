// ========================================
// IMAGINE - AI Hook
// Hook pour les interactions avec l'API IA
// ========================================

import { useCallback, useState, useEffect, useRef } from 'react';
import { useImagineStore } from '@/store';
import type { ImagineNode, AISuggestion } from '@/types';
import { generateId } from '@/lib/utils';

// ========================================
// Types
// ========================================

interface AIResponse<T> {
  success: boolean;
  result?: T;
  error?: string;
}

interface AnalysisResult {
  themes: string[];
  keywords: string[];
  suggestedLinks: Array<{
    fromNodeId: string;
    toNodeId: string;
    reason: string;
    confidence: number;
  }>;
  reformulations: Array<{
    nodeId: string;
    original: string;
    suggestion: string;
  }>;
}

interface SuggestResult {
  suggestions: AISuggestion[];
}

interface ChatResult {
  response: string;
}

interface ForgeResult {
  content: string;
  metadata: {
    tokensUsed: number;
    generatedAt: string;
    model: string;
  };
}

// ========================================
// API Helper
// ========================================

async function callAI<T>(action: string, data: Record<string, any>): Promise<AIResponse<T>> {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, data }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('[useAI] API call failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur de connexion',
    };
  }
}

// ========================================
// useAI Hook
// ========================================

export function useAI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<AnalysisResult | null>(null);
  
  const { nodes, edges, addSuggestion, addEdge } = useImagineStore();

  // Find isolated nodes and suggest reconnections
  const suggestReconnections = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Find isolated nodes (no connections)
      const isolatedNodes = nodes.filter(node => {
        const hasConnection = edges.some(
          e => e.fromNodeId === node.id || e.toNodeId === node.id
        );
        return !hasConnection;
      });

      if (isolatedNodes.length === 0) {
        setError('Aucun nœud isolé trouvé');
        return null;
      }

      // Get text content from nodes for similarity matching
      const getNodeText = (node: ImagineNode): string => {
        if (node.type === 'text') return (node as any).content || '';
        if (node.type === 'ai') return (node as any).prompt || '';
        if (node.type === 'code') return (node as any).content || '';
        return '';
      };

      // Simple word-based similarity function
      const getWords = (text: string): Set<string> => {
        return new Set(
          text.toLowerCase()
            .replace(/[^a-zàâäéèêëïîôùûüç\s]/gi, '')
            .split(/\s+/)
            .filter(w => w.length > 3)
        );
      };

      const similarity = (text1: string, text2: string): number => {
        const words1 = getWords(text1);
        const words2 = getWords(text2);
        if (words1.size === 0 || words2.size === 0) return 0;
        
        let common = 0;
        words1.forEach(w => { if (words2.has(w)) common++; });
        return common / Math.max(words1.size, words2.size);
      };

      const reconnectLinks: Array<{ fromId: string; toId: string; reason: string }> = [];

      // For each isolated node, find the best match
      for (const isolated of isolatedNodes) {
        const isolatedText = getNodeText(isolated);
        if (!isolatedText) continue;

        let bestMatch: { node: ImagineNode; score: number } | null = null;

        for (const other of nodes) {
          if (other.id === isolated.id) continue;
          
          const otherText = getNodeText(other);
          if (!otherText) continue;

          const score = similarity(isolatedText, otherText);
          
          if (score > 0.1 && (!bestMatch || score > bestMatch.score)) {
            bestMatch = { node: other, score };
          }
        }

        if (bestMatch) {
          // Find common words for reason
          const words1 = getWords(isolatedText);
          const words2 = getWords(getNodeText(bestMatch.node));
          const commonWords: string[] = [];
          words1.forEach(w => { if (words2.has(w)) commonWords.push(w); });
          
          reconnectLinks.push({
            fromId: isolated.id,
            toId: bestMatch.node.id,
            reason: commonWords.length > 0 
              ? `Mots communs: ${commonWords.slice(0, 3).join(', ')}`
              : 'Contenu similaire',
          });
        }
      }

      if (reconnectLinks.length === 0) {
        setError('Aucune connexion suggérée trouvée');
        return null;
      }

      // Create a single reconnect suggestion with all links
      const suggestion: AISuggestion = {
        id: generateId(),
        type: 'reconnect',
        content: `Reconnecter ${reconnectLinks.length} nœud${reconnectLinks.length > 1 ? 's' : ''} isolé${reconnectLinks.length > 1 ? 's' : ''}`,
        confidence: 0.7,
        sourceNodeIds: isolatedNodes.map(n => n.id),
        accepted: false,
        reconnectLinks,
      };

      addSuggestion(suggestion);
      return suggestion;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [nodes, edges, addSuggestion]);

  // Analyze all nodes
  const analyzeNodes = useCallback(async () => {
    if (nodes.length === 0) return null;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await callAI<AnalysisResult>('analyze', { nodes });
      
      if (response.success && response.result) {
        setLastAnalysis(response.result);
        
        // Add suggested links as suggestions
        response.result.suggestedLinks?.forEach((link) => {
          const suggestion: AISuggestion = {
            id: generateId(),
            type: 'expansion',
            content: `Lier "${link.fromNodeId.slice(0, 8)}..." à "${link.toNodeId.slice(0, 8)}...": ${link.reason}`,
            confidence: link.confidence,
            sourceNodeIds: [link.fromNodeId, link.toNodeId],
            accepted: false,
          };
          addSuggestion(suggestion);
        });

        // Add reformulation suggestions
        response.result.reformulations?.forEach((ref) => {
          const suggestion: AISuggestion = {
            id: generateId(),
            type: 'reformulation',
            content: ref.suggestion,
            confidence: 0.8,
            sourceNodeIds: [ref.nodeId],
            accepted: false,
          };
          addSuggestion(suggestion);
        });

        return response.result;
      } else {
        setError(response.error || 'Erreur d\'analyse');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [nodes, addSuggestion]);

  // Get suggestions for a specific node
  const getSuggestionsForNode = useCallback(async (node: ImagineNode) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await callAI<SuggestResult>('suggest', {
        node,
        context: nodes.filter(n => n.id !== node.id),
      });

      if (response.success && response.result) {
        response.result.suggestions?.forEach((s) => {
          addSuggestion(s);
        });
        return response.result.suggestions || [];
      } else {
        setError(response.error || 'Erreur de suggestion');
        return [];
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [nodes, addSuggestion]);

  // Reformulate text
  const reformulate = useCallback(async (
    text: string, 
    style: 'concise' | 'elaborate' | 'formal' | 'casual' = 'concise'
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await callAI<{ text: string; reformulated: string }>('reformulate', {
        text,
        style,
      });

      if (response.success && response.result) {
        return response.result.reformulated;
      } else {
        setError(response.error || 'Erreur de reformulation');
        return text;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      return text;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Chat with AI
  const chat = useCallback(async (message: string, history: Array<{ role: string; content: string }> = []) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await callAI<ChatResult>('chat', {
        message,
        nodes,
        history,
      });

      if (response.success && response.result) {
        return response.result.response;
      } else {
        setError(response.error || 'Erreur de chat');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [nodes]);

  // Forge - Transform ideas into deliverables
  const forge = useCallback(async (
    outputType: 'document' | 'pitch' | 'plan' | 'code' | 'prompt' | 'summary',
    options?: { style?: string; length?: 'short' | 'medium' | 'long' }
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await callAI<ForgeResult>('forge', {
        nodes,
        outputType,
        options,
      });

      if (response.success && response.result) {
        return response.result;
      } else {
        setError(response.error || 'Erreur de forge');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [nodes]);

  // Suggest connection labels between two nodes
  const suggestConnectionLabel = useCallback(async (fromNode: ImagineNode, toNode: ImagineNode) => {
    try {
      const response = await callAI<{ suggestions: Array<{
        label: string;
        type: string;
        confidence: number;
        explanation: string;
      }> }>('suggestConnectionLabel', { fromNode, toNode });

      if (response.success && response.result) {
        return response.result.suggestions || [];
      }
      return [{ label: 'lié à', type: 'semantic', confidence: 0.5, explanation: '' }];
    } catch {
      return [{ label: 'lié à', type: 'semantic', confidence: 0.5, explanation: '' }];
    }
  }, []);

  // Generate metadata for a node
  const generateNodeMetadata = useCallback(async (node: ImagineNode) => {
    try {
      const contextNodes = nodes.filter(n => n.id !== node.id).slice(0, 5);
      const response = await callAI<{
        tags: string[];
        keywords: string[];
        description: string;
        category?: string;
        importance: 'low' | 'medium' | 'high';
        relatedConcepts: string[];
      }>('generateMetadata', { node, contextNodes });

      if (response.success && response.result) {
        return response.result;
      }
      return null;
    } catch {
      return null;
    }
  }, [nodes]);

  // Analyze all canvas connections
  const analyzeCanvasConnections = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const existingEdges = edges.map(e => ({
        fromNodeId: e.fromNodeId,
        toNodeId: e.toNodeId,
      }));

      const response = await callAI<{ connections: Array<{
        fromNodeId: string;
        toNodeId: string;
        label: string;
        type: string;
        confidence: number;
        explanation: string;
      }> }>('analyzeConnections', { nodes, existingEdges });

      if (response.success && response.result) {
        // Create suggestions for each connection
        response.result.connections?.forEach(conn => {
          // Check if edge already exists
          const exists = edges.some(
            e => (e.fromNodeId === conn.fromNodeId && e.toNodeId === conn.toNodeId) ||
                 (e.fromNodeId === conn.toNodeId && e.toNodeId === conn.fromNodeId)
          );

          if (!exists) {
            const suggestion: AISuggestion = {
              id: generateId(),
              type: 'link',
              content: `${conn.label}: ${conn.explanation}`,
              confidence: conn.confidence,
              sourceNodeIds: [conn.fromNodeId],
              targetNodeId: conn.toNodeId,
              accepted: false,
            };
            addSuggestion(suggestion);
          }
        });

        return response.result.connections || [];
      } else {
        setError(response.error || 'Erreur d\'analyse');
        return [];
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [nodes, edges, addSuggestion]);

  return {
    isLoading,
    error,
    lastAnalysis,
    analyzeNodes,
    getSuggestionsForNode,
    suggestReconnections,
    suggestConnectionLabel,
    generateNodeMetadata,
    analyzeCanvasConnections,
    reformulate,
    chat,
    forge,
  };
}

// ========================================
// useAutoAnalyze Hook
// Analyse automatique quand les nœuds changent
// ========================================

export function useAutoAnalyze(debounceMs = 5000) {
  const { nodes } = useImagineStore();
  const { analyzeNodes, isLoading } = useAI();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastNodesCountRef = useRef(nodes.length);

  useEffect(() => {
    // Only trigger when new nodes are added
    if (nodes.length > lastNodesCountRef.current && nodes.length >= 2) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        if (!isLoading) {
          console.log('[useAutoAnalyze] Analyzing nodes...');
          analyzeNodes();
        }
      }, debounceMs);
    }

    lastNodesCountRef.current = nodes.length;

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [nodes.length, analyzeNodes, isLoading, debounceMs]);
}

export default useAI;
