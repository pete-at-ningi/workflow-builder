import { promises as fs } from 'fs';
import path from 'path';
import { Workflow, WorkflowListItem } from '@/types/workflow';

const DATA_DIR = path.join(process.cwd(), 'data');
const WORKFLOWS_FILE = path.join(DATA_DIR, 'workflows.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Read workflows from file
export async function getWorkflows(): Promise<Workflow[]> {
  await ensureDataDir();
  
  try {
    const data = await fs.readFile(WORKFLOWS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or is empty, return empty array
    return [];
  }
}

// Write workflows to file
export async function saveWorkflows(workflows: Workflow[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(WORKFLOWS_FILE, JSON.stringify(workflows, null, 2));
}

// Get workflow by ID
export async function getWorkflowById(id: string): Promise<Workflow | null> {
  const workflows = await getWorkflows();
  return workflows.find(workflow => workflow.id === id) || null;
}

// Save a single workflow
export async function saveWorkflow(workflow: Workflow): Promise<void> {
  const workflows = await getWorkflows();
  const existingIndex = workflows.findIndex(w => w.id === workflow.id);
  
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
  const filteredWorkflows = workflows.filter(workflow => workflow.id !== id);
  await saveWorkflows(filteredWorkflows);
}

// Get workflow list items (for home page)
export async function getWorkflowListItems(): Promise<WorkflowListItem[]> {
  const workflows = await getWorkflows();
  return workflows.map(workflow => ({
    id: workflow.id,
    name: workflow.name,
    description: workflow.description,
    createdBy: workflow.createdBy,
    createdAt: workflow.createdAt,
    updatedAt: workflow.updatedAt,
  }));
}
