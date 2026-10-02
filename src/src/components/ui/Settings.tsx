'use client';

// ========================================
// IMAGINE - Settings Modal
// Paramètres de l'application
// ========================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Settings as SettingsIcon,
  Grid3X3,
  Sparkles,
  Palette,
  Database,
  Keyboard,
  Info,
  Check,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { useImagineStore } from '@/store/useImagineStore';

// ========================================
// Types
// ========================================

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'general' | 'canvas' | 'ai' | 'appearance' | 'shortcuts' | 'about';

interface SettingsState {
  // Canvas
  showGrid: boolean;
  gridSize: number;
  snapToGrid: boolean;
  
  // AI
  aiEnabled: boolean;
  aiModel: string;
  autoSuggest: boolean;
  suggestionDelay: number;
  
  // Appearance
  theme: 'dark' | 'light' | 'system';
  animationsEnabled: boolean;
  showNodeShadows: boolean;
  
  // General
  autoSave: boolean;
  autoSaveInterval: number;
  language: 'fr' | 'en';
}

// ========================================
// Default Settings
// ========================================

const defaultSettings: SettingsState = {
  showGrid: true,
  gridSize: 20,
  snapToGrid: false,
  aiEnabled: true,
  aiModel: 'llama-3.1-70b-versatile',
  autoSuggest: true,
  suggestionDelay: 500,
  theme: 'dark',
  animationsEnabled: true,
  showNodeShadows: true,
  autoSave: true,
  autoSaveInterval: 30,
  language: 'fr',
};

// ========================================
// Settings Component
// ========================================

export function Settings({ isOpen, onClose }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('imagine-settings');
    if (stored) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
  }, [isOpen]);

  // Update setting
  const updateSetting = <K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  // Save settings
  const saveSettings = () => {
    localStorage.setItem('imagine-settings', JSON.stringify(settings));
    setHasChanges(false);
  };

  // Reset settings
  const resetSettings = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
  };

  const tabs: Array<{ id: SettingsTab; icon: typeof SettingsIcon; label: string }> = [
    { id: 'general', icon: SettingsIcon, label: 'Général' },
    { id: 'canvas', icon: Grid3X3, label: 'Canvas' },
    { id: 'ai', icon: Sparkles, label: 'IA (Groq)' },
    { id: 'appearance', icon: Palette, label: 'Apparence' },
    { id: 'shortcuts', icon: Keyboard, label: 'Raccourcis' },
    { id: 'about', icon: Info, label: 'À propos' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="relative z-10 w-full max-w-4xl h-[600px] bg-imagine-bg border border-imagine-border rounded-2xl shadow-2xl overflow-hidden flex"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Sidebar */}
            <div className="w-56 bg-imagine-surface border-r border-imagine-border p-4 flex flex-col">
              <div className="flex items-center gap-3 mb-6 px-2">
                <SettingsIcon className="w-5 h-5 text-imagine-projection" />
                <h2 className="text-lg font-semibold text-imagine-text">Paramètres</h2>
              </div>

              <nav className="flex-1 space-y-1">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-imagine-projection/20 text-imagine-projection'
                        : 'text-imagine-muted hover:text-imagine-text hover:bg-white/5'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="text-sm">{tab.label}</span>
                    {activeTab === tab.id && (
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    )}
                  </button>
                ))}
              </nav>

              {/* Version */}
              <div className="pt-4 border-t border-imagine-border">
                <p className="text-xs text-imagine-muted text-center">
                  IMAGINE v0.1.0 MVP
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-imagine-border">
                <h3 className="text-lg font-medium text-imagine-text">
                  {tabs.find(t => t.id === activeTab)?.label}
                </h3>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-imagine-muted hover:text-imagine-text hover:bg-white/10 transition-colors"
                  aria-label="Fermer les paramètres"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 p-6 overflow-y-auto">
                {activeTab === 'general' && (
                  <GeneralSettings
                    settings={settings}
                    updateSetting={updateSetting}
                  />
                )}
                {activeTab === 'canvas' && (
                  <CanvasSettings
                    settings={settings}
                    updateSetting={updateSetting}
                  />
                )}
                {activeTab === 'ai' && (
                  <AISettings
                    settings={settings}
                    updateSetting={updateSetting}
                  />
                )}
                {activeTab === 'appearance' && (
                  <AppearanceSettings
                    settings={settings}
                    updateSetting={updateSetting}
                  />
                )}
                {activeTab === 'shortcuts' && <ShortcutsSettings />}
                {activeTab === 'about' && <AboutSettings />}
              </div>

              {/* Footer */}
              {activeTab !== 'shortcuts' && activeTab !== 'about' && (
                <div className="flex items-center justify-between p-4 border-t border-imagine-border bg-imagine-surface/50">
                  <button
                    onClick={resetSettings}
                    className="px-4 py-2 text-sm text-imagine-muted hover:text-imagine-text transition-colors"
                  >
                    Réinitialiser
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-sm text-imagine-muted hover:text-imagine-text transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => {
                        saveSettings();
                        onClose();
                      }}
                      disabled={!hasChanges}
                      className="px-4 py-2 text-sm bg-imagine-projection text-imagine-bg rounded-lg hover:bg-imagine-projection/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Enregistrer
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ========================================
// Settings Sections
// ========================================

interface SettingsSectionProps {
  settings: SettingsState;
  updateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
}

// Toggle Switch Component
function Toggle({
  enabled,
  onChange,
  label,
}: {
  enabled: boolean;
  onChange: (value: boolean) => void;
  label?: string;
}) {
  const ariaChecked = enabled ? 'true' : 'false';
  return (
    <button
      type="button"
      role="switch"
      onClick={() => onChange(!enabled)}
      title={label || 'Toggle'}
      aria-checked={ariaChecked as 'true' | 'false'}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        enabled ? 'bg-imagine-projection' : 'bg-imagine-surface'
      }`}
    >
      <span
        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
          enabled ? 'left-6' : 'left-1'
        }`}
      />
    </button>
  );
}

