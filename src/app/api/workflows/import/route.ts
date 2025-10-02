import { NextRequest, NextResponse } from 'next/server';
import { saveWorkflow } from '@/lib/database';
import { Workflow } from '@/types/workflow';

// POST /api/workflows/import - Import a workflow from JSON
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the imported workflow structure
    if (!body.name || !body.description || !body.createdBy) {
      return NextResponse.json(
        {
          error:
            'Invalid workflow format. Missing required fields: name, description, createdBy',
        },
        { status: 400 }
      );
    }

    // Generate new ID and timestamps for imported workflow
    const importedWorkflow: Workflow = {
      ...body,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Ensure stages have proper IDs and order
      stages: (body.stages || []).map((stage: unknown, index: number) => {
        const s = stage as Record<string, unknown>;
        return {
          ...s,
          id: s.id || crypto.randomUUID(),
          order: s.order !== undefined ? s.order : index,
          tasks: ((s.tasks as unknown[]) || []).map((task: unknown) => {
            const t = task as Record<string, unknown>;
            return {
              ...t,
              id: t.id || crypto.randomUUID(),
            };
          }),
        };
      }),
    };

    await saveWorkflow(importedWorkflow);
    return NextResponse.json(importedWorkflow, { status: 201 });
  } catch (error) {
    console.error('Error importing workflow:', error);
    return NextResponse.json(
      { error: 'Failed to import workflow' },
      { status: 500 }
    );
  }
}
