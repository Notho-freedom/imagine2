import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'IMAGINE - IDE de la pensée augmentée',
  description: 'Transformez vos idées floues en systèmes exploitables. IMAGINE est le moteur cognitif du pack Notilus / Nexus.',
  keywords: ['ideation', 'mind mapping', 'AI', 'thinking', 'creativity', 'productivity'],
  authors: [{ name: 'IMAGINE Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0B0F14',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
