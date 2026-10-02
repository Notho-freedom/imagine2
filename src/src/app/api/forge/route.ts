// ========================================
// IMAGINE - Forge API Route
// API pour la transformation d'idées en livrables
// ========================================

import { NextRequest, NextResponse } from 'next/server';

type ForgeOutputType = 'document' | 'pitch' | 'plan' | 'code' | 'prompt' | 'summary' | 'mindmap';

interface ForgeRequest {
  nodes: Array<{
    id: string;
    type: string;
    content?: string;
  }>;
  outputType: ForgeOutputType;
  options?: {
    style?: string;
    length?: 'short' | 'medium' | 'long';
    format?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: ForgeRequest = await request.json();
    const { nodes, outputType, options } = body;

    if (!nodes || nodes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Aucun nœud fourni' },
        { status: 400 }
      );
    }

    const textContents = nodes
      .filter(n => n.type === 'text' && n.content)
      .map(n => n.content!);

    if (textContents.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Aucun contenu texte à transformer' },
        { status: 400 }
      );
    }

    const combinedText = textContents.join('\n\n');

    // Generate output based on type
    let content: string;

    switch (outputType) {
      case 'document':
        content = generateDocument(textContents, options);
        break;
      case 'pitch':
        content = generatePitch(textContents, options);
        break;
      case 'plan':
        content = generatePlan(textContents, options);
        break;
      case 'code':
        content = generateCode(textContents, options);
        break;
      case 'prompt':
        content = generatePrompt(textContents, options);
        break;
      case 'summary':
        content = generateSummary(textContents, options);
        break;
      case 'mindmap':
        content = generateMindmap(textContents, options);
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Type de sortie non supporté' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      result: {
        content,
        outputType,
        sourceNodesCount: nodes.length,
        metadata: {
          generatedAt: new Date().toISOString(),
          tokensUsed: combinedText.length,
        },
      },
    });
  } catch (error) {
    console.error('[Forge API Error]', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la transformation' },
      { status: 500 }
    );
  }
}

// ========================================
// Generation functions
// ========================================

function generateDocument(texts: string[], options?: any): string {
  const title = texts[0]?.slice(0, 50) || 'Document';
  
  return `# ${title}

## Introduction

${texts[0] || ''}

## Développement

${texts.slice(1).map((t, i) => `### Section ${i + 1}\n\n${t}`).join('\n\n')}

## Conclusion

Ce document synthétise les idées principales explorées dans IMAGINE.

---

*Document généré par IMAGINE - ${new Date().toLocaleDateString('fr-FR')}*
`;
}

function generatePitch(texts: string[], options?: any): string {
  return `# Pitch

## 🎯 Le Problème

${texts[0] || 'À définir'}

## 💡 Notre Solution

${texts[1] || 'Solution innovante basée sur les idées explorées'}

## 🚀 La Proposition de Valeur

${texts[2] || 'Valeur unique pour les utilisateurs'}

## 📈 L'Impact Attendu

- Amélioration significative de l'expérience
- Gain de temps et d'efficacité
- Innovation dans le domaine

## ⏭️ Prochaines Étapes

1. Validation du concept
2. Prototype MVP
3. Tests utilisateurs
4. Itération et lancement

---

*Pitch généré par IMAGINE*
`;
}

function generatePlan(texts: string[], options?: any): string {
  return `# Plan d'Action

## Objectif Principal

${texts[0] || 'Objectif à définir'}

## Étapes

${texts.map((t, i) => `### Étape ${i + 1}

**Action:** ${t}

**Durée estimée:** À définir
**Responsable:** À assigner
**Livrables:** À préciser

---`).join('\n\n')}

## Timeline

| Phase | Description | Durée |
|-------|-------------|-------|
${texts.map((t, i) => `| Phase ${i + 1} | ${t.slice(0, 40)}... | 1 semaine |`).join('\n')}

## Ressources Nécessaires

- Équipe dédiée
- Outils et infrastructure
- Budget

## Indicateurs de Succès

- [ ] Objectif 1 atteint
- [ ] Objectif 2 atteint
- [ ] Feedback positif

---

*Plan généré par IMAGINE*
`;
}

function generateCode(texts: string[], options?: any): string {
  const concept = texts[0]?.slice(0, 100) || 'concept';
  
  return `/**
 * Code généré par IMAGINE
 * Basé sur: ${concept}
 * Date: ${new Date().toISOString()}
 */

// Types
interface Concept {
  id: string;
  name: string;
  description: string;
  connections: string[];
}

// Données extraites
const concepts: Concept[] = [
${texts.map((t, i) => `  {
    id: 'concept_${i + 1}',
    name: 'Concept ${i + 1}',
    description: \`${t.replace(/`/g, "'").slice(0, 100)}\`,
    connections: [],
  }`).join(',\n')}
];

