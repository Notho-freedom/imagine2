# IMAGINE - IDE de la pensée augmentée

> Si Nexus exécute et Notilus explore, **Imagine conçoit**.

IMAGINE est le moteur cognitif du pack Notilus / Nexus. Ce n'est pas une application de prise de notes. C'est un **environnement de pensée augmentée**.

## 🚀 Démarrage rapide

```bash
# Installation des dépendances
npm install

# Lancer en mode développement
npm run dev

# Build production
npm run build
npm start
```

Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 🎯 Concepts clés

### Spark
Une idée initiale - texte, voix, image, mot-clé. Tout commence par un Spark.

### Constellation
Un graphe vivant d'idées. Les idées sont des nœuds, les relations sont sémantiques.

### Drift
Mode exploration libre avec zoom sémantique et déplacements fluides.

### Projection
Simulation de futurs possibles - variantes et chemins alternatifs.

### Forge
Transformation d'une idée en livrable : plan, pitch, document, code, prompt.

## 🎨 Charte graphique

| Couleur | Hex | Usage |
|---------|-----|-------|
| Noir profond | `#0B0F14` | Fond cognitif |
| Bleu nébuleuse | `#1E3A5F` | Idées stables |
| Violet intuition | `#5B4B8A` | Liens abstraits |
| Cyan projection | `#4FD1C5` | Suggestions IA |
| Blanc diffus | `#E6EDF3` | Texte principal |

## ⌨️ Raccourcis clavier

| Raccourci | Action |
|-----------|--------|
| `⌘ + K` | Palette de commandes |
| `⌘ + N` | Nouveau Spark |
| `Double-clic` | Créer un nœud |
| `Suppr` | Supprimer la sélection |
| `⌘ + A` | Tout sélectionner |
| `0` | Réinitialiser la vue |
| `1` | Ajuster à l'écran |
| `G` | Afficher/masquer la grille |
| `Esc` | Annuler / Fermer |

## 📁 Structure du projet

```
imagine/
├── src/
│   ├── app/                 # Pages Next.js (App Router)
│   │   ├── api/            # Routes API
│   │   │   ├── ai/         # API IA
│   │   │   ├── forge/      # API Forge
│   │   │   └── projects/   # API Projets
│   │   ├── layout.tsx      # Layout racine
│   │   └── page.tsx        # Page principale
│   ├── components/
│   │   ├── canvas/         # Composants Canvas
│   │   │   ├── Canvas.tsx
│   │   │   ├── Node.tsx
│   │   │   ├── Edge.tsx
│   │   │   └── ...
│   │   └── ui/             # Composants UI
│   │       ├── Toolbar.tsx
│   │       ├── Sidebar.tsx
│   │       ├── SparkInput.tsx
│   │       └── ...
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utilitaires
│   │   ├── ai.ts          # Service IA
│   │   ├── theme.ts       # Design system
│   │   └── utils.ts       # Fonctions utilitaires
│   ├── store/              # State management (Zustand)
│   ├── styles/             # Styles globaux
│   └── types/              # Types TypeScript
├── public/                 # Assets statiques
└── ...
```

## 🛠️ Technologies

- **Frontend:** React 18, Next.js 14, TypeScript
- **Styling:** Tailwind CSS, Framer Motion
- **State:** Zustand avec persistence
- **Canvas:** SVG + CSS transforms
- **Icons:** Lucide React

## 📋 Roadmap

### MVP (V1) ✅
- [x] Canvas infini
- [x] Nœuds texte
- [x] Liens manuels
- [x] IA : reformulation + suggestions
- [ ] Export Nexus

### V2
- [ ] Nœuds multimédia (image, audio, code)
- [ ] Connexions automatiques IA
- [ ] Mode Projection
- [ ] Mémoire utilisateur

### V3
- [ ] IA consciente du style cognitif
- [ ] Simulation avancée
- [ ] Collaboration temps réel
- [ ] Partage de constellations

## 🤝 Philosophie

- Pas de document vide
- Pas de structure imposée
- Pas de pression de productivité

Une idée peut être contradictoire, incomplète, chaotique.
IMAGINE ne corrige pas l'utilisateur.
IMAGINE **observe, relie, suggère**.

---

**IMAGINE n'est pas là pour produire plus. IMAGINE est là pour penser mieux.**
