import { Redis } from '@upstash/redis';
import { Workflow, WorkflowListItem } from '@/types/workflow';

// Initialize Redis
const redis = Redis.fromEnv();

const WORKFLOWS_KEY = 'workflows';

// Read workflows from Redis
export async function getWorkflows(): Promise<Workflow[]> {
  try {
    const workflows = await redis.get<Workflow[]>(WORKFLOWS_KEY);
    console.log('Redis: Fetched workflows:', workflows);
    return workflows || [];
  } catch (error) {
    console.error('Error fetching workflows from Redis:', error);
    return [];
  }
}

// Write workflows to Redis
export async function saveWorkflows(workflows: Workflow[]): Promise<void> {
  try {
    console.log('Redis: Saving workflows:', workflows);
    await redis.set(WORKFLOWS_KEY, workflows);
    console.log('Redis: Save successful');
  } catch (error) {
    console.error('Error saving workflows to Redis:', error);
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
  console.log('Database: Saving workflow:', workflow);
  const workflows = await getWorkflows();
  console.log('Database: Current workflows:', workflows);

  const existingIndex = workflows.findIndex((w) => w.id === workflow.id);
  console.log('Database: Existing index:', existingIndex);

  if (existingIndex >= 0) {
    workflows[existingIndex] = workflow;
    console.log('Database: Updated existing workflow at index', existingIndex);
  } else {
    workflows.push(workflow);
    console.log('Database: Added new workflow');
  }

  console.log('Database: Workflows after update:', workflows);
  await saveWorkflows(workflows);
  console.log('Database: Save completed');
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
