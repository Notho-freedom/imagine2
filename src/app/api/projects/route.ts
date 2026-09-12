// ========================================
// IMAGINE - Projects API Route
// API CRUD pour les projets
// ========================================

import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for MVP
// In production, use database
const projects = new Map<string, any>();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    const project = projects.get(id);
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Projet non trouvé' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, project });
  }

  // Return all projects
  const allProjects = Array.from(projects.values());
  return NextResponse.json({ success: true, projects: allProjects });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const project = {
      id,
      name: name || 'Nouveau projet',
      description: description || '',
      createdAt: now,
      updatedAt: now,
      ownerId: 'user', // In production, get from auth
      settings: {
        gridEnabled: true,
        gridSize: 40,
        snapToGrid: false,
        defaultNodeType: 'text',
        aiEnabled: true,
      },
      nodes: [],
      edges: [],
    };

    projects.set(id, project);

    return NextResponse.json({ success: true, project }, { status: 201 });
  } catch (error) {
    console.error('[Projects API Error]', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requis' },
        { status: 400 }
      );
    }

    const project = projects.get(id);
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Projet non trouvé' },
        { status: 404 }
      );
    }

    const updates = await request.json();
    const updatedProject = {
      ...project,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    projects.set(id, updatedProject);

    return NextResponse.json({ success: true, project: updatedProject });
  } catch (error) {
    console.error('[Projects API Error]', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { success: false, error: 'ID requis' },
      { status: 400 }
    );
  }

  if (!projects.has(id)) {
    return NextResponse.json(
      { success: false, error: 'Projet non trouvé' },
      { status: 404 }
    );
  }

  projects.delete(id);

  return NextResponse.json({ success: true });
}
