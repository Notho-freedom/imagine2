'use client';

// ========================================
// IMAGINE - Thought Field
// Des particules qui coulent le long des trajectoires.
// Là où il y a de la réflexion, le champ est dense.
// Ce n'est pas une décoration : c'est la densité du travail.
// ========================================

import React, { useEffect, useRef } from 'react';

interface Attractor {
  x: number;
  y: number;
  color: string;
  weight: number;
}

interface Mote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
}

const COUNT = 90;
const LINK_RANGE = 420;

export function ThoughtField({
  attractors,
  pan,
  zoom,
}: {
  attractors: Attractor[];
  pan: { x: number; y: number };
  zoom: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const motes = useRef<Mote[]>([]);
  const links = useRef<Array<{ a: number; b: number }>>([]);
  const view = useRef({ pan, zoom });
  const attractorsRef = useRef(attractors);

  view.current = { pan, zoom };
  attractorsRef.current = attractors;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const hexToRgb = (hex: string) => {
      const v = hex.replace('#', '');
      const n = parseInt(
        v.length === 3
          ? v
              .split('')
              .map((c) => c + c)
              .join('')
          : v,
        16
      );
      return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
    };

    // Les lignes de champ suivent les trajectoires, pas une grille
    const buildLinks = () => {
      const a = attractorsRef.current;
      links.current = [];
      for (let i = 0; i < a.length; i++) {
        for (let j = i + 1; j < a.length; j++) {
          const d = Math.hypot(a[i].x - a[j].x, a[i].y - a[j].y);
          if (d < LINK_RANGE) links.current.push({ a: i, b: j });
        }
      }
    };

    const seed = () => {
      motes.current = Array.from({ length: COUNT }, (_, i) => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: 0,
        vy: 0,
        life: Math.random() * 600,
        max: 700 + Math.random() * 900,
        size: 0.6 + Math.random() * 1.5,
        color: attractorsRef.current[i % Math.max(1, attractorsRef.current.length)]?.color ?? '#4FD1C5',
      }));
    };

    const tick = () => {
      const { pan: p, zoom: z } = view.current;
      const a = attractorsRef.current;

      ctx.clearRect(0, 0, w, h);

      if (a.length === 0) {
        motes.current.forEach((m) => {
          m.life += 1;
          if (m.life > m.max) {
            m.x = Math.random() * w;
            m.y = Math.random() * h;
            m.life = 0;
          }
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(79, 209, 197, ${0.06 * (1 - m.life / m.max)})`;
          ctx.fill();
        });
        raf = requestAnimationFrame(tick);
        return;
      }

      buildLinks();

      // Les liens entre trajectoires, en fil
      links.current.forEach(({ a: i, b: j }) => {
        const p1 = a[i];
        const p2 = a[j];
        const x1 = p1.x * z + p.x;
        const y1 = p1.y * z + p.y;
        const x2 = p2.x * z + p.x;
        const y2 = p2.y * z + p.y;
        const d = Math.hypot(x1 - x2, y1 - y2);
        const strength = 1 - d / (LINK_RANGE * z);
        if (strength <= 0) return;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(
          (x1 + x2) / 2 + (y2 - y1) * 0.08,
          (y1 + y2) / 2 - (x2 - x1) * 0.08,
          x2,
          y2
        );
        ctx.strokeStyle = `rgba(${hexToRgb(p1.color)}, ${0.05 * strength})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Les motes remontent le long des lignes de force
      motes.current.forEach((m, i) => {
        let fx = 0;
        let fy = 0;
        const totalWeight = a.reduce((s, x) => s + x.weight, 0) || 1;

        a.forEach((t, j) => {
          const tx = t.x * z + p.x;
          const ty = t.y * z + p.y;
          const dx = tx - m.x;
          const dy = ty - m.y;
          const d = Math.hypot(dx, dy) + 1;
          const pull = (t.weight / totalWeight) * (240 / d);
          fx += (dx / d) * pull;
          fy += (dy / d) * pull;
        });

        links.current.forEach(({ a: ia, b: ib }) => {
          const p1 = a[ia];
          const p2 = a[ib];
          const mx = (p1.x + p2.x) / 2 * z + p.x;
          const my = (p1.y + p2.y) / 2 * z + p.y;
          const dx = mx - m.x;
          const dy = my - m.y;
          const d = Math.hypot(dx, dy) + 1;
          const swirl = (i % 2 === 0 ? 1 : -1) * (46 / d);
          fx += (dy / d) * swirl;
          fy += -(dx / d) * swirl;
        });

        fx += (Math.random() - 0.5) * 0.16;
        fy += (Math.random() - 0.5) * 0.16;

        m.vx = m.vx * 0.94 + fx * 0.06;
        m.vy = m.vy * 0.94 + fy * 0.06;
        m.x += m.vx;
        m.y += m.vy;
        m.life += 1;

        if (m.life > m.max || m.x < -40 || m.x > w + 40 || m.y < -40 || m.y > h + 40) {
          m.x = Math.random() * w;
          m.y = Math.random() * h;
          m.vx = 0;
          m.vy = 0;
          m.life = 0;
          m.color = a[Math.floor(Math.random() * a.length)]?.color ?? '#4FD1C5';
        }

        const fade = Math.sin((m.life / m.max) * Math.PI);
        const speed = Math.hypot(m.vx, m.vy);

        ctx.beginPath();
        ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${hexToRgb(m.color)}, ${0.16 * fade})`;
        ctx.fill();

        // Sillage : on voit où la pensée va
        if (speed > 0.4) {
          ctx.beginPath();
          ctx.moveTo(m.x, m.y);
          ctx.lineTo(m.x - m.vx * 7, m.y - m.vy * 7);
          ctx.strokeStyle = `rgba(${hexToRgb(m.color)}, ${0.05 * fade})`;
          ctx.lineWidth = m.size * 0.9;
          ctx.stroke();
        }
      });

      raf = requestAnimationFrame(tick);
    };

    resize();
    seed();
    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none opacity-90"
      aria-hidden
    />
  );
}

export default ThoughtField;