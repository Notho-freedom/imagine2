// ========================================
// IMAGINE - AI API Route
// API pour les suggestions IA avec Groq
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'analyze': {
        // Analyze nodes and suggest connections using Groq
        const nodes = data?.nodes || [];
        const result = await aiService.analyzeNodes(nodes);
        return NextResponse.json({
          success: true,
          result,
        });
      }

      case 'reformulate': {
        // Reformulate text using Groq
        const text = data?.text || '';
        const style = data?.style || 'concise';
        const reformulated = await aiService.reformulate(text, style);
        return NextResponse.json({
          success: true,
          result: {
            text,
            reformulated,
          },
        });
      }

      case 'suggest': {
        // Generate suggestions using Groq
        const node = data?.node;
        const context = data?.context || [];
        if (!node) {
          return NextResponse.json({
            success: true,
            result: { suggestions: [] },
          });
        }
        const suggestions = await aiService.suggestForNode(node, context);
        return NextResponse.json({
          success: true,
          result: { suggestions },
        });
      }

      case 'forge': {
        // Transform to deliverable using Groq
        const forgeResult = await aiService.forge({
          nodes: data?.nodes || [],
          outputType: data?.outputType || 'document',
          options: data?.options,
        });
        return NextResponse.json({
          success: true,
          result: forgeResult,
        });
      }

      case 'chat': {
        // Chat with AI about ideas
        const message = data?.message || '';
        const context = {
          nodes: data?.nodes || [],
          history: data?.history || [],
        };
        const response = await aiService.chat(message, context);
        return NextResponse.json({
          success: true,
          result: { response },
        });
      }

      case 'findSimilar': {
        // Find similar nodes
        const node = data?.node;
        const allNodes = data?.allNodes || [];
        if (!node) {
          return NextResponse.json({
            success: true,
            result: { matches: [] },
          });
        }
        const matches = await aiService.findSimilar(node, allNodes);
        return NextResponse.json({
          success: true,
          result: { matches },
        });
      }

      case 'suggestConnectionLabel': {
        // Suggest labels for a connection between two nodes
        const fromNode = data?.fromNode;
        const toNode = data?.toNode;
        if (!fromNode || !toNode) {
          return NextResponse.json({
            success: true,
            result: { suggestions: [{ label: 'lié à', type: 'semantic', confidence: 0.5 }] },
          });
        }
        const suggestions = await aiService.suggestConnectionLabel(fromNode, toNode);
        return NextResponse.json({
          success: true,
          result: { suggestions },
        });
      }

      case 'generateMetadata': {
        // Generate metadata for a node
        const node = data?.node;
        const contextNodes = data?.contextNodes || [];
        if (!node) {
          return NextResponse.json({
            success: true,
            result: { tags: [], keywords: [], description: '', importance: 'medium', relatedConcepts: [] },
          });
        }
        const metadata = await aiService.generateNodeMetadata(node, contextNodes);
        return NextResponse.json({
          success: true,
          result: metadata,
        });
      }

      case 'analyzeConnections': {
        // Analyze canvas and suggest all connections
        const nodes = data?.nodes || [];
        const existingEdges = data?.existingEdges || [];
        const connections = await aiService.analyzeCanvasConnections(nodes, existingEdges);
        return NextResponse.json({
          success: true,
          result: { connections },
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Action inconnue' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[AI API Error]', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Check if API key is configured
  const hasApiKey = !!process.env.GROQ_API_KEY;
  
  return NextResponse.json({
    status: hasApiKey ? 'ok' : 'missing_api_key',
    version: '1.0.0',
    capabilities: ['analyze', 'reformulate', 'suggest', 'forge', 'chat', 'findSimilar'],
    configured: hasApiKey,
  });
}
