'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, TaskAssignee } from '@/types/workflow';

interface TaskComponentProps {
  task: Task;
  onUpdate: (updates: Partial<Task>) => void;
  onDelete: () => void;
}

const assigneeOptions: { value: TaskAssignee; label: string }[] = [
  { value: 'client', label: 'Client' },
  { value: 'advisor', label: 'Advisor' },
  { value: 'administrator', label: 'Administrator' },
  { value: 'power planner', label: 'Power Planner' },
];

export default function TaskComponent({ task, onUpdate, onDelete }: TaskComponentProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getAssigneeColor = (assignee: TaskAssignee) => {
    switch (assignee) {
      case 'client':
        return 'bg-blue-100 text-blue-800';
      case 'advisor':
        return 'bg-green-100 text-green-800';
      case 'administrator':
        return 'bg-purple-100 text-purple-800';
      case 'power planner':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-gray-50 rounded-lg p-4 border border-gray-200 ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab hover:cursor-grabbing text-gray-400 hover:text-gray-600"
            >
              ⋮⋮
            </div>
            <input
              type="text"
              value={task.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className="font-medium text-gray-900 bg-transparent border-none outline-none flex-1"
              placeholder="Task title..."
            />
          </div>
          <textarea
            value={task.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            className="text-gray-600 bg-transparent border-none outline-none w-full resize-none text-sm"
            rows={2}
            placeholder="Task description..."
          />
        </div>
        <div className="flex items-center gap-2 ml-4">
          <select
            value={task.assignedTo}
            onChange={(e) => onUpdate({ assignedTo: e.target.value as TaskAssignee })}
            className="text-xs px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {assigneeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className={`px-2 py-1 rounded-md text-xs font-medium ${getAssigneeColor(task.assignedTo)}`}>
            {assigneeOptions.find(opt => opt.value === task.assignedTo)?.label}
          </span>
          <button
            onClick={onDelete}
            className="text-red-500 hover:text-red-700 text-sm"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
