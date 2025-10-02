import { kv } from '@vercel/kv';
import { Workflow, WorkflowListItem } from '@/types/workflow';

const WORKFLOWS_KEY = 'workflows';

// Read workflows from KV store
export async function getWorkflows(): Promise<Workflow[]> {
  try {
    const workflows = await kv.get<Workflow[]>(WORKFLOWS_KEY);
    return workflows || [];
  } catch (error) {
    console.error('Error fetching workflows from KV:', error);
    return [];
  }
}

// Write workflows to KV store
export async function saveWorkflows(workflows: Workflow[]): Promise<void> {
  try {
    await kv.set(WORKFLOWS_KEY, workflows);
  } catch (error) {
    console.error('Error saving workflows to KV:', error);
    throw error;
  }
}

// Get workflow by ID
export async function getWorkflowById(id: string): Promise<Workflow | null> {
  const workflows = await getWorkflows();
  return workflows.find((workflow) => workflow.id === id) || null;
}

// Save a single workflow
export async function saveWorkflow(workflow: Workflow): Promise<void> {
  const workflows = await getWorkflows();
  const existingIndex = workflows.findIndex((w) => w.id === workflow.id);

  if (existingIndex >= 0) {
    workflows[existingIndex] = workflow;
  } else {
    workflows.push(workflow);
  }

  await saveWorkflows(workflows);
}

// Delete a workflow
export async function deleteWorkflow(id: string): Promise<void> {
  const workflows = await getWorkflows();
  const filteredWorkflows = workflows.filter((workflow) => workflow.id !== id);
  await saveWorkflows(filteredWorkflows);
}

// Get workflow list items (for home page)
export async function getWorkflowListItems(): Promise<WorkflowListItem[]> {
  const workflows = await getWorkflows();
  return workflows.map((workflow) => ({
    id: workflow.id,
    name: workflow.name,
    description: workflow.description,
    createdBy: workflow.createdBy,
    createdAt: workflow.createdAt,
    updatedAt: workflow.updatedAt,
  }));
}

