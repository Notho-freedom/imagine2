'use client';

// ========================================
// IMAGINE - Cognitive Sidebar
// Panneau latéral intelligent - Cognitive Richness
// ========================================

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  Settings,
  Wand2,
  FileText,
  GitBranch,
  Star,
  TrendingUp,
  Zap,
  Target,
  Brain,
  ArrowRight,
  CheckCircle2,
  Circle,
  Loader2,
  Eye,
  Network,
  RefreshCw,
  Lightbulb,
  Flame,
  Link2,
  Unlink,
} from 'lucide-react';
import { useImagineStore } from '@/store';
import { useAI } from '@/hooks';
import { cn } from '@/lib/utils';
import SettingsModal from './Settings';

// ========================================
// Types
// ========================================

interface NodeMaturity {
  level: 'nascent' | 'growing' | 'mature' | 'key';
  progress: number;
  label: string;
  color: string;
  bgColor: string;
}

interface ConnectionStrength {
  strong: number;
  weak: number;
  potential: number;
}

// ========================================
// Helper Functions
// ========================================

function calculateNodeMaturity(node: any, edges: any[]): NodeMaturity {
  if (!node || node.type !== 'text') {
    return { 
      level: 'nascent', 
      progress: 0, 
      label: 'Nouveau', 
      color: 'text-imagine-text-subtle',
      bgColor: 'bg-imagine-text-subtle'
    };
  }

  const content = node.content || '';
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const connectionCount = edges.filter(
    e => e.fromNodeId === node.id || e.toNodeId === node.id
  ).length;
  const age = Date.now() - new Date(node.metadata.createdAt).getTime();
  const ageHours = age / (1000 * 60 * 60);

  // Calculate progress
  let progress = 0;
  progress += Math.min(wordCount / 100, 0.4) * 100;
  progress += Math.min(connectionCount / 5, 0.3) * 100;
  progress += Math.min(ageHours / 48, 0.3) * 100;

  if (node.isKey) {
    return { 
      level: 'key', 
      progress: 100, 
      label: 'Idée clé', 
      color: 'text-imagine-mature',
      bgColor: 'bg-imagine-mature'
    };
  }
  if (progress >= 70) {
    return { 
      level: 'mature', 
      progress, 
      label: 'Mature', 
      color: 'text-imagine-coherence',
      bgColor: 'bg-imagine-coherence'
    };
  }
  if (progress >= 35) {
    return { 
      level: 'growing', 
      progress, 
      label: 'En développement', 
      color: 'text-imagine-nebula',
      bgColor: 'bg-imagine-nebula'
    };
  }
  return { 
    level: 'nascent', 
    progress, 
    label: 'Naissante', 
    color: 'text-imagine-text-subtle',
    bgColor: 'bg-imagine-text-subtle'
  };
}

function calculateConnectionStrength(nodeId: string, edges: any[]): ConnectionStrength {
  const nodeEdges = edges.filter(e => e.fromNodeId === nodeId || e.toNodeId === nodeId);
  
  return {
    strong: nodeEdges.filter(e => (e.weight || 0.5) > 0.7).length,
    weak: nodeEdges.filter(e => (e.weight || 0.5) <= 0.3).length,
    potential: Math.max(0, 3 - nodeEdges.length),
  };
}

// ========================================
// Main Component
// ========================================

