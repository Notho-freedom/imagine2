'use client';

// ========================================
// IMAGINE - Cognitive Background
// Fond dynamique intelligent qui réagit à la pensée
// ========================================

import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { useImagineStore } from '@/store';

// ========================================
// Types
// ========================================

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
  hue: number;
}

interface FieldLine {
  points: Array<{ x: number; y: number }>;
  opacity: number;
  width: number;
}

interface Props {
  nodes?: any[]; // Optional - will use store if not provided
  width?: number;
  height?: number;
  intensity?: number; // 0-1, based on cognitive activity
}

// ========================================
// Cognitive Background Component
// ========================================

export default function CognitiveBackground({ nodes: propNodes, width, height, intensity = 0.5 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);
  const fieldLinesRef = useRef<FieldLine[]>([]);
  const timeRef = useRef(0);
  const [dimensions, setDimensions] = React.useState({ width: width || 1920, height: height || 1080 });
  
  const { nodes: storeNodes, canvas } = useImagineStore();
  const nodes = propNodes || storeNodes;
  
  // Update dimensions on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
  const canvasWidth = width || dimensions.width;
  const canvasHeight = height || dimensions.height;
  
  // Calculate cognitive intensity based on nodes
  const cognitiveIntensity = useMemo(() => {
    if (nodes.length === 0) return 0.2;
    const activeNodes = nodes.filter(n => {
      const timeSinceUpdate = Date.now() - new Date(n.metadata.updatedAt).getTime();
      return timeSinceUpdate < 60000; // Active in last minute
    });
    return Math.min(0.3 + (activeNodes.length * 0.1) + (nodes.length * 0.02), 1);
  }, [nodes]);

  // Node positions for field attraction
  const nodePositions = useMemo(() => {
    return nodes.map(n => ({
      x: n.position.x + 150, // Center of node
      y: n.position.y + 50,
      strength: n.type === 'text' ? 1 : 0.5,
    }));
  }, [nodes]);

  // Initialize particles
  const initParticles = useCallback((count: number) => {
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvasWidth,
        y: Math.random() * canvasHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.3 + 0.1,
        life: Math.random() * 1000,
        maxLife: 800 + Math.random() * 400,
        hue: 180 + Math.random() * 40, // Cyan-ish
      });
    }
    return particles;
  }, [canvasWidth, canvasHeight]);

  // Generate field lines
  const generateFieldLines = useCallback(() => {
    if (nodePositions.length < 2) return [];
    
    const lines: FieldLine[] = [];
    const numLines = Math.min(nodePositions.length * 3, 15);
    
    for (let i = 0; i < numLines; i++) {
      const startNode = nodePositions[Math.floor(Math.random() * nodePositions.length)];
      const points: Array<{ x: number; y: number }> = [];
      
      let x = startNode.x + (Math.random() - 0.5) * 200;
      let y = startNode.y + (Math.random() - 0.5) * 200;
      
      for (let j = 0; j < 50; j++) {
        points.push({ x, y });
        
        // Calculate field direction from nearby nodes
        let fx = 0, fy = 0;
        nodePositions.forEach(node => {
          const dx = node.x - x;
          const dy = node.y - y;
          const dist = Math.sqrt(dx * dx + dy * dy) + 1;
          const force = node.strength / (dist * 0.1);
          fx += (dx / dist) * force;
          fy += (dy / dist) * force;
        });
        
        // Add some noise
        fx += (Math.random() - 0.5) * 0.5;
        fy += (Math.random() - 0.5) * 0.5;
        
        const mag = Math.sqrt(fx * fx + fy * fy) || 1;
        x += (fx / mag) * 15;
        y += (fy / mag) * 15;
        
        // Stop if out of bounds
        if (x < -100 || x > canvasWidth + 100 || y < -100 || y > canvasHeight + 100) break;
      }
      
      if (points.length > 5) {
        lines.push({
          points,
          opacity: 0.03 + Math.random() * 0.04,
          width: 0.5 + Math.random() * 1,
        });
      }
    }
    
    return lines;
  }, [nodePositions, canvasWidth, canvasHeight]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Initialize
    const particleCount = Math.floor(30 + cognitiveIntensity * 50);
    particlesRef.current = initParticles(particleCount);
    fieldLinesRef.current = generateFieldLines();
    
    const animate = () => {
      timeRef.current += 1;
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      
      // Draw subtle noise texture
      drawNoise(ctx, canvasWidth, canvasHeight, timeRef.current);
      
      // Draw field lines
      drawFieldLines(ctx, fieldLinesRef.current, timeRef.current);
      
      // Update and draw particles
      updateParticles(particlesRef.current, nodePositions, canvasWidth, canvasHeight);
      drawParticles(ctx, particlesRef.current, cognitiveIntensity);
      
      // Regenerate field lines occasionally
      if (timeRef.current % 300 === 0) {
        fieldLinesRef.current = generateFieldLines();
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [canvasWidth, canvasHeight, cognitiveIntensity, nodePositions, initParticles, generateFieldLines]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  );
}

// ========================================
// Drawing Functions
// ========================================

function drawNoise(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number
) {
  const imageData = ctx.createImageData(width / 4, height / 4);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const noise = Math.random() * 8;
    data[i] = noise;     // R
    data[i + 1] = noise; // G
    data[i + 2] = noise + 5; // B (slight blue tint)
    data[i + 3] = 15;    // A (very subtle)
  }
  
  ctx.save();
  ctx.scale(4, 4);
  ctx.putImageData(imageData, 0, 0);
  ctx.restore();
}

