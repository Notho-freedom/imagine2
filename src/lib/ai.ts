// ========================================
// IMAGINE - Groq AI Service
// Service IA avec Groq API
// ========================================

import type { ImagineNode, AISuggestion } from '@/types';
import { generateId } from '@/lib/utils';

// ========================================
// Types
// ========================================

export interface AIAnalysisResult {
  themes: string[];
  keywords: string[];
  suggestedLinks: Array<{
    fromNodeId: string;
    toNodeId: string;
    reason: string;
    confidence: number;
    label?: string;
  }>;
  reformulations: Array<{
    nodeId: string;
    original: string;
    suggestion: string;
  }>;
}

export interface ConnectionSuggestion {
  label: string;
  type: 'causal' | 'semantic' | 'temporal' | 'conflict' | 'support';
  confidence: number;
  explanation: string;
}

export interface NodeMetadataSuggestion {
  tags: string[];
  keywords: string[];
  description: string;
  category?: string;
  importance: 'low' | 'medium' | 'high';
  relatedConcepts: string[];
}

export interface ForgeRequest {
  nodes: ImagineNode[];
  outputType: 'document' | 'pitch' | 'plan' | 'code' | 'prompt' | 'summary';
  options?: {
    style?: string;
    length?: 'short' | 'medium' | 'long';
    format?: string;
  };
}

export interface ForgeResponse {
  content: string;
  metadata: {
    tokensUsed: number;
    generatedAt: string;
    model: string;
  };
}

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ========================================
// Groq AI Service Class
// ========================================

class GroqAIService {
  private apiEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
  private model = 'llama-3.3-70b-versatile';

  private async callGroq(
    messages: GroqMessage[],
    options: { temperature?: number; maxTokens?: number } = {}
  ): Promise<GroqResponse> {
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      throw new Error('GROQ_API_KEY non configurée');
    }

    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2048,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  private simpleAnalysis(textNodes: Array<ImagineNode & { content: string }>): AIAnalysisResult {
    const allText = textNodes.map(n => n.content).join(' ');
    const words = allText.toLowerCase().split(/\s+/);
    const wordFreq = new Map<string, number>();
    
    words.forEach(word => {
      if (word.length > 4) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    });

    const keywords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);

