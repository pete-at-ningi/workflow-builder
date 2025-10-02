'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Workflow, Stage, Task } from '@/types/workflow';
import StageComponent from '@/components/StageComponent';
import AutosaveIndicator from '@/components/AutosaveIndicator';
import { useAutosave } from '@/hooks/useAutosave';
import Image from 'next/image';

export default function WorkflowEditor() {
  const params = useParams();
  const router = useRouter();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddStage, setShowAddStage] = useState(false);
  const [newStage, setNewStage] = useState({
    name: '',
    description: '',
    outcomes: ['Complete', 'Failed'],
  });
  const [newOutcome, setNewOutcome] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchWorkflow = async (id: string) => {
    try {
      console.log('Fetching workflow with ID:', id);
      const response = await fetch(`/api/workflows/${id}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Workflow fetched successfully:', data);
        setWorkflow(data);
      } else {
        console.error('Failed to fetch workflow:', response.status);
        router.push('/');
      }
    } catch (error) {
      console.error('Error fetching workflow:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchWorkflow(params.id as string);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const saveWorkflow = async () => {
    if (!workflow) return;

    try {
      console.log('Saving workflow:', workflow);
      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflow),
      });

      if (response.ok) {
        const updatedWorkflow = await response.json();
        console.log('Workflow saved successfully:', updatedWorkflow);
        setWorkflow(updatedWorkflow);
      } else {
        const errorText = await response.text();
        console.error('Failed to save workflow:', response.status, errorText);
        throw new Error('Failed to save workflow');
      }
    } catch (error) {
      console.error('Error saving workflow:', error);
      throw error;
    }
  };

  // Autosave hook
  const { status, lastSaved, triggerSave } = useAutosave({
    onSave: saveWorkflow,
    delay: 2000,
    enabled: !!workflow,
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!workflow || !over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if we're dragging stages
    if (activeId.startsWith('stage-') && overId.startsWith('stage-')) {
      const oldIndex = workflow.stages.findIndex(
        (stage) => stage.id === activeId
      );
      const newIndex = workflow.stages.findIndex(
        (stage) => stage.id === overId
      );

      if (oldIndex !== newIndex) {
        const newStages = arrayMove(workflow.stages, oldIndex, newIndex);
        setWorkflow({
          ...workflow,
          stages: newStages.map((stage, index) => ({ ...stage, order: index })),
        });
        triggerSave();
      }
    }
    // Check if we're dragging tasks within a stage
    else if (activeId.startsWith('task-') && overId.startsWith('task-')) {
      const activeStageId = activeId.split('-')[1];
      const overStageId = overId.split('-')[1];

      if (activeStageId === overStageId) {
        // Same stage - reorder tasks
        const stageIndex = workflow.stages.findIndex(
          (stage) => stage.id === activeStageId
        );
        if (stageIndex >= 0) {
          const stage = workflow.stages[stageIndex];
          const oldIndex = stage.tasks.findIndex(
            (task) => task.id === activeId
          );
          const newIndex = stage.tasks.findIndex((task) => task.id === overId);

          if (oldIndex !== newIndex) {
            const newTasks = arrayMove(stage.tasks, oldIndex, newIndex);
            const newStages = [...workflow.stages];
            newStages[stageIndex] = { ...stage, tasks: newTasks };
            setWorkflow({ ...workflow, stages: newStages });
            triggerSave();
          }
        }
      } else {
        // Different stages - move task between stages
        const sourceStageIndex = workflow.stages.findIndex(
          (stage) => stage.id === activeStageId
        );
        const targetStageIndex = workflow.stages.findIndex(
          (stage) => stage.id === overStageId
        );

        if (sourceStageIndex >= 0 && targetStageIndex >= 0) {
          const sourceStage = workflow.stages[sourceStageIndex];
          const targetStage = workflow.stages[targetStageIndex];
          const taskIndex = sourceStage.tasks.findIndex(
            (task) => task.id === activeId
          );

          if (taskIndex >= 0) {
            const task = sourceStage.tasks[taskIndex];
            const newStages = [...workflow.stages];

            // Remove from source stage
            newStages[sourceStageIndex] = {
              ...sourceStage,
              tasks: sourceStage.tasks.filter((t) => t.id !== activeId),
            };

            // Add to target stage
            newStages[targetStageIndex] = {
              ...targetStage,
              tasks: [...targetStage.tasks, task],
            };

            setWorkflow({ ...workflow, stages: newStages });
            triggerSave();
          }
        }
      }
    }
  };

  const addStage = () => {
    if (!workflow || !newStage.name.trim()) return;

    // Create a default task for the new stage
    const defaultTask: Task = {
      id: `task-${crypto.randomUUID()}`,
      title: 'New Task',
      description: '',
      assignedTo: 'client',
    };

    const stage: Stage = {
      id: `stage-${crypto.randomUUID()}`,
      name: newStage.name,
      description: newStage.description,
      outcomes: newStage.outcomes,
      tasks: [defaultTask],
      order: workflow.stages.length,
    };

    console.log('Adding new stage:', stage);
    const updatedWorkflow = {
      ...workflow,
      stages: [...workflow.stages, stage],
    };
    console.log('Updated workflow with new stage:', updatedWorkflow);

    setWorkflow(updatedWorkflow);
    triggerSave();

    setNewStage({
      name: '',
      description: '',
      outcomes: ['Complete', 'Failed'],
    });
    setNewOutcome('');
    setShowAddStage(false);
  };

  const updateStage = (stageId: string, updates: Partial<Stage>) => {
    if (!workflow) return;

    const newStages = workflow.stages.map((stage) =>
      stage.id === stageId ? { ...stage, ...updates } : stage
    );

    setWorkflow({ ...workflow, stages: newStages });
    triggerSave();
  };

  const deleteStage = (stageId: string) => {
    if (!workflow) return;

    const newStages = workflow.stages
      .filter((stage) => stage.id !== stageId)
      .map((stage, index) => ({ ...stage, order: index }));

    setWorkflow({ ...workflow, stages: newStages });
    triggerSave();
  };

  const addTask = (stageId: string) => {
    if (!workflow) return;

    const task: Task = {
      id: `task-${stageId}-${crypto.randomUUID()}`,
      title: 'New Task',
      description: '',
      assignedTo: 'client',
    };

    const newStages = workflow.stages.map((stage) =>
      stage.id === stageId ? { ...stage, tasks: [...stage.tasks, task] } : stage
    );

    setWorkflow({ ...workflow, stages: newStages });
    triggerSave();
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    if (!workflow) return;

    const newStages = workflow.stages.map((stage) => ({
      ...stage,
      tasks: stage.tasks.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      ),
    }));

    setWorkflow({ ...workflow, stages: newStages });
    triggerSave();
  };

  const deleteTask = (taskId: string) => {
    if (!workflow) return;

    const newStages = workflow.stages.map((stage) => ({
      ...stage,
      tasks: stage.tasks.filter((task) => task.id !== taskId),
    }));

    setWorkflow({ ...workflow, stages: newStages });
    triggerSave();
  };

  const exportWorkflow = async () => {
    if (!workflow) return;

    try {
      const response = await fetch(`/api/workflows/${workflow.id}/export`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${workflow.name
          .replace(/[^a-z0-9]/gi, '_')
          .toLowerCase()}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting workflow:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const addOutcome = () => {
    if (newOutcome.trim() && !newStage.outcomes.includes(newOutcome.trim())) {
      setNewStage({
        ...newStage,
        outcomes: [...newStage.outcomes, newOutcome.trim()],
      });
      setNewOutcome('');
    }
  };

  const removeOutcome = (outcome: string) => {
    setNewStage({
      ...newStage,
      outcomes: newStage.outcomes.filter((o) => o !== outcome),
    });
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-lg'>Loading workflow...</div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-lg'>Workflow not found</div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background'>
      <div className='max-w-7xl mx-auto px-4 py-8'>
        {/* Top Header - Logo and Back to Home */}
        <div className='flex justify-between items-center mb-6'>
          <div className='flex items-center gap-4'>
            <Image
              src='/logodark.png'
              alt='Ningi'
              width={453}
              height={132}
              className='h-12 w-auto'
            />
          </div>
          <button
            onClick={() => router.push('/')}
            className='bg-gray-200 text-dark px-4 py-2 rounded-lg hover:bg-gray-300 hover:scale-105 transition-all duration-200 font-medium cursor-pointer'
            style={{ fontFamily: 'var(--font-headers)' }}
          >
            Back to Home
          </button>
        </div>

        {/* Controls Line - Export, Save, Save Status */}
        <div className='flex justify-between items-center mb-4'>
          <div className='flex items-center gap-4'>
            <button
              onClick={exportWorkflow}
              className='bg-blue text-white px-4 py-2 rounded-lg hover:opacity-90 hover:scale-105 transition-all duration-200 font-medium cursor-pointer'
              style={{ fontFamily: 'var(--font-headers)' }}
            >
              Export
            </button>
            <button
              onClick={saveWorkflow}
              disabled={status === 'saving'}
              className='bg-purple text-white px-4 py-2 rounded-lg hover:opacity-90 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 font-medium cursor-pointer'
              style={{ fontFamily: 'var(--font-headers)' }}
            >
              {status === 'saving' ? 'Saving...' : 'Save'}
            </button>
          </div>
          <AutosaveIndicator status={status} lastSaved={lastSaved} />
        </div>

        {/* Workflow Details Card */}
        <div className='bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100'>
          {/* Created/Updated Info */}
          <div className='flex gap-4 text-sm text-gray-500 mb-4'>
            <div>Created By: {workflow.createdBy}</div>
            <div>Created: {formatDate(workflow.createdAt)}</div>
            <div>Updated: {formatDate(workflow.updatedAt)}</div>
          </div>

          {/* Title Input */}
          <div className='mb-4'>
            <input
              type='text'
              value={workflow.name}
              onChange={(e) => {
                setWorkflow({ ...workflow, name: e.target.value });
                triggerSave();
              }}
              className='text-2xl font-bold text-dark w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple focus:border-transparent transition-all'
              style={{ fontFamily: 'var(--font-headers)' }}
              placeholder='Workflow title...'
            />
          </div>

          {/* Description Input */}
          <div>
            <textarea
              value={workflow.description}
              onChange={(e) => {
                setWorkflow({ ...workflow, description: e.target.value });
                triggerSave();
                // Auto-resize
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              className='text-gray-600 w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple focus:border-transparent transition-all resize-none overflow-hidden'
              placeholder='Workflow description...'
              rows={2}
            />
          </div>
        </div>

        {/* Stages */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={workflow.stages.map((stage) => stage.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className='space-y-6'>
              {workflow.stages.map((stage) => (
                <StageComponent
                  key={stage.id}
                  stage={stage}
                  onUpdate={(updates) => updateStage(stage.id, updates)}
                  onDelete={() => deleteStage(stage.id)}
                  onAddTask={() => addTask(stage.id)}
                  onUpdateTask={updateTask}
                  onDeleteTask={deleteTask}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Add Stage Button */}
        {showAddStage ? (
          <div className='bg-white rounded-xl shadow-lg p-6 mt-6 border border-gray-100'>
            <h3
              className='text-lg font-semibold mb-4 text-dark'
              style={{ fontFamily: 'var(--font-headers)' }}
            >
              Add New Stage
            </h3>
            <div className='space-y-4'>
              <div>
                <label
                  className='block text-sm font-medium text-dark mb-2'
                  style={{ fontFamily: 'var(--font-headers)' }}
                >
                  Stage Name
                </label>
                <input
                  type='text'
                  value={newStage.name}
                  onChange={(e) =>
                    setNewStage({ ...newStage, name: e.target.value })
                  }
                  className='w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple focus:border-transparent transition-all'
                  placeholder='Enter stage name'
                />
              </div>
              <div>
                <label
                  className='block text-sm font-medium text-dark mb-2'
                  style={{ fontFamily: 'var(--font-headers)' }}
                >
                  Description
                </label>
                <textarea
                  value={newStage.description}
                  onChange={(e) =>
                    setNewStage({ ...newStage, description: e.target.value })
                  }
                  className='w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple focus:border-transparent transition-all resize-none'
                  rows={3}
                  placeholder='Enter stage description'
                />
              </div>
              <div>
                <label
                  className='block text-sm font-medium text-dark mb-2'
                  style={{ fontFamily: 'var(--font-headers)' }}
                >
                  Stage Outcomes
                </label>

                {/* Current Outcomes List */}
                <div className='space-y-2 mb-3'>
                  {newStage.outcomes.map((outcome, index) => (
                    <div
                      key={index}
                      className='flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200'
                    >
                      <div className='flex items-center gap-1 text-gray-400 cursor-move'>
                        <span>⋮⋮</span>
                      </div>
                      <span className='flex-1 text-sm font-medium text-dark'>
                        {outcome}
                      </span>
                      <button
                        onClick={() => removeOutcome(outcome)}
                        className='text-red-500 hover:text-red-700 hover:scale-110 transition-all duration-200 text-sm cursor-pointer'
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add New Outcome */}
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
                    className='bg-purple text-white px-4 py-2 rounded-lg text-sm hover:opacity-90 hover:scale-105 transition-all duration-200 font-medium cursor-pointer'
                    style={{ fontFamily: 'var(--font-headers)' }}
                  >
                    Add
                  </button>
                </div>
              </div>
              <div className='flex gap-3'>
                <button
                  onClick={addStage}
                  className='bg-purple text-white px-6 py-3 rounded-lg hover:opacity-90 hover:scale-105 transition-all duration-200 font-medium cursor-pointer'
                  style={{ fontFamily: 'var(--font-headers)' }}
                >
                  Add Stage
                </button>
                <button
                  onClick={() => setShowAddStage(false)}
                  className='bg-gray-200 text-dark px-6 py-3 rounded-lg hover:bg-gray-300 hover:scale-105 transition-all duration-200 font-medium cursor-pointer'
                  style={{ fontFamily: 'var(--font-headers)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddStage(true)}
            className='w-full mt-6 bg-white border-2 border-dashed border-gray-300 rounded-xl p-8 text-gray-500 hover:border-purple hover:text-purple hover:scale-105 transition-all duration-200 font-medium cursor-pointer'
            style={{ fontFamily: 'var(--font-headers)' }}
          >
            + Add New Stage
          </button>
        )}
      </div>
    </div>
  );
}