// Setting Row Component
function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-imagine-border/50 last:border-0">
      <div>
        <p className="text-sm font-medium text-imagine-text">{label}</p>
        {description && (
          <p className="text-xs text-imagine-muted mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

// General Settings
function GeneralSettings({ settings, updateSetting }: SettingsSectionProps) {
  return (
    <div className="space-y-1">
      <SettingRow
        label="Sauvegarde automatique"
        description="Sauvegarder le projet automatiquement"
      >
        <Toggle
          enabled={settings.autoSave}
          onChange={v => updateSetting('autoSave', v)}
          label="Activer la sauvegarde automatique"
        />
      </SettingRow>

      <SettingRow
        label="Intervalle de sauvegarde"
        description="En secondes"
      >
        <select
          value={settings.autoSaveInterval}
          onChange={e => updateSetting('autoSaveInterval', Number(e.target.value))}
          className="bg-imagine-surface border border-imagine-border rounded-lg px-3 py-1.5 text-sm text-imagine-text"
          title="Intervalle de sauvegarde"
        >
          <option value={15}>15s</option>
          <option value={30}>30s</option>
          <option value={60}>1 min</option>
          <option value={120}>2 min</option>
        </select>
      </SettingRow>

      <SettingRow
        label="Langue"
        description="Langue de l'interface"
      >
        <select
          value={settings.language}
          onChange={e => updateSetting('language', e.target.value as 'fr' | 'en')}
          className="bg-imagine-surface border border-imagine-border rounded-lg px-3 py-1.5 text-sm text-imagine-text"
          title="Langue"
        >
          <option value="fr">Français</option>
          <option value="en">English</option>
        </select>
      </SettingRow>
    </div>
  );
}

// Canvas Settings
function CanvasSettings({ settings, updateSetting }: SettingsSectionProps) {
  return (
    <div className="space-y-1">
      <SettingRow
        label="Afficher la grille"
        description="Grille de fond sur le canvas"
      >
        <Toggle
          enabled={settings.showGrid}
          onChange={v => updateSetting('showGrid', v)}
          label="Afficher la grille"
        />
      </SettingRow>

      <SettingRow
        label="Taille de la grille"
        description="Espacement en pixels"
      >
        <select
          value={settings.gridSize}
          onChange={e => updateSetting('gridSize', Number(e.target.value))}
          className="bg-imagine-surface border border-imagine-border rounded-lg px-3 py-1.5 text-sm text-imagine-text"
          title="Taille de la grille"
        >
          <option value={10}>10px</option>
          <option value={20}>20px</option>
          <option value={30}>30px</option>
          <option value={40}>40px</option>
        </select>
      </SettingRow>

      <SettingRow
        label="Aimanter à la grille"
        description="Aligner les nœuds sur la grille"
      >
        <Toggle
          enabled={settings.snapToGrid}
          onChange={v => updateSetting('snapToGrid', v)}
          label="Aimanter à la grille"
        />
      </SettingRow>
    </div>
  );
}

// AI Settings
function AISettings({ settings, updateSetting }: SettingsSectionProps) {
  return (
    <div className="space-y-1">
      <SettingRow
        label="IA activée"
        description="Activer les fonctionnalités d'IA Groq"
      >
        <Toggle
          enabled={settings.aiEnabled}
          onChange={v => updateSetting('aiEnabled', v)}
          label="Activer l'IA"
        />
      </SettingRow>

      <SettingRow
        label="Modèle IA"
        description="Modèle Groq à utiliser"
      >
        <select
          value={settings.aiModel}
          onChange={e => updateSetting('aiModel', e.target.value)}
          className="bg-imagine-surface border border-imagine-border rounded-lg px-3 py-1.5 text-sm text-imagine-text"
          title="Modèle IA"
        >
          <option value="llama-3.1-70b-versatile">LLaMA 3.1 70B</option>
          <option value="llama-3.1-8b-instant">LLaMA 3.1 8B (rapide)</option>
          <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
          <option value="gemma2-9b-it">Gemma 2 9B</option>
        </select>
      </SettingRow>

      <SettingRow
        label="Suggestions automatiques"
        description="Générer des suggestions IA pour les nœuds"
      >
        <Toggle
          enabled={settings.autoSuggest}
          onChange={v => updateSetting('autoSuggest', v)}
          label="Suggestions automatiques"
        />
      </SettingRow>

      <SettingRow
        label="Délai de suggestion"
        description="Temps d'attente avant de suggérer"
      >
        <select
          value={settings.suggestionDelay}
          onChange={e => updateSetting('suggestionDelay', Number(e.target.value))}
          className="bg-imagine-surface border border-imagine-border rounded-lg px-3 py-1.5 text-sm text-imagine-text"
          title="Délai de suggestion"
        >
          <option value={300}>300ms</option>
          <option value={500}>500ms</option>
          <option value={1000}>1s</option>
          <option value={2000}>2s</option>
        </select>
      </SettingRow>

      <div className="mt-6 p-4 rounded-lg bg-imagine-nebula/10 border border-imagine-nebula/30">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-imagine-projection mt-0.5" />
          <div>
            <p className="text-sm font-medium text-imagine-text">Propulsé par Groq</p>
            <p className="text-xs text-imagine-muted mt-1">
              IMAGINE utilise l&apos;API Groq pour des réponses ultra-rapides. 
              Les requêtes sont envoyées de manière sécurisée avec votre clé API.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Appearance Settings
function AppearanceSettings({ settings, updateSetting }: SettingsSectionProps) {
  return (
    <div className="space-y-1">
      <SettingRow
        label="Thème"
        description="Apparence de l'interface"
      >
        <div className="flex gap-2">
          {[
            { value: 'dark' as const, icon: Moon, label: 'Sombre' },
            { value: 'light' as const, icon: Sun, label: 'Clair' },
            { value: 'system' as const, icon: Monitor, label: 'Système' },
          ].map(option => (
            <button
              key={option.value}
              onClick={() => updateSetting('theme', option.value)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                settings.theme === option.value
                  ? 'bg-imagine-projection/20 text-imagine-projection border border-imagine-projection/50'
                  : 'bg-imagine-surface text-imagine-muted hover:text-imagine-text border border-imagine-border'
              }`}
            >
              <option.icon className="w-4 h-4" />
              {option.label}
            </button>
          ))}
        </div>
      </SettingRow>

      <SettingRow
        label="Animations"
        description="Effets de transition et animations"
      >
        <Toggle
          enabled={settings.animationsEnabled}
          onChange={v => updateSetting('animationsEnabled', v)}
          label="Activer les animations"
        />
      </SettingRow>

      <SettingRow
        label="Ombres des nœuds"
        description="Effet d'ombre sur les cartes"
      >
        <Toggle
          enabled={settings.showNodeShadows}
          onChange={v => updateSetting('showNodeShadows', v)}
          label="Afficher les ombres des nœuds"
        />
      </SettingRow>
    </div>
  );
}

// Shortcuts Settings
function ShortcutsSettings() {
  const shortcuts = [
    { keys: ['⌘', 'K'], action: 'Ouvrir la palette de commandes' },
    { keys: ['⌘', 'N'], action: 'Nouveau nœud' },
    { keys: ['⌘', 'S'], action: 'Sauvegarder' },
    { keys: ['⌘', 'Z'], action: 'Annuler' },
    { keys: ['⌘', '⇧', 'Z'], action: 'Refaire' },
    { keys: ['Suppr'], action: 'Supprimer la sélection' },
    { keys: ['⌘', '+'], action: 'Zoom avant' },
    { keys: ['⌘', '-'], action: 'Zoom arrière' },
    { keys: ['⌘', '0'], action: 'Réinitialiser le zoom' },
    { keys: ['Espace'], action: 'Mode déplacement (maintenir)' },
    { keys: ['L'], action: 'Mode liaison' },
    { keys: ['Échap'], action: 'Désélectionner / Annuler' },
  ];

  return (
    <div className="space-y-2">
      {shortcuts.map((shortcut, index) => (
        <div
          key={index}
          className="flex items-center justify-between py-3 border-b border-imagine-border/50 last:border-0"
        >
          <span className="text-sm text-imagine-text">{shortcut.action}</span>
          <div className="flex gap-1">
            {shortcut.keys.map((key, i) => (
              <kbd
                key={i}
                className="px-2 py-1 text-xs bg-imagine-surface border border-imagine-border rounded text-imagine-muted"
              >
                {key}
              </kbd>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// About Settings
function AboutSettings() {
  return (
    <div className="space-y-6">
      {/* Logo & Title */}
      <div className="text-center py-6">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-imagine-projection via-imagine-intuition to-imagine-nebula flex items-center justify-center">
          <span className="text-3xl font-bold text-white">IM</span>
        </div>
        <h3 className="text-2xl font-bold text-imagine-text">IMAGINE</h3>
        <p className="text-sm text-imagine-muted mt-1">
          IDE de la pensée augmentée
        </p>
        <p className="text-xs text-imagine-muted mt-2">Version 0.1.0 MVP</p>
      </div>

      {/* Description */}
      <div className="p-4 rounded-lg bg-imagine-surface border border-imagine-border">
        <p className="text-sm text-imagine-text leading-relaxed">
          IMAGINE est le moteur cognitif du pack Notilus / Nexus. 
          C&apos;est l&apos;espace où les idées naissent, se transforment et se connectent 
          avant d&apos;être affinées dans Nexus ou exportées vers Notilus.
        </p>
      </div>

      {/* Tech Stack */}
      <div>
        <h4 className="text-sm font-medium text-imagine-text mb-3">Technologies</h4>
        <div className="flex flex-wrap gap-2">
          {['Next.js 14', 'TypeScript', 'Tailwind CSS', 'Zustand', 'Framer Motion', 'Groq API'].map(tech => (
            <span
              key={tech}
              className="px-3 py-1 text-xs bg-imagine-surface border border-imagine-border rounded-full text-imagine-muted"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Links */}
      <div className="pt-4 border-t border-imagine-border">
        <p className="text-xs text-imagine-muted text-center">
          Conçu avec ❤️ pour la pensée créative
        </p>
      </div>
    </div>
  );
}

export default Settings;