export default function Sidebar() {
  const {
    ui,
    nodes,
    edges,
    canvas,
    suggestions,
    toggleSidebar,
    setSidebarContent,
    getNode,
    acceptSuggestion,
    dismissSuggestion,
  } = useImagineStore();

  const { analyzeNodes, suggestReconnections, analyzeCanvasConnections, isLoading: isAILoading, error: aiError } = useAI();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const selectedNodes = canvas.selectedNodeIds.map(id => getNode(id)).filter(Boolean);
  const selectedNode = selectedNodes[0];
  
  // Calculate cognitive metrics
  const maturity = useMemo(() => 
    selectedNode ? calculateNodeMaturity(selectedNode, edges) : null, 
    [selectedNode, edges]
  );
  
  const connectionStrength = useMemo(() =>
    selectedNode ? calculateConnectionStrength(selectedNode.id, edges) : null,
    [selectedNode, edges]
  );

  // Global project insights
  const projectInsights = useMemo(() => {
    const totalNodes = nodes.length;
    const totalEdges = edges.length;
    const avgConnections = totalNodes > 0 ? totalEdges / totalNodes : 0;
    const isolatedNodes = nodes.filter(n => 
      !edges.some(e => e.fromNodeId === n.id || e.toNodeId === n.id)
    ).length;
    
    return {
      totalNodes,
      totalEdges,
      avgConnections: avgConnections.toFixed(1),
      isolatedNodes,
      density: totalNodes > 1 ? ((2 * totalEdges) / (totalNodes * (totalNodes - 1)) * 100).toFixed(0) : 0,
    };
  }, [nodes, edges]);

  return (
    <AnimatePresence>
      {ui.sidebarOpen && (
        <motion.aside
          initial={{ opacity: 0, x: -320 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -320 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed left-0 top-0 bottom-0 w-80 z-40 flex flex-col"
        >
          {/* Glass background with subtle gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-imagine-bg-elevated/98 to-imagine-bg/98 backdrop-blur-2xl border-r border-white/5" />
          
          {/* Subtle animated glow */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-imagine-projection/5 to-transparent pointer-events-none" />

          {/* Content */}
          <div className="relative flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-imagine-projection via-imagine-intuition to-imagine-nebula flex items-center justify-center shadow-lg">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="font-semibold text-imagine-text block">IMAGINE</span>
                  <span className="text-[10px] text-imagine-text-subtle">Pensée augmentée</span>
                </div>
              </div>
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-white/10 text-imagine-text-muted hover:text-imagine-text transition-colors"
                title="Fermer"
                aria-label="Fermer le panneau"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation tabs */}
            <div className="flex items-center gap-1 px-4 py-3 border-b border-white/5">
              <SidebarTab
                icon={Eye}
                label="Insight"
                active={ui.sidebarContent === 'properties'}
                onClick={() => setSidebarContent('properties')}
              />
              <SidebarTab
                icon={Sparkles}
                label="IA"
                active={ui.sidebarContent === 'ai'}
                onClick={() => setSidebarContent('ai')}
                badge={suggestions.filter(s => !s.accepted).length}
              />
              <SidebarTab
                icon={Network}
                label="Réseau"
                active={ui.sidebarContent === 'history'}
                onClick={() => setSidebarContent('history')}
              />
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {/* Insight panel (formerly Properties) */}
              {ui.sidebarContent === 'properties' && (
                <div className="p-4 space-y-5">
                  {selectedNode ? (
                    <>
                      {/* Node identity */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-semibold text-imagine-text-muted uppercase tracking-wider">
                            Nœud sélectionné
                          </h3>
                          <span className={cn(
                            'text-[10px] px-2 py-0.5 rounded-full',
                            maturity?.bgColor,
                            'text-white'
                          )}>
                            {maturity?.label}
                          </span>
                        </div>
                        
                        {/* Maturity progress bar */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-imagine-text-muted">Maturité</span>
                            <span className="text-imagine-text font-medium">{Math.round(maturity?.progress || 0)}%</span>
                          </div>
                          <div className="h-2 bg-imagine-bg rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${maturity?.progress || 0}%` }}
                              transition={{ duration: 0.5, ease: 'easeOut' }}
                              className={cn('h-full rounded-full', maturity?.bgColor)}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-imagine-text-subtle">
                            <span>Naissante</span>
                            <span>Clé</span>
                          </div>
                        </div>
                      </div>

                      {/* Connection strength visualization */}
                      {connectionStrength && (
                        <div className="p-4 rounded-xl bg-imagine-bg/50 border border-white/5 space-y-3">
                          <h4 className="text-xs font-medium text-imagine-text flex items-center gap-2">
                            <GitBranch className="w-3.5 h-3.5 text-imagine-intuition" />
                            Connexions
                          </h4>
                          
                          <div className="grid grid-cols-3 gap-2">
                            <ConnectionIndicator 
                              icon={Zap} 
                              label="Fortes" 
                              count={connectionStrength.strong}
                              color="text-imagine-coherence"
                            />
                            <ConnectionIndicator 
                              icon={Circle} 
                              label="Faibles" 
                              count={connectionStrength.weak}
                              color="text-imagine-text-subtle"
                            />
                            <ConnectionIndicator 
                              icon={Target} 
                              label="Potentielles" 
                              count={connectionStrength.potential}
                              color="text-imagine-projection"
                            />
                          </div>
                        </div>
                      )}

                      {/* Node metadata */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium text-imagine-text-muted">Détails</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2 rounded-lg bg-imagine-bg/30">
                            <span className="text-imagine-text-subtle block text-[10px]">Type</span>
                            <span className="text-imagine-text capitalize">{selectedNode.type}</span>
                          </div>
                          <div className="p-2 rounded-lg bg-imagine-bg/30">
                            <span className="text-imagine-text-subtle block text-[10px]">Position</span>
                            <span className="text-imagine-text font-mono text-[10px]">
                              {Math.round(selectedNode.position.x)}, {Math.round(selectedNode.position.y)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Connected nodes with visual hierarchy */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-medium text-imagine-text-muted">Idées liées</h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {edges
                            .filter(e => e.fromNodeId === selectedNode.id || e.toNodeId === selectedNode.id)
                            .slice(0, 5)
                            .map(edge => {
                              const connectedId = edge.fromNodeId === selectedNode.id 
                                ? edge.toNodeId 
                                : edge.fromNodeId;
                              const connectedNode = getNode(connectedId);
                              const isStrong = (edge.weight || 0.5) > 0.7;
                              return (
                                <motion.div
                                  key={edge.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className={cn(
                                    'flex items-center gap-2 p-2 rounded-lg text-xs transition-colors cursor-pointer',
                                    'bg-imagine-bg/30 hover:bg-imagine-bg/50',
                                    isStrong && 'border-l-2 border-imagine-coherence'
                                  )}
                                >
                                  <ArrowRight className={cn(
                                    'w-3 h-3',
                                    isStrong ? 'text-imagine-coherence' : 'text-imagine-text-subtle'
                                  )} />
                                  <span className="text-imagine-text truncate flex-1">
                                    {connectedNode?.type === 'text' 
                                      ? (connectedNode as any).content?.slice(0, 40) || 'Sans contenu'
                                      : connectedNode?.type}
                                  </span>
                                </motion.div>
                              );
                            })}
                          {edges.filter(e => e.fromNodeId === selectedNode.id || e.toNodeId === selectedNode.id).length === 0 && (
                            <p className="text-xs text-imagine-text-subtle italic py-2">
                              Aucune connexion — créez des liens
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    // Global project insights when nothing selected
                    <div className="space-y-5">
                      <div className="text-center py-4">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-imagine-nebula/20 to-imagine-projection/20 flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-imagine-projection" />
                        </div>
                        <p className="text-sm font-medium text-imagine-text">Vue d&apos;ensemble</p>
                        <p className="text-xs text-imagine-text-muted mt-1">
                          Sélectionnez un nœud pour les détails
                        </p>
                      </div>

                      {/* Project stats grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <StatCard 
                          icon={FileText} 
                          label="Idées" 
                          value={projectInsights.totalNodes}
                          trend={projectInsights.totalNodes > 5 ? 'up' : null}
                        />
                        <StatCard 
                          icon={GitBranch} 
                          label="Liens" 
                          value={projectInsights.totalEdges}
                        />
                        <StatCard 
                          icon={Network} 
                          label="Densité" 
                          value={`${projectInsights.density}%`}
                          subtitle="du réseau"
                        />
                        <StatCard 
                          icon={Circle} 
                          label="Isolées" 
                          value={projectInsights.isolatedNodes}
                          alert={projectInsights.isolatedNodes > 2}
                        />
                      </div>

                      {/* Quick insights */}
                      {projectInsights.isolatedNodes > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 rounded-xl bg-imagine-spark/10 border border-imagine-spark/20"
                        >
                          <div className="flex items-start gap-2">
                            <Flame className="w-4 h-4 text-imagine-spark mt-0.5" />
                            <div>
                              <p className="text-xs text-imagine-text">
                                {projectInsights.isolatedNodes} idée{projectInsights.isolatedNodes > 1 ? 's' : ''} sans connexion
                              </p>
                              <p className="text-[10px] text-imagine-text-muted mt-0.5">
                                Créez des liens pour enrichir votre réflexion
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* AI panel */}
              {ui.sidebarContent === 'ai' && (
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-imagine-projection">
                      <Wand2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Assistant IA</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-imagine-text-subtle px-2 py-0.5 rounded-full bg-imagine-projection/10">
                        Groq
                      </span>
                      <button
                        onClick={() => analyzeCanvasConnections()}
                        disabled={isAILoading || nodes.length < 2}
                        className={cn(
                          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                          isAILoading 
                            ? 'bg-white/5 text-imagine-text-subtle cursor-wait'
                            : 'bg-imagine-intuition/20 text-imagine-intuition hover:bg-imagine-intuition/30 hover:scale-105'
                        )}
                        title="Analyser et suggérer des connexions"
                        aria-label="Analyser les connexions potentielles"
                      >
                        {isAILoading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Network className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        onClick={() => suggestReconnections()}
                        disabled={isAILoading || nodes.length < 2}
                        className={cn(
                          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                          isAILoading 
                            ? 'bg-white/5 text-imagine-text-subtle cursor-wait'
                            : 'bg-imagine-coherence/20 text-imagine-coherence hover:bg-imagine-coherence/30 hover:scale-105'
                        )}
                        title="Reconnecter les nœuds isolés"
                        aria-label="Reconnecter les nœuds isolés"
                      >
                        {isAILoading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Link2 className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        onClick={() => analyzeNodes()}
                        disabled={isAILoading || nodes.length === 0}
                        className={cn(
                          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                          isAILoading 
                            ? 'bg-white/5 text-imagine-text-subtle cursor-wait'
                            : 'bg-imagine-projection/20 text-imagine-projection hover:bg-imagine-projection/30 hover:scale-105'
                        )}
                        title="Analyser les idées"
                        aria-label="Analyser les idées avec l&apos;IA"
                      >
                        {isAILoading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* AI Error */}
                  {aiError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400"
                    >
                      {aiError}
                    </motion.div>
                  )}

                  {/* AI Suggestions */}
                  <div className="space-y-3">
                    {suggestions.filter(s => !s.accepted).length > 0 ? (
                      suggestions.filter(s => !s.accepted).map((suggestion, index) => (
                        <motion.div
                          key={suggestion.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-4 rounded-xl bg-gradient-to-br from-imagine-projection/10 to-transparent border border-imagine-projection/20 hover:border-imagine-projection/40 transition-colors"
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-imagine-projection/20 flex items-center justify-center flex-shrink-0">
                              <SuggestionTypeIcon type={suggestion.type} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-imagine-text leading-relaxed">
                                {suggestion.content}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <ConfidenceBar confidence={suggestion.confidence} />
                                <span className="text-[10px] text-imagine-text-muted">
                                  {Math.round(suggestion.confidence * 100)}%
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => acceptSuggestion(suggestion.id)}
                              className="flex-1 py-2 rounded-lg text-xs font-medium bg-imagine-projection text-imagine-bg hover:bg-imagine-projection/90 transition-all hover:scale-[1.02] flex items-center justify-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Accepter
                            </button>
                            <button
                              onClick={() => dismissSuggestion(suggestion.id)}
                              className="flex-1 py-2 rounded-lg text-xs font-medium bg-white/5 text-imagine-text-muted hover:bg-white/10 transition-colors"
                            >
                              Ignorer
                            </button>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-imagine-projection/10 to-imagine-intuition/10 flex items-center justify-center">
                          <Sparkles className="w-7 h-7 text-imagine-projection animate-pulse" />
                        </div>
                        <p className="text-sm text-imagine-text-muted mb-1">
                          Pas de suggestions
                        </p>
                        <p className="text-xs text-imagine-text-subtle max-w-[200px] mx-auto">
                          L&apos;IA analyse vos idées et proposera des connexions intelligentes
                        </p>
                        {nodes.length > 0 && (
                          <button
                            onClick={() => analyzeNodes()}
                            disabled={isAILoading}
                            className="mt-4 px-4 py-2 rounded-lg text-xs font-medium bg-imagine-projection/20 text-imagine-projection hover:bg-imagine-projection/30 transition-colors"
                          >
                            Lancer une analyse
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Network panel (formerly History) */}
              {ui.sidebarContent === 'history' && (
                <div className="p-4 space-y-4">
                  <div className="flex items-center gap-2 text-imagine-intuition">
                    <Network className="w-4 h-4" />
                    <span className="text-sm font-medium">Réseau d&apos;idées</span>
                  </div>

                  {/* Network visualization placeholder */}
                  <div className="aspect-square rounded-xl bg-imagine-bg/50 border border-white/5 flex items-center justify-center relative overflow-hidden">
                    {/* Mini network preview */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      {nodes.length > 0 ? (
                        <svg className="w-full h-full p-4" viewBox="0 0 100 100">
                          {/* Draw edges */}
                          {edges.slice(0, 10).map((edge) => {
                            const from = nodes.find(n => n.id === edge.fromNodeId);
                            const to = nodes.find(n => n.id === edge.toNodeId);
                            if (!from || !to) return null;
                            const x1 = (from.position.x % 80) + 10;
                            const y1 = (from.position.y % 80) + 10;
                            const x2 = (to.position.x % 80) + 10;
                            const y2 = (to.position.y % 80) + 10;
                            return (
                              <line
                                key={edge.id}
                                x1={x1}
                                y1={y1}
                                x2={x2}
                                y2={y2}
                                stroke="rgba(91, 75, 138, 0.4)"
                                strokeWidth="0.5"
                              />
                            );
                          })}
                          {/* Draw nodes */}
                          {nodes.slice(0, 15).map((node) => {
                            const x = (node.position.x % 80) + 10;
                            const y = (node.position.y % 80) + 10;
                            const isSelected = canvas.selectedNodeIds.includes(node.id);
                            return (
                              <circle
                                key={node.id}
                                cx={x}
                                cy={y}
                                r={isSelected ? 4 : 2.5}
                                fill={isSelected ? '#4FD1C5' : '#5B4B8A'}
                                opacity={0.8}
                              />
                            );
                          })}
                        </svg>
                      ) : (
                        <p className="text-xs text-imagine-text-subtle">Aucune idée</p>
                      )}
                    </div>
                  </div>

                  {/* Network stats */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-imagine-bg/30">
                      <span className="text-imagine-text-muted">Connectivité moyenne</span>
                      <span className="text-imagine-text font-medium">{projectInsights.avgConnections}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-imagine-bg/30">
                      <span className="text-imagine-text-muted">Densité du réseau</span>
                      <span className="text-imagine-text font-medium">{projectInsights.density}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-imagine-bg/30">
                      <span className="text-imagine-text-muted">Nœuds isolés</span>
                      <span className={cn(
                        'font-medium',
                        projectInsights.isolatedNodes > 0 ? 'text-imagine-spark' : 'text-imagine-text'
                      )}>
                        {projectInsights.isolatedNodes}
                      </span>
                    </div>
                  </div>

                  {/* Network health indicator */}
                  <div className="p-3 rounded-xl bg-gradient-to-br from-imagine-intuition/10 to-transparent border border-imagine-intuition/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-4 h-4 text-imagine-intuition" />
                      <span className="text-xs font-medium text-imagine-text">Santé du réseau</span>
                    </div>
                    <NetworkHealthBar nodes={nodes.length} edges={edges.length} isolated={projectInsights.isolatedNodes} />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-white/5 bg-imagine-bg/30">
              <button 
                onClick={() => setSettingsOpen(true)}
                className="flex items-center gap-2 w-full p-2.5 rounded-xl text-sm text-imagine-text-muted hover:text-imagine-text hover:bg-white/5 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Paramètres</span>
              </button>
            </div>
          </div>

          {/* Settings Modal */}
          <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

// ========================================
// Sub-components
// ========================================

interface SidebarTabProps {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}

function SidebarTab({ icon: Icon, label, active, onClick, badge }: SidebarTabProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all',
        active
          ? 'bg-white/10 text-imagine-text'
          : 'text-imagine-text-muted hover:text-imagine-text hover:bg-white/5'
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
      {badge && badge > 0 && (
        <motion.span 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-imagine-projection text-[10px] text-imagine-bg flex items-center justify-center font-semibold"
        >
          {badge}
        </motion.span>
      )}
    </button>
  );
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number | string;
  subtitle?: string;
  trend?: 'up' | 'down' | null;
  alert?: boolean;
}

function StatCard({ icon: Icon, label, value, subtitle, trend, alert }: StatCardProps) {
  return (
    <div className={cn(
      'p-3 rounded-xl bg-imagine-bg/30 border border-white/5 transition-all hover:bg-imagine-bg/40',
      alert && 'border-imagine-spark/30 bg-imagine-spark/5'
    )}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn(
          'w-3.5 h-3.5',
          alert ? 'text-imagine-spark' : 'text-imagine-text-subtle'
        )} />
        <span className="text-xs text-imagine-text-muted">{label}</span>
        {trend === 'up' && <TrendingUp className="w-3 h-3 text-imagine-coherence ml-auto" />}
      </div>
      <p className="text-xl font-semibold text-imagine-text">{value}</p>
      {subtitle && <p className="text-[10px] text-imagine-text-subtle">{subtitle}</p>}
    </div>
  );
}

function ConnectionIndicator({ 
  icon: Icon, 
  label, 
  count, 
  color 
}: { 
  icon: React.ElementType; 
  label: string; 
  count: number;
  color: string;
}) {
  return (
    <div className="text-center">
      <div className={cn('w-8 h-8 mx-auto rounded-lg bg-white/5 flex items-center justify-center mb-1', color)}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-lg font-semibold text-imagine-text">{count}</p>
      <p className="text-[10px] text-imagine-text-subtle">{label}</p>
    </div>
  );
}

function SuggestionTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'reformulation':
      return <Wand2 className="w-4 h-4 text-imagine-projection" />;
    case 'expansion':
      return <TrendingUp className="w-4 h-4 text-imagine-coherence" />;
    case 'theme':
      return <Star className="w-4 h-4 text-imagine-mature" />;
    case 'fork':
      return <GitBranch className="w-4 h-4 text-imagine-intuition" />;
    case 'reconnect':
      return <Link2 className="w-4 h-4 text-imagine-coherence" />;
    case 'link':
      return <Network className="w-4 h-4 text-imagine-nebula" />;
    default:
      return <Lightbulb className="w-4 h-4 text-imagine-projection" />;
  }
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  return (
    <div className="flex-1 h-1.5 bg-imagine-bg rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${confidence * 100}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="h-full bg-gradient-to-r from-imagine-projection to-imagine-coherence rounded-full"
      />
    </div>
  );
}

function NetworkHealthBar({ nodes, edges, isolated }: { nodes: number; edges: number; isolated: number }) {
  // Calculate network health score (0-100)
  let health = 0;
  if (nodes > 0) {
    const connectivity = edges / nodes;
    const isolationPenalty = (isolated / nodes) * 50;
    health = Math.min(100, Math.max(0, connectivity * 30 + (nodes > 0 ? 20 : 0) - isolationPenalty + 30));
  }
  
  const getHealthColor = () => {
    if (health >= 70) return 'bg-imagine-coherence';
    if (health >= 40) return 'bg-imagine-mature';
    return 'bg-red-500';
  };
  
  const getHealthLabel = () => {
    if (nodes === 0) return 'Vide';
    if (health >= 70) return 'Excellent';
    if (health >= 40) return 'Bon';
    return 'À développer';
  };

  return (
    <div className="space-y-1.5">
      <div className="h-2 bg-imagine-bg rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${health}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={cn('h-full rounded-full', getHealthColor())}
        />
      </div>
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-imagine-text-subtle">{getHealthLabel()}</span>
        <span className="text-imagine-text-muted">{Math.round(health)}%</span>
      </div>
    </div>
  );
}
