'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Stage, Task } from '@/types/workflow';
import TaskComponent from './TaskComponent';

interface StageComponentProps {
  stage: Stage;
  onUpdate: (updates: Partial<Stage>) => void;
  onDelete: () => void;
  onAddTask: () => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
}

export default function StageComponent({
  stage,
  onUpdate,
  onDelete,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
}: StageComponentProps) {
  const [showOutcomes, setShowOutcomes] = useState(false);
  const [newOutcome, setNewOutcome] = useState('');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const addOutcome = () => {
    if (newOutcome.trim() && !stage.outcomes.includes(newOutcome.trim())) {
      onUpdate({ outcomes: [...stage.outcomes, newOutcome.trim()] });
      setNewOutcome('');
    }
  };

  const removeOutcome = (outcome: string) => {
    onUpdate({ outcomes: stage.outcomes.filter((o) => o !== outcome) });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl shadow-lg p-6 border border-gray-100 ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      {/* Stage Header */}
      <div className='flex items-start justify-between mb-4'>
        <div className='flex-1'>
          <div className='flex items-center gap-2 mb-2'>
            <div
              {...attributes}
              {...listeners}
              className='cursor-grab hover:cursor-grabbing text-gray-400 hover:text-gray-600'
            >
              ⋮⋮
            </div>
              <input
                type='text'
                value={stage.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                className='text-xl font-semibold text-dark bg-transparent border-none outline-none flex-1'
                style={{ fontFamily: 'var(--font-headers)' }}
              />
          </div>
          <textarea
            value={stage.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            className='text-gray-600 bg-transparent border-none outline-none w-full resize-none'
            rows={2}
            placeholder='Stage description...'
          />
        </div>
        <div className='flex gap-2 ml-4'>
          <button
            onClick={() => setShowOutcomes(!showOutcomes)}
            className='bg-blue/10 text-blue px-3 py-1 rounded-lg text-sm hover:bg-blue/20 transition-colors font-medium'
            style={{ fontFamily: 'var(--font-headers)' }}
          >
            {stage.outcomes.length} Outcomes
          </button>
          <button
            onClick={onAddTask}
            className='bg-purple/10 text-purple px-3 py-1 rounded-lg text-sm hover:bg-purple/20 transition-colors font-medium'
            style={{ fontFamily: 'var(--font-headers)' }}
          >
            + Task
          </button>
          <button
            onClick={onDelete}
            className='bg-red-100 text-red-600 px-3 py-1 rounded-lg text-sm hover:bg-red-200 transition-colors font-medium'
            style={{ fontFamily: 'var(--font-headers)' }}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Outcomes Section */}
      {showOutcomes && (
        <div className='mb-4 p-4 bg-gray-50 rounded-lg'>
          <h4 className='text-sm font-medium text-dark mb-2' style={{ fontFamily: 'var(--font-headers)' }}>
            Stage Outcomes
          </h4>
          <div className='flex flex-wrap gap-2 mb-3'>
            {stage.outcomes.map((outcome) => (
              <span
                key={outcome}
                className='bg-purple/10 text-purple px-3 py-1 rounded-lg text-sm flex items-center gap-1 font-medium'
                style={{ fontFamily: 'var(--font-headers)' }}
              >
                {outcome}
                <button
                  onClick={() => removeOutcome(outcome)}
                  className='text-purple hover:text-purple/70 ml-1'
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className='flex gap-2'>
            <input
              type='text'
              value={newOutcome}
              onChange={(e) => setNewOutcome(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addOutcome()}
              className='flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple focus:border-transparent transition-all'
              placeholder='Add new outcome...'
            />
            <button
              onClick={addOutcome}
              className='bg-purple text-white px-4 py-2 rounded-lg text-sm hover:opacity-90 transition-all font-medium'
              style={{ fontFamily: 'var(--font-headers)' }}
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Tasks */}
      <div className='space-y-3'>
        {stage.tasks.length === 0 ? (
          <div className='text-center py-8 text-gray-500'>
            <p>No tasks yet. Click &quot;+ Task&quot; to add one.</p>
          </div>
        ) : (
          stage.tasks.map((task) => (
            <TaskComponent
              key={task.id}
              task={task}
              onUpdate={(updates) => onUpdateTask(task.id, updates)}
              onDelete={() => onDeleteTask(task.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
