import { NextRequest, NextResponse } from 'next/server';
import { getWorkflowById } from '@/lib/database';

// GET /api/workflows/[id]/export - Export a workflow as JSON
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workflow = await getWorkflowById(id);

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Set headers for file download
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set(
      'Content-Disposition',
      `attachment; filename="${workflow.name
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase()}.json"`
    );

    return new NextResponse(JSON.stringify(workflow, null, 2), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error exporting workflow:', error);
    return NextResponse.json(
      { error: 'Failed to export workflow' },
      { status: 500 }
    );
  }
}
