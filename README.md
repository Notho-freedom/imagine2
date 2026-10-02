# IMAGINE - IDE de la pensée augmentée

> Si Nexus exécute et Notilus explore, **Imagine conçoit**.

IMAGINE est le moteur cognitif du pack Notilus / Nexus. Ce n'est pas une application de prise de notes. C'est un **moteur de décision** : tu lui donnes une idée, il te rend une décision, et la chaîne entière qui y mène.

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

### Configuration

`.env.local` :

```bash
GROQ_API_KEY=...          # requis
GROQ_MODEL=openai/gpt-oss-120b   # optionnel, modèle par défaut
```

Vérifier que le moteur répond : `GET /api/trace` renvoie l'état de la configuration.

---

## 🎯 Le produit : un moteur de décision traçable

IMAGINE n'est pas une carte mentale. C'est un moteur qui prend une idée et la pousse jusqu'à
une décision, en gardant la chaîne complète.

Le parcours tient en sept étapes :

| # | Étape | Ce qui se passe |
|---|-------|-----------------|
| 01 | **L'étincelle** | L'utilisateur pose son idée, son contexte, son horizon de décision |
| 02 | **Lecture** | L'IA montre ce qu'elle a compris : reformulation, sujet réel, intention perçue, présupposés non dits, tensions, contraintes, inconnues, enjeu — et **la question décisive** |
| 03 | **Projection** | L'IA produit des trajectoires **irréconciliables** entre elles, chacune avec sa couleur |
| 04 | **Descente** | Dans une trajectoire, on avance jusqu'au mur : conséquences, décision possible, coût, inconnues restantes |
| 05 | **Confrontation** | Matrice de notation sur des critères communs, avec justification par note, et le **discriminant** — la question qui départagerait |
| 06 | **Arbitrage** | Une trajectoire est retenue. L'IA assume, dit ce que ça implique, et ce qui prouverait qu'elle a tort |
| 07 | **Tracé** | Le journal complet, exportable en Markdown. C'est le livrable |

### Principes

- **Une trajectoire porte une couleur, jamais.** Cyan, violet, ambre, rouge, bleu, vert, rose,
  fuchsia — l'identité visuelle est la mémoire du raisonnement.
- **Les trajectoires sont des engagements, pas des variantes.** Deux trajectoires qui pourraient
  être fusionnées ne sont pas deux trajectoires.
- **Écarter n'est pas supprimer.** Une trajectoire écartée reste visible, exportable, traçable.
- **Le mur est une information.** Une descente s'arrête quand la trajectoire cesse de tenir, et
  nomme la condition qui la rouvrirait.
- **Aucune statistique inventée.** Les prompts interdisent au modèle de fabriquer un chiffre, une
  étude ou une source. Une donnée nécessaire est marquée `[à vérifier]`.

### Navigation

| Raccourci | Action |
|-----------|--------|
| `⌘/Ctrl + →` `←` | Étape suivante / précédente |
| `⌘/Ctrl + K` | Palette de commandes |

---

## 🗺️ Vue Carte

Le canvas infini reste accessible via le bouton en bas à gauche. C'est la vue spatiale : nœuds,
liens, suggestions. Le moteur de trace est la vue par défaut.

## 🏗️ Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── trace/route.ts     # moteur de décision (5 actions)
│   │   ├── ai/route.ts        # suggestions sur le canvas
│   │   ├── forge/route.ts
│   │   └── projects/route.ts
│   └── page.tsx               # bascule Projection / Carte
├── components/
│   ├── projection/            # ProjectionBoard + les 7 étapes
│   ├── canvas/                # vue Carte
│   └── ui/
├── hooks/
│   └── useTrace.ts            # orchestration des flux IA
├── lib/
│   ├── groq.ts                # client Groq partagé
│   ├── ai-trace.ts            # lecture / projection / descente / confrontation / arbitrage
│   ├── ai.ts                  # suggestions canvas (existant)
│   └── trace.ts               # palette, critères, export Markdown
├── store/
│   └── useImagineStore.ts     # traces, trajectoires, journal
└── types/
    └── trace.ts               # modèle du moteur de trace
```

## 🛠️ Technologies

- **Frontend:** React 18, Next.js 14, TypeScript
- **Styling:** Tailwind CSS, Framer Motion
- **State:** Zustand avec persistence
- **Canvas:** SVG + CSS transforms
- **IA:** Groq (`gpt-oss-120b` par défaut)
- **Icons:** Lucide React

## 🎨 Charte graphique

| Couleur | Hex | Usage |
|---------|-----|-------|
| Noir profond | `#0B0F14` | Fond cognitif |
| Bleu nébuleuse | `#1E3A5F` | Idées stables |
| Violet intuition | `#5B4B8A` | Liens abstraits |
| Cyan projection | `#4FD1C5` | Suggestions IA |
| Blanc diffus | `#E6EDF3` | Texte principal |

### Palette des trajectoires

Chaque trajectoire reçoit une couleur stable, tirée de cette palette :

| Cyan | Violet | Ambre | Rouge | Bleu | Vert | Rose | Fuchsia |
|------|--------|-------|-------|------|------|------|---------|
| `#4FD1C5` | `#A78BFA` | `#FFB347` | `#F87171` | `#60A5FA` | `#34D399` | `#F472B6` | `#E879F9` |

## ⌨️ Raccourcis clavier

### Moteur de trace

| Raccourci | Action |
|-----------|--------|
| `⌘/Ctrl + →` | Étape suivante |
| `⌘/Ctrl + ←` | Étape précédente |

### Vue Carte

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

## 📋 Roadmap

### Moteur de trace ✅
- [x] Lecture profonde de l'idée (présupposés, tensions, question décisive)
- [x] Projection en trajectoires colorées et divergentes
- [x] Descente avec détection de mur
- [x] Confrontation notée et justifiée
- [x] Arbitrage avec falsificateurs
- [x] Tracé exportable en Markdown

### Canvas (vue Carte)
- [x] Canvas infini
- [x] Nœuds texte
- [x] Liens manuels
- [x] IA : reformulation + suggestions
- [ ] Export Nexus

### V2
- [ ] Correction de la lecture par l'utilisateur (réinjectée dans le prompt)
- [ ] Sous-trajectoires : bifurquer à l'intérieur d'une descente
- [ ] Enrichissement des critères de confrontation par l'utilisateur
- [ ] Nœuds multimédia (image, audio, code)
- [ ] Export Nexus / Notilus
- [ ] Persistance serveur (au-delà de localStorage)

## 🤝 Philosophie

- Pas de document vide
- Pas de structure imposée
- Pas de pression de productivité

Une idée peut être contradictoire, incomplète, chaotique.
IMAGINE ne corrige pas l'utilisateur.
IMAGINE **observe, relie, tronque**.

Et à la fin, il tranche — en disant ce qui prouverait qu'il a tort.

---

**IMAGINE n'est pas là pour produire plus. IMAGINE est là pour décider mieux.**