    return {
      themes: keywords.slice(0, 5),
      keywords,
      suggestedLinks: [],
      reformulations: [],
    };
  }

  // ========================================
  // Analyze nodes and suggest connections
  // ========================================
  
  async analyzeNodes(nodes: ImagineNode[]): Promise<AIAnalysisResult> {
    const textNodes = nodes.filter(n => n.type === 'text') as Array<ImagineNode & { content: string }>;
    
    if (textNodes.length === 0) {
      return { themes: [], keywords: [], suggestedLinks: [], reformulations: [] };
    }

    const nodesContent = textNodes
      .map((n, i) => `[Nœud ${i + 1} - ID: ${n.id}]\n${n.content}`)
      .join('\n\n');

    try {
      const response = await this.callGroq([
        {
          role: 'system',
          content: `Tu es un assistant d'analyse cognitive pour IMAGINE, un IDE de pensée augmentée. 
Analyse les idées fournies et retourne un JSON avec:
- themes: liste des thèmes principaux (max 5)
- keywords: mots-clés importants (max 10)
- suggestedLinks: connexions potentielles entre nœuds avec { fromNodeId, toNodeId, reason, confidence (0-1) }
- reformulations: suggestions de reformulation pour améliorer la clarté

Réponds UNIQUEMENT avec du JSON valide, sans markdown.`,
        },
        {
          role: 'user',
          content: `Analyse ces idées:\n\n${nodesContent}`,
        },
      ], { temperature: 0.5 });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);
      
      return {
        themes: parsed.themes || [],
        keywords: parsed.keywords || [],
        suggestedLinks: parsed.suggestedLinks || [],
        reformulations: parsed.reformulations || [],
      };
    } catch (error) {
      console.error('[Groq] Analyze error:', error);
      return this.simpleAnalysis(textNodes);
    }
  }

  // ========================================
  // Generate suggestions for a node
  // ========================================

  async suggestForNode(
    node: ImagineNode,
    context: ImagineNode[]
  ): Promise<AISuggestion[]> {
    if (node.type !== 'text') return [];

    const content = (node as any).content as string;
    if (!content || content.length < 10) return [];

    try {
      const contextTexts = context
        .filter(n => n.type === 'text' && n.id !== node.id)
        .slice(0, 5)
        .map(n => (n as any).content as string)
        .filter(Boolean)
        .join('\n---\n');

      const response = await this.callGroq([
        {
          role: 'system',
          content: `Tu es l'assistant IA d'IMAGINE. Génère des suggestions pour enrichir une idée.
Retourne un JSON avec un tableau "suggestions" contenant des objets:
{ type: "reformulation"|"expansion"|"theme"|"fork", content: "suggestion", confidence: 0.0-1.0 }

Types:
- reformulation: version plus claire
- expansion: développement de l'idée
- theme: thème connexe à explorer
- fork: variante ou alternative

Max 3 suggestions. Réponds UNIQUEMENT en JSON valide.`,
        },
        {
          role: 'user',
          content: `Idée principale:\n${content}\n\nContexte (autres idées):\n${contextTexts || 'Aucun'}`,
        },
      ], { temperature: 0.8, maxTokens: 1024 });

      const parsed = JSON.parse(response.choices[0]?.message?.content || '{"suggestions":[]}');
      
      return (parsed.suggestions || []).map((s: any) => ({
        id: generateId(),
        type: s.type || 'expansion',
        content: s.content,
        confidence: s.confidence || 0.5,
        sourceNodeIds: [node.id],
        accepted: false,
      }));
    } catch (error) {
      console.error('[Groq] Suggest error:', error);
      return [];
    }
  }

  // ========================================
  // Reformulate text
  // ========================================

  async reformulate(
    text: string,
    style: 'concise' | 'elaborate' | 'formal' | 'casual' = 'concise'
  ): Promise<string> {
    const styleInstructions = {
      concise: 'Reformule de manière concise et directe, garde uniquement l\'essentiel.',
      elaborate: 'Développe et enrichis le texte avec plus de détails et de nuances.',
      formal: 'Reformule dans un style professionnel et formel.',
      casual: 'Reformule dans un style conversationnel et accessible.',
    };

    try {
      const response = await this.callGroq([
        {
          role: 'system',
          content: `Tu reformules des textes. ${styleInstructions[style]} Réponds uniquement avec le texte reformulé, sans explication.`,
        },
        {
          role: 'user',
          content: text,
        },
      ], { temperature: 0.6, maxTokens: 1024 });

      return response.choices[0]?.message?.content || text;
    } catch (error) {
      console.error('[Groq] Reformulate error:', error);
      return text;
    }
  }

  // ========================================
  // Forge - Transform ideas into deliverables
  // ========================================

  async forge(request: ForgeRequest): Promise<ForgeResponse> {
    const { nodes, outputType, options } = request;

    const textNodes = nodes
      .filter(n => n.type === 'text')
      .map(n => (n as any).content as string)
      .filter(Boolean);

    if (textNodes.length === 0) {
      return {
        content: 'Aucun contenu texte à transformer.',
        metadata: {
          tokensUsed: 0,
          generatedAt: new Date().toISOString(),
          model: this.model,
        },
      };
    }

    const combinedText = textNodes.join('\n\n');

    const prompts: Record<typeof outputType, string> = {
      document: `Transforme ces idées en un document structuré avec introduction, développement et conclusion. 
Utilise des titres Markdown. Sois complet et professionnel.`,
      pitch: `Crée un pitch convaincant basé sur ces idées. Structure:
1. Le problème
2. La solution
3. La proposition de valeur
4. L'impact attendu
5. Les prochaines étapes`,
      plan: `Crée un plan d'action détaillé basé sur ces idées. Inclus:
- Objectifs clairs
- Étapes numérotées
- Timeline estimée
- Livrables attendus`,
      code: `Génère du code TypeScript basé sur ces concepts. Inclus:
- Types/interfaces
- Fonctions principales
- Commentaires explicatifs
Le code doit être fonctionnel et idiomatique.`,
      prompt: `Crée un prompt IA optimisé basé sur ces idées. Le prompt doit:
- Définir clairement le contexte
- Spécifier la mission
- Inclure le format de réponse attendu
- Être prêt à l'emploi`,
      summary: `Crée un résumé exécutif de ces idées:
- Points clés (bullet points)
- Thèmes identifiés
- Connexions importantes
- Recommandations`,
    };

    try {
      const response = await this.callGroq([
        {
          role: 'system',
          content: `Tu es l'assistant Forge d'IMAGINE. ${prompts[outputType]}
Longueur: ${options?.length || 'medium'}
Format ta réponse en Markdown propre.`,
        },
        {
          role: 'user',
          content: `Idées source:\n\n${combinedText}`,
        },
      ], { temperature: 0.7, maxTokens: 4096 });

      return {
        content: response.choices[0]?.message?.content || '',
        metadata: {
          tokensUsed: response.usage?.total_tokens || 0,
          generatedAt: new Date().toISOString(),
          model: this.model,
        },
      };
    } catch (error) {
      console.error('[Groq] Forge error:', error);
      throw error;
    }
  }

  // ========================================
  // Find similar nodes
  // ========================================

  async findSimilar(
    node: ImagineNode,
    allNodes: ImagineNode[]
  ): Promise<Array<{ node: ImagineNode; similarity: number; reason: string }>> {
    if (node.type !== 'text') return [];

    const content = (node as any).content as string;
    if (!content) return [];

    const otherNodes = allNodes.filter(n => n.id !== node.id && n.type === 'text');
    if (otherNodes.length === 0) return [];

    try {
      const nodesInfo = otherNodes
        .map((n, i) => `[${i}] ${(n as any).content?.slice(0, 200)}`)
        .join('\n');

      const response = await this.callGroq([
        {
          role: 'system',
          content: `Compare une idée avec d'autres et trouve les plus similaires.
Retourne un JSON: { matches: [{ index: number, similarity: 0.0-1.0, reason: "explication courte" }] }
Max 5 matches avec similarity > 0.3. JSON uniquement.`,
        },
        {
          role: 'user',
          content: `Idée principale:\n${content}\n\nAutres idées:\n${nodesInfo}`,
        },
      ], { temperature: 0.3, maxTokens: 512 });

      const parsed = JSON.parse(response.choices[0]?.message?.content || '{"matches":[]}');
      
      return (parsed.matches || [])
        .filter((m: any) => m.index < otherNodes.length)
        .map((m: any) => ({
          node: otherNodes[m.index],
          similarity: m.similarity,
          reason: m.reason || '',
        }));
    } catch (error) {
      console.error('[Groq] FindSimilar error:', error);
      return [];
    }
  }

  // ========================================
  // Chat with AI about ideas
  // ========================================

  async chat(
    message: string,
    context: { nodes: ImagineNode[]; history?: GroqMessage[] }
  ): Promise<string> {
    const textContents = context.nodes
      .filter(n => n.type === 'text')
      .map(n => (n as any).content)
      .filter(Boolean)
      .join('\n---\n');

    try {
      const messages: GroqMessage[] = [
        {
          role: 'system',
          content: `Tu es l'assistant IA d'IMAGINE, un IDE de pensée augmentée. 
Tu aides l'utilisateur à explorer, connecter et développer ses idées.
Sois créatif, perspicace et constructif. Pose des questions pour approfondir.

Contexte - Idées de l'utilisateur:
${textContents || 'Aucune idée encore'}`,
        },
        ...(context.history || []),
        {
          role: 'user',
          content: message,
        },
      ];

      const response = await this.callGroq(messages, { temperature: 0.8 });
      return response.choices[0]?.message?.content || 'Je n\'ai pas pu générer de réponse.';
    } catch (error) {
      console.error('[Groq] Chat error:', error);
      throw error;
    }
  }

  // ========================================
  // Suggest connection labels between two nodes
  // ========================================

  async suggestConnectionLabel(
    fromNode: ImagineNode,
    toNode: ImagineNode
  ): Promise<ConnectionSuggestion[]> {
    const getContent = (node: ImagineNode): string => {
      if (node.type === 'text') return (node as any).content || '';
      if (node.type === 'ai') return (node as any).prompt || '';
      if (node.type === 'code') return (node as any).content || '';
      return '';
    };

    const fromContent = getContent(fromNode);
    const toContent = getContent(toNode);

    if (!fromContent || !toContent) {
      return [{
        label: 'lié à',
        type: 'semantic',
        confidence: 0.5,
        explanation: 'Connexion par défaut',
      }];
    }

    try {
      const response = await this.callGroq([
        {
          role: 'system',
          content: `Tu analyses des connexions entre idées. Suggère des labels descriptifs pour le lien.
Retourne un JSON avec un tableau "suggestions":
[{
  "label": "verbe ou expression courte",
  "type": "causal|semantic|temporal|conflict|support",
  "confidence": 0.0-1.0,
  "explanation": "pourquoi ce label"
}]

Types de relations:
- causal: cause/effet (mène à, provoque, permet)
- semantic: thématique (lié à, similaire à, complète)
- temporal: séquence (précède, suit, pendant)
- conflict: opposition (contredit, s'oppose à, questionne)
- support: renforcement (confirme, soutient, valide)

Max 4 suggestions. JSON uniquement.`,
        },
        {
          role: 'user',
          content: `Idée source:\n${fromContent}\n\nIdée cible:\n${toContent}`,
        },
      ], { temperature: 0.6, maxTokens: 512 });

      const parsed = JSON.parse(response.choices[0]?.message?.content || '{"suggestions":[]}');
      return parsed.suggestions || [{
        label: 'lié à',
        type: 'semantic',
        confidence: 0.5,
        explanation: 'Connexion sémantique',
      }];
    } catch (error) {
      console.error('[Groq] SuggestConnectionLabel error:', error);
      return [{
        label: 'lié à',
        type: 'semantic',
        confidence: 0.5,
        explanation: 'Connexion par défaut',
      }];
    }
  }

  // ========================================
  // Generate metadata for a new node
  // ========================================

  async generateNodeMetadata(
    node: ImagineNode,
    contextNodes: ImagineNode[] = []
  ): Promise<NodeMetadataSuggestion> {
    const getContent = (n: ImagineNode): string => {
      if (n.type === 'text') return (n as any).content || '';
      if (n.type === 'ai') return (n as any).prompt || '';
      if (n.type === 'code') return (n as any).content || '';
      return '';
    };

    const content = getContent(node);
    
    if (!content || content.length < 5) {
      return {
        tags: [],
        keywords: [],
        description: '',
        importance: 'medium',
        relatedConcepts: [],
      };
    }

    // Get context from nearby nodes
    const contextText = contextNodes
      .slice(0, 5)
      .map(n => getContent(n))
      .filter(Boolean)
      .join('\n---\n');

    try {
      const response = await this.callGroq([
        {
          role: 'system',
          content: `Tu analyses une idée et génères des métadonnées structurées.
Retourne un JSON:
{
  "tags": ["tag1", "tag2", "tag3"], // 3-5 tags courts
  "keywords": ["mot1", "mot2"], // 3-7 mots-clés
  "description": "Une phrase résumant l'idée", // Max 100 caractères
  "category": "catégorie principale", // optionnel
  "importance": "low|medium|high", // basé sur la profondeur/impact
  "relatedConcepts": ["concept1", "concept2"] // concepts connexes à explorer
}

Sois précis et pertinent. JSON uniquement.`,
        },
        {
          role: 'user',
          content: `Idée à analyser:\n${content}\n\n${contextText ? `Contexte (autres idées):\n${contextText}` : ''}`,
        },
      ], { temperature: 0.5, maxTokens: 512 });

      const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
      return {
        tags: parsed.tags || [],
        keywords: parsed.keywords || [],
        description: parsed.description || '',
        category: parsed.category,
        importance: parsed.importance || 'medium',
        relatedConcepts: parsed.relatedConcepts || [],
      };
    } catch (error) {
      console.error('[Groq] GenerateNodeMetadata error:', error);
      
      // Fallback: simple extraction
      const words = content.toLowerCase().split(/\s+/).filter(w => w.length > 4);
      const uniqueWords = [...new Set(words)].slice(0, 5);
      
      return {
        tags: uniqueWords.slice(0, 3),
        keywords: uniqueWords,
        description: content.slice(0, 100),
        importance: 'medium',
        relatedConcepts: [],
      };
    }
  }

  // ========================================
  // Analyze canvas and suggest all connections
  // ========================================

  async analyzeCanvasConnections(
    nodes: ImagineNode[],
    existingEdges: Array<{ fromNodeId: string; toNodeId: string }>
  ): Promise<Array<{
    fromNodeId: string;
    toNodeId: string;
    label: string;
    type: string;
    confidence: number;
    explanation: string;
  }>> {
    const textNodes = nodes.filter(n => n.type === 'text') as Array<ImagineNode & { content: string }>;
    
    if (textNodes.length < 2) return [];

    const nodesInfo = textNodes
      .map((n, i) => `[${i}] ID:${n.id.slice(0, 8)}\n${n.content?.slice(0, 200) || ''}`)
      .join('\n\n');

    const existingLinks = existingEdges
      .map(e => `${e.fromNodeId.slice(0, 8)} -> ${e.toNodeId.slice(0, 8)}`)
      .join(', ');

    try {
      const response = await this.callGroq([
        {
          role: 'system',
          content: `Tu analyses un réseau d'idées et suggères des connexions manquantes.
Retourne un JSON avec "connections":
[{
  "fromIndex": number,
  "toIndex": number,
  "label": "verbe descriptif",
  "type": "causal|semantic|temporal|conflict|support",
  "confidence": 0.0-1.0,
  "explanation": "pourquoi connecter"
}]

Labels suggérés:
- Causal: mène à, provoque, permet, cause, déclenche
- Semantic: complète, enrichit, illustre, précise
- Temporal: précède, suit, pendant, avant, après
- Conflict: contredit, s'oppose à, questionne, remet en cause
- Support: confirme, soutient, valide, renforce

Max 5 connexions les plus pertinentes. JSON uniquement.`,
        },
        {
          role: 'user',
          content: `Idées du canvas:\n\n${nodesInfo}\n\nConnexions existantes: ${existingLinks || 'aucune'}`,
        },
      ], { temperature: 0.5, maxTokens: 1024 });

      const parsed = JSON.parse(response.choices[0]?.message?.content || '{"connections":[]}');
      
      return (parsed.connections || [])
        .filter((c: any) => c.fromIndex < textNodes.length && c.toIndex < textNodes.length)
        .map((c: any) => ({
          fromNodeId: textNodes[c.fromIndex].id,
          toNodeId: textNodes[c.toIndex].id,
          label: c.label || 'lié à',
          type: c.type || 'semantic',
          confidence: c.confidence || 0.5,
          explanation: c.explanation || '',
        }));
    } catch (error) {
      console.error('[Groq] AnalyzeCanvasConnections error:', error);
      return [];
    }
  }
}

// Export singleton instance
export const aiService = new GroqAIService();
export default aiService;
