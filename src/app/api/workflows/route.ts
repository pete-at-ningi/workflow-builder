import { NextRequest, NextResponse } from 'next/server';
import { getWorkflowListItems, saveWorkflow } from '@/lib/database';
import { Workflow } from '@/types/workflow';

// GET /api/workflows - Get all workflows (list view)
export async function GET() {
  try {
    const workflows = await getWorkflowListItems();
    return NextResponse.json(workflows);
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    );
  }
}

// POST /api/workflows - Create a new workflow
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, createdBy } = body;

    if (!name || !description || !createdBy) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, createdBy' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const newWorkflow: Workflow = {
      id: crypto.randomUUID(),
      name,
      description,
      createdBy,
      createdAt: now,
      updatedAt: now,
      stages: [],
    };

    await saveWorkflow(newWorkflow);
    return NextResponse.json(newWorkflow, { status: 201 });
  } catch (error) {
    console.error('Error creating workflow:', error);
    return NextResponse.json(
      { error: 'Failed to create workflow' },
      { status: 500 }
    );
  }
}