// Fonction principale
function processConcepts(concepts: Concept[]): void {
  concepts.forEach(concept => {
    console.log(\`Processing: \${concept.name}\`);
    // TODO: Implémenter la logique métier
  });
}

// Exécution
processConcepts(concepts);

export { concepts, processConcepts };
`;
}

function generatePrompt(texts: string[], options?: any): string {
  return `# Prompt IA

## Contexte

Tu es un expert dans le domaine suivant. Voici les informations de contexte:

${texts.map((t, i) => `### Information ${i + 1}\n${t}`).join('\n\n')}

## Ta Mission

Analyse ces informations et:

1. Identifie les thèmes principaux
2. Trouve les connexions entre les idées
3. Propose des développements possibles
4. Suggère des actions concrètes

## Format de Réponse

Structure ta réponse de manière claire avec:
- Des sections bien définies
- Des bullet points pour la lisibilité
- Des exemples concrets quand c'est pertinent

## Contraintes

- Reste factuel et précis
- Propose des suggestions actionnables
- Garde un ton professionnel mais accessible

---

*Prompt généré par IMAGINE*
`;
}

function generateSummary(texts: string[], options?: any): string {
  const length = options?.length || 'medium';
  
  let intro = '';
  switch (length) {
    case 'short':
      intro = `Résumé en ${texts.length} points clés.`;
      break;
    case 'long':
      intro = `Analyse détaillée de ${texts.length} idées interconnectées.`;
      break;
    default:
      intro = `Synthèse de ${texts.length} concepts explorés.`;
  }

  return `# Résumé

${intro}

## Points Clés

${texts.map((t, i) => `${i + 1}. **Idée ${i + 1}:** ${t.slice(0, 150)}${t.length > 150 ? '...' : ''}`).join('\n\n')}

## Thèmes Identifiés

- Thème principal: ${texts[0]?.split(' ').slice(0, 3).join(' ') || 'À identifier'}
- Thèmes secondaires: À explorer

## Connexions

Les idées sont liées par des concepts communs qui méritent d'être approfondis.

## Prochaines Étapes Suggérées

1. Approfondir les connexions identifiées
2. Développer les idées prometteuses
3. Valider avec des parties prenantes

---

*Résumé généré par IMAGINE - ${new Date().toLocaleDateString('fr-FR')}*
`;
}

function generateMindmap(texts: string[], options?: any): string {
  const central = texts[0]?.split(' ').slice(0, 3).join(' ') || 'Idée centrale';
  
  return `# Mind Map

\`\`\`
                    ┌─────────────────┐
                    │  ${central.padEnd(15)}│
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   Branche 1   │    │   Branche 2   │    │   Branche 3   │
└───────────────┘    └───────────────┘    └───────────────┘
        │                    │                    │
   ${texts[1]?.slice(0, 10) || 'Idée 1'}            ${texts[2]?.slice(0, 10) || 'Idée 2'}            ${texts[3]?.slice(0, 10) || 'Idée 3'}
\`\`\`

## Structure Détaillée

### Nœud Central: ${central}

${texts.map((t, i) => `- **Branche ${i + 1}:** ${t.slice(0, 80)}`).join('\n')}

## Connexions Suggérées

- Branche 1 ↔ Branche 2: Relation à explorer
- Branche 2 ↔ Branche 3: Synergie potentielle

---

*Mind map généré par IMAGINE*
`;
}
