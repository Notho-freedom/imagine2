'use client';

// ========================================
// IMAGINE - Welcome Screen
// Écran d'accueil enrichi avec constellation et sparks flottants
// ========================================

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Plus, Clock, Folder, Lightbulb, ArrowRight, Zap } from 'lucide-react';
import { useImagineStore } from '@/store';

interface WelcomeScreenProps {
  onStart: () => void;
}

// Spark flottant récupérable
interface FloatingSpark {
  id: string;
  x: number;
  y: number;
  content: string;
  color: string;
  size: number;
  delay: number;
}

// Étoile de constellation
interface ConstellationStar {
  id: string;
  x: number;
  y: number;
  size: number;
  brightness: number;
  connections: string[];
}

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const { setSparkInputOpen, addNode } = useImagineStore();
  const [floatingSparks, setFloatingSparks] = useState<FloatingSpark[]>([]);
  const [constellationStars, setConstellationStars] = useState<ConstellationStar[]>([]);
  const [capturedSpark, setCapturedSpark] = useState<FloatingSpark | null>(null);

  // Générer les sparks flottants
  useEffect(() => {
    const sparkIdeas = [
      'Et si on simplifiait tout ?',
      'Connexion inattendue...',
      'Nouvelle perspective',
      'À explorer plus tard',
      'Idée récurrente',
      'Pattern émergent',
    ];

    const colors = ['#4FD1C5', '#5B4B8A', '#C7A76C', '#1E3A5F'];
    
    const sparks: FloatingSpark[] = sparkIdeas.slice(0, 4).map((content, i) => ({
      id: `spark-${i}`,
      x: 15 + Math.random() * 70,
      y: 20 + Math.random() * 60,
      content,
      color: colors[i % colors.length],
      size: 40 + Math.random() * 20,
      delay: i * 2,
    }));

    setFloatingSparks(sparks);
  }, []);

  // Générer la constellation
  useEffect(() => {
    const stars: ConstellationStar[] = [];
    const starCount = 15;

    for (let i = 0; i < starCount; i++) {
      stars.push({
        id: `star-${i}`,
        x: 5 + Math.random() * 90,
        y: 5 + Math.random() * 90,
        size: 1 + Math.random() * 3,
        brightness: 0.3 + Math.random() * 0.7,
        connections: [],
      });
    }

    // Créer des connexions entre étoiles proches
    stars.forEach((star, i) => {
      stars.forEach((other, j) => {
        if (i !== j) {
          const dx = star.x - other.x;
          const dy = star.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 25 && star.connections.length < 2) {
            star.connections.push(other.id);
          }
        }
      });
    });

    setConstellationStars(stars);
  }, []);

  const handleCreateSpark = () => {
    setSparkInputOpen(true);
    onStart();
  };

  const handleCaptureSpark = useCallback((spark: FloatingSpark) => {
    setCapturedSpark(spark);
    
    // Créer un nœud avec le contenu du spark
    addNode({
      type: 'text',
      position: { x: 400, y: 300 },
      content: spark.content,
    } as any);

    // Animation puis démarrer
    setTimeout(() => {
      onStart();
    }, 600);
  }, [addNode, onStart]);

  // Mock recent projects
  const recentProjects = [
    { id: '1', name: 'Stratégie Produit Q1', updatedAt: 'Il y a 2h', nodeCount: 12 },
    { id: '2', name: 'Architecture Nexus', updatedAt: 'Hier', nodeCount: 28 },
    { id: '3', name: 'Pitch Investisseurs', updatedAt: 'Il y a 3 jours', nodeCount: 8 },
  ];

  return (
    <div className="fixed inset-0 bg-imagine-bg overflow-hidden">
      {/* Constellation animée */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <filter id="star-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Lignes de constellation */}
        {constellationStars.map(star => 
          star.connections.map(connId => {
            const other = constellationStars.find(s => s.id === connId);
            if (!other) return null;
            return (
              <motion.line
                key={`${star.id}-${connId}`}
                x1={`${star.x}%`}
                y1={`${star.y}%`}
                x2={`${other.x}%`}
                y2={`${other.y}%`}
                stroke="#4FD1C5"
                strokeWidth="0.5"
                strokeOpacity={0.15}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ 
                  pathLength: 1, 
                  opacity: [0.1, 0.2, 0.1],
                }}
                transition={{
                  pathLength: { duration: 2, delay: Math.random() * 2 },
                  opacity: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
                }}
              />
            );
          })
        )}

        {/* Étoiles */}
        {constellationStars.map((star, index) => (
          <motion.circle
            key={star.id}
            cx={`${star.x}%`}
            cy={`${star.y}%`}
            r={star.size}
            fill="#E6EDF3"
            filter="url(#star-glow)"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [star.brightness * 0.5, star.brightness, star.brightness * 0.5],
              scale: 1,
            }}
            transition={{
              opacity: { 
                duration: 2 + Math.random() * 3, 
                repeat: Infinity, 
                ease: 'easeInOut',
                delay: index * 0.1,
              },
              scale: { duration: 0.5, delay: index * 0.05 },
            }}
          />
        ))}
      </svg>

      {/* Sparks flottants récupérables */}
      <AnimatePresence>
        {floatingSparks.map(spark => (
          <motion.button
            key={spark.id}
            className="absolute group cursor-pointer"
            style={{ left: `${spark.x}%`, top: `${spark.y}%` }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: capturedSpark?.id === spark.id ? 0 : 1,
              scale: capturedSpark?.id === spark.id ? 2 : 1,
              x: [0, 10, -10, 0],
              y: [0, -15, 5, 0],
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{
              opacity: { duration: 0.3 },
              scale: { duration: 0.3 },
              x: { duration: 8 + spark.delay, repeat: Infinity, ease: 'easeInOut' },
              y: { duration: 6 + spark.delay, repeat: Infinity, ease: 'easeInOut' },
            }}
            onClick={() => handleCaptureSpark(spark)}
            whileHover={{ scale: 1.2 }}
            title={spark.content}
          >
            {/* Halo */}
            <motion.div
              className="absolute inset-0 rounded-full blur-xl"
              style={{ 
                backgroundColor: spark.color,
                width: spark.size * 2,
                height: spark.size * 2,
                left: -spark.size / 2,
                top: -spark.size / 2,
              }}
              animate={{ opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            
            {/* Icône */}
            <div 
              className="relative flex items-center justify-center rounded-full border border-white/20 backdrop-blur-sm transition-all group-hover:border-white/40"
              style={{ 
                width: spark.size,
                height: spark.size,
                backgroundColor: `${spark.color}20`,
              }}
            >
              <Lightbulb 
                className="w-4 h-4 transition-transform group-hover:scale-110" 
                style={{ color: spark.color }}
              />
            </div>

            {/* Tooltip au hover */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="px-3 py-1.5 rounded-lg bg-imagine-bg-elevated border border-white/10 text-xs text-imagine-text whitespace-nowrap shadow-lg">
                {spark.content}
              </div>
            </div>
          </motion.button>
        ))}
      </AnimatePresence>

      {/* Nebula background amélioré */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-br from-imagine-nebula/30 via-imagine-intuition/10 to-transparent blur-3xl"
        animate={{
          x: [0, 80, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1],
          rotate: [0, 10, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ top: '-10%', left: '10%' }}
      />
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-br from-imagine-projection/20 via-transparent to-imagine-intuition/10 blur-3xl"
        animate={{
          x: [0, -60, 0],
          y: [0, 60, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ bottom: '5%', right: '5%' }}
      />

      {/* Contenu principal */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center max-w-2xl mx-auto"
        >
          {/* Logo animé */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <motion.div 
              className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-imagine-projection via-imagine-intuition to-imagine-nebula mb-4 relative"
              animate={{
                boxShadow: [
                  '0 0 20px rgba(79, 209, 197, 0.3)',
                  '0 0 40px rgba(79, 209, 197, 0.5)',
                  '0 0 20px rgba(79, 209, 197, 0.3)',
                ],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Sparkles className="w-12 h-12 text-white" />
              
              {/* Particules autour du logo */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full bg-imagine-projection"
                  animate={{
                    x: [0, Math.cos(i * 60 * Math.PI / 180) * 50],
                    y: [0, Math.sin(i * 60 * Math.PI / 180) * 50],
                    opacity: [0.8, 0],
                    scale: [1, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: 'easeOut',
                  }}
                />
              ))}
            </motion.div>
            
            <h1 className="text-5xl font-bold text-imagine-text mb-2 tracking-tight">
              IMAGINE
            </h1>
            <p className="text-lg text-imagine-text-muted">
              IDE de la pensée augmentée
            </p>
          </motion.div>

          {/* CTA Principal */}
          <motion.button
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCreateSpark}
            className="group relative inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-imagine-projection to-imagine-projection-light text-imagine-bg font-semibold text-lg transition-all mb-6"
          >
            <Zap className="w-5 h-5" />
            <span>Créer un Spark</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            
            {/* Effet de lueur */}
            <motion.div 
              className="absolute inset-0 rounded-2xl bg-imagine-projection opacity-0 blur-2xl -z-10"
              animate={{ opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.button>

          {/* CTA Secondaire - Explorer */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={onStart}
            className="block mx-auto text-sm text-imagine-text-muted hover:text-imagine-projection transition-colors mb-12"
          >
            ou explorer une idée passée →
          </motion.button>

          {/* Projets récents enrichis */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-left bg-imagine-bg-elevated/30 backdrop-blur-sm rounded-2xl p-6 border border-white/5"
          >
            <div className="flex items-center gap-2 text-imagine-text-muted text-sm mb-4">
              <Clock className="w-4 h-4" />
              <span>Récents</span>
            </div>

            <div className="space-y-2">
              {recentProjects.map((project, index) => (
                <motion.button
                  key={project.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
                  whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.05)' }}
                  onClick={onStart}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-imagine-nebula/30 to-imagine-intuition/20 flex items-center justify-center">
                    <Folder className="w-4 h-4 text-imagine-projection" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-imagine-text truncate group-hover:text-imagine-projection transition-colors">
                      {project.name}
                    </p>
                    <p className="text-xs text-imagine-text-subtle">
                      {project.updatedAt} · {project.nodeCount} nœuds
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-imagine-text-subtle opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Hint sparks */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.2 }}
            className="mt-8 text-xs text-imagine-text-subtle flex items-center justify-center gap-2"
          >
            <Lightbulb className="w-3 h-3" />
            <span>Cliquez sur les sparks flottants pour capturer une idée</span>
          </motion.p>

          {/* Keyboard shortcut */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.4 }}
            className="mt-4 text-sm text-imagine-text-subtle"
          >
            <kbd className="px-2 py-1 rounded bg-imagine-bg-elevated text-imagine-text-muted text-xs border border-white/10">
              ⌘N
            </kbd>{' '}
            pour démarrer rapidement
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
