export type TaskAssignee =
  | 'client'
  | 'advisor'
  | 'administrator'
  | 'power planner';

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: TaskAssignee;
}

export interface Stage {
  id: string;
  name: string;
  description: string;
  outcomes: string[];
  tasks: Task[];
  order: number;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  stages: Stage[];
}

export interface WorkflowListItem {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