function drawFieldLines(
  ctx: CanvasRenderingContext2D,
  lines: FieldLine[],
  time: number
) {
  lines.forEach((line, lineIndex) => {
    if (line.points.length < 2) return;
    
    ctx.beginPath();
    ctx.moveTo(line.points[0].x, line.points[0].y);
    
    // Smooth curve through points
    for (let i = 1; i < line.points.length - 1; i++) {
      const xc = (line.points[i].x + line.points[i + 1].x) / 2;
      const yc = (line.points[i].y + line.points[i + 1].y) / 2;
      ctx.quadraticCurveTo(line.points[i].x, line.points[i].y, xc, yc);
    }
    
    // Animated opacity
    const animatedOpacity = line.opacity * (0.7 + 0.3 * Math.sin(time * 0.01 + lineIndex));
    
    ctx.strokeStyle = `rgba(79, 209, 197, ${animatedOpacity})`;
    ctx.lineWidth = line.width;
    ctx.lineCap = 'round';
    ctx.stroke();
  });
}

function updateParticles(
  particles: Particle[],
  nodePositions: Array<{ x: number; y: number; strength: number }>,
  width: number,
  height: number
) {
  particles.forEach(p => {
    // Attraction to nodes
    nodePositions.forEach(node => {
      const dx = node.x - p.x;
      const dy = node.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy) + 1;
      
      if (dist < 300) {
        const force = (node.strength * 0.0001) / (dist * 0.01);
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
      }
    });
    
    // Apply velocity with damping
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.99;
    p.vy *= 0.99;
    
    // Update life
    p.life += 1;
    if (p.life > p.maxLife) {
      // Respawn
      p.x = Math.random() * width;
      p.y = Math.random() * height;
      p.life = 0;
      p.opacity = Math.random() * 0.3 + 0.1;
    }
    
    // Wrap around edges
    if (p.x < 0) p.x = width;
    if (p.x > width) p.x = 0;
    if (p.y < 0) p.y = height;
    if (p.y > height) p.y = 0;
  });
}

function drawParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  intensity: number
) {
  particles.forEach(p => {
    // Life-based opacity
    const lifeFactor = 1 - Math.abs(p.life / p.maxLife - 0.5) * 2;
    const opacity = p.opacity * lifeFactor * intensity;
    
    // Draw glow
    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
    gradient.addColorStop(0, `hsla(${p.hue}, 70%, 60%, ${opacity})`);
    gradient.addColorStop(1, `hsla(${p.hue}, 70%, 60%, 0)`);
    
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Draw core
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${opacity * 1.5})`;
    ctx.fill();
  });
}
