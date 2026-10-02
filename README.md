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
| `H` | Ouvrir une hypothèse (« et si… ? ») |
| `⌘/Ctrl + K` | Palette de commandes |

### L'hypothèse

Le geste n'a pas d'étape. À tout moment — étincelle, lecture, projection, descente, confrontation, arbitrage, journal — **« et si… ? »** ouvre une trajectoire depuis l'idée courante, qui s'explore comme les autres.

Si une décision avait été rendue, elle est **rouverte** : elle avait été prise sur un jeu de trajectoires incomplet. L'arbitrage devra être refait. C'est tracé au journal.

### Les critères

Les cinq critères par défaut (faisabilité, impact, coût, risque, fidélité) sont une convention, pas une vérité. **« Ce qui compte »** permet de :

- **peser** chaque critère — ×0,2 à ×3 — et voir le classement bouger immédiatement, sans attendre une nouvelle mesure
- **retirer** ou **réactiver** un critère
- **ajouter** les siens (réversibilité, image de marque, dépendance à une personne…)

Le total est recalculé en applicatif comme moyenne pondérée. **Le moteur ne le calcule jamais** — un total inventé par un modèle décrédibiliterait toute la confrontation. Le moteur sait en revanche que les poids comptent, et le signale dans sa synthèse quand ils pèsent dans le classement.

L'export Markdown indique sur quoi on a mesuré et avec quels poids.

### Ce qui a réellement été regardé

Une note ne vaut que ce qui a été observé. Noter « impact » sur une trajectoire qu'on n'a jamais descendue, c'est deviner en prenant l'air de mesurer.

Le niveau de preuve est lu dans le tracé lui-même :

| Niveau | Condition | Fourchette |
|---|---|---|
| 0 · rien regardé | aucun passage | ±35 |
| 1 · regardée | 1 à 2 passages | ±22 |
| 2 · descendue | 3 passages ou plus | ±12 |
| 3 · mur atteint | un mur explicite | ±6 |

Conséquences :

- le total est affiché **en fourchette**, pas en point — tant qu'elle est large, un écart de quelques points ne départage rien
- une note posée sur une trajectoire jamais descendue est marquée à l'aveugle, et la justification le dit
- un bandeau rappelle ce qui n'a pas été regardé, avec un raccourci vers la descente
- le moteur **sait** quelles trajectoires n'ont pas été testées : il le signale dans sa synthèse au lieu de présenter ses déductions comme des mesures
- l'arbitrage rappelle sur quoi il tranche
- l'export porte la fourchette et l'avertissement

Faire porter à l'IA le choix des critères selon l'étape aurait été trompeur : elle ne sait pas ce qui compte dans *ta* décision. Lui montrer l'état réel de ton information, ça, elle peut le faire.

### Ce qui a été éprouvé, et ce qui ne l'a pas été

L'arbitrage écrit des **falsificateurs** — ce qui prouverait que la décision est fausse. Dans la plupart des outils, ils disparaissent aussitôt écrits.

Ici chacun est suivi :

- **jamais regardé** / **vérifié** / **réfuté** / **sans objet**, avec une note
- un faux **réfuté annule l'arbitrage** et rouvre la décision. C'est le système qui travaille, pas l'utilisateur
- un nouvel arbitrage **conserve** les vérifications déjà faites — on ne recommence pas une recherche faite
- les observations sont **réinjectées** au moteur comme faisant autorité
- **Valider est bloqué** tant qu'un faux n'a pas été regardé : une décision qu'on n'a pas tenté d'infirmer reste un pari

Le journal mesure ce que la réflexion a réellement coûté, sans rien stocker de plus — l'ordre et les horodatages des événements suffisent :

- durée totale, et répartition du temps par étape
- nombre de descentes, d'hypothèses, de virages
- **« Jamais éprouvé »** : la liste de ce qui n'a pas été fait. Une décision validée sans descente ni hypothèse le dit haut et fort

### La vue Carte

La carte affiche le flux du tracé comme un arbre qui grandit vers la droite : l'étincelle, les trajectoires colorées, leurs descentes, les virages. Survole une trajectoire et sa lignée s'allume tandis que le reste s'efface. Clique un nœud et le parcours s'ouvre à l'étape correspondante.

Le bouton **Flux / Nœuds** bascule vers l'ancien canvas de cartes.

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
- [x] **Lecture contestable** : édition, refus d'éléments, relecture par le moteur
- [x] Projection en trajectoires colorées et divergentes
- [x] Descente avec détection de mur
- [x] Bifurcation : virer en cours de descente, avec ce qu'on perd
- [x] **Hypothèse à tout moment** (touche `H`), avec réouverture de la décision
- [x] Confrontation notée et justifiée
- [x] **Critères pondérés par l'utilisateur**, ajoutables et retirables
- [x] **Niveau de preuve** : total en fourchette, notes à l'aveugle marquées
- [x] **Falsificateurs suivis** : un faux prouvé annule l'arbitrage
- [x] **Coût de la réflexion** : temps réel et liste de ce qui n'a jamais été éprouvé
- [x] Arbitrage avec falsificateurs
- [x] **Vue Carte** du flux, en arbre, avec lignées au survol
- [x] Tracé exportable en Markdown

### Canvas (vue Nœuds)
- [x] Canvas infini
- [x] Nœuds texte
- [x] Liens manuels
- [x] IA : reformulation + suggestions
- [ ] Export Nexus

### V2
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
