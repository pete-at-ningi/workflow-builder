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

export default function WorkflowEditor() {
  const params = useParams();
  const router = useRouter();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddStage, setShowAddStage] = useState(false);
  const [newStage, setNewStage] = useState({
    name: '',
    description: '',
    outcomes: ['Complete', 'Failed'],
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchWorkflow = async (id: string) => {
    try {
      const response = await fetch(`/api/workflows/${id}`);
      if (response.ok) {
        const data = await response.json();
        setWorkflow(data);
      } else {
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

    setSaving(true);
    try {
      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflow),
      });

      if (response.ok) {
        const updatedWorkflow = await response.json();
        setWorkflow(updatedWorkflow);
      }
    } catch (error) {
      console.error('Error saving workflow:', error);
    } finally {
      setSaving(false);
    }
  };

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
          }
        }
      }
    }
  };

  const addStage = () => {
    if (!workflow || !newStage.name.trim()) return;

    const stage: Stage = {
      id: `stage-${crypto.randomUUID()}`,
      name: newStage.name,
      description: newStage.description,
      outcomes: newStage.outcomes,
      tasks: [],
      order: workflow.stages.length,
    };

    setWorkflow({
      ...workflow,
      stages: [...workflow.stages, stage],
    });

    setNewStage({
      name: '',
      description: '',
      outcomes: ['Complete', 'Failed'],
    });
    setShowAddStage(false);
  };

  const updateStage = (stageId: string, updates: Partial<Stage>) => {
    if (!workflow) return;

    const newStages = workflow.stages.map((stage) =>
      stage.id === stageId ? { ...stage, ...updates } : stage
    );

    setWorkflow({ ...workflow, stages: newStages });
  };

  const deleteStage = (stageId: string) => {
    if (!workflow) return;

    const newStages = workflow.stages
      .filter((stage) => stage.id !== stageId)
      .map((stage, index) => ({ ...stage, order: index }));

    setWorkflow({ ...workflow, stages: newStages });
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
  };

  const deleteTask = (taskId: string) => {
    if (!workflow) return;

    const newStages = workflow.stages.map((stage) => ({
      ...stage,
      tasks: stage.tasks.filter((task) => task.id !== taskId),
    }));

    setWorkflow({ ...workflow, stages: newStages });
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

  const importWorkflow = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importedWorkflow = JSON.parse(text);

      const response = await fetch('/api/workflows/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(importedWorkflow),
      });

      if (response.ok) {
        const newWorkflow = await response.json();
        router.push(`/${newWorkflow.id}`);
      }
    } catch (error) {
      console.error('Error importing workflow:', error);
    }
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
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 py-8'>
        {/* Header */}
        <div className='bg-white rounded-lg shadow-md p-6 mb-8'>
          <div className='flex justify-between items-start mb-4'>
            <div className='flex-1'>
              <input
                type='text'
                value={workflow.name}
                onChange={(e) =>
                  setWorkflow({ ...workflow, name: e.target.value })
                }
                className='text-2xl font-bold text-gray-900 bg-transparent border-none outline-none w-full'
              />
              <textarea
                value={workflow.description}
                onChange={(e) =>
                  setWorkflow({ ...workflow, description: e.target.value })
                }
                className='text-gray-600 bg-transparent border-none outline-none w-full mt-2 resize-none'
                rows={2}
              />
            </div>
            <div className='flex gap-2 ml-4'>
              <button
                onClick={saveWorkflow}
                disabled={saving}
                className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors'
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={exportWorkflow}
                className='bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors'
              >
                Export
              </button>
              <label className='bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors cursor-pointer'>
                Import
                <input
                  type='file'
                  accept='.json'
                  onChange={importWorkflow}
                  className='hidden'
                />
              </label>
              <button
                onClick={() => router.push('/')}
                className='bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors'
              >
                Back to Home
              </button>
            </div>
          </div>
          <div className='text-sm text-gray-500'>
            Created by: {workflow.createdBy} • Created:{' '}
            {new Date(workflow.createdAt).toLocaleDateString()} • Updated:{' '}
            {new Date(workflow.updatedAt).toLocaleDateString()}
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
          <div className='bg-white rounded-lg shadow-md p-6 mt-6'>
            <h3 className='text-lg font-semibold mb-4'>Add New Stage</h3>
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Stage Name
                </label>
                <input
                  type='text'
                  value={newStage.name}
                  onChange={(e) =>
                    setNewStage({ ...newStage, name: e.target.value })
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='Enter stage name'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Description
                </label>
                <textarea
                  value={newStage.description}
                  onChange={(e) =>
                    setNewStage({ ...newStage, description: e.target.value })
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  rows={3}
                  placeholder='Enter stage description'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Outcomes (comma-separated)
                </label>
                <input
                  type='text'
                  value={newStage.outcomes.join(', ')}
                  onChange={(e) =>
                    setNewStage({
                      ...newStage,
                      outcomes: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter((s) => s),
                    })
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='Complete, Failed, Client Rejected'
                />
              </div>
              <div className='flex gap-2'>
                <button
                  onClick={addStage}
                  className='bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors'
                >
                  Add Stage
                </button>
                <button
                  onClick={() => setShowAddStage(false)}
                  className='bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors'
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddStage(true)}
            className='w-full mt-6 bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors'
          >
            + Add New Stage
          </button>
        )}
      </div>
    </div>
  );
}
