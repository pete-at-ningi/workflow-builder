'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Workflow, Stage, Task } from '@/types/workflow';
import Image from 'next/image';

export default function ExampleWorkflowViewer() {
  const params = useParams();
  const router = useRouter();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  const [duplicating, setDuplicating] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchExampleWorkflow(params.id as string);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchExampleWorkflow = async (id: string) => {
    try {
      const workflowMap: Record<string, string> = {
        'new-financial-planning-client':
          '/example-workflows/new-financial-planning-client.json',
        'annual-review': '/example-workflows/annual-review.json',
        'letter-of-authority': '/example-workflows/letter-of-authority.json',
      };

      const path = workflowMap[id];
      if (!path) {
        router.push('/');
        return;
      }

      const response = await fetch(path);
      if (response.ok) {
        const data = await response.json();
        setWorkflow(data);
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Error fetching example workflow:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const toggleStage = (stageId: string) => {
    const newExpanded = new Set(expandedStages);
    if (newExpanded.has(stageId)) {
      newExpanded.delete(stageId);
    } else {
      newExpanded.add(stageId);
    }
    setExpandedStages(newExpanded);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getAssigneeColor = (assignee: string) => {
    switch (assignee) {
      case 'client':
        return 'bg-blue/10 text-blue';
      case 'advisor':
        return 'bg-purple/10 text-purple';
      case 'administrator':
        return 'bg-green-100 text-green-700';
      case 'power planner':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleDuplicateWorkflow = async () => {
    if (!workflow) return;
    
    setDuplicating(true);
    try {
      // Create a duplicate with new ID and updated metadata
      const duplicatedWorkflow = {
        ...workflow,
        id: crypto.randomUUID(),
        name: `${workflow.name} (Copy)`,
        createdBy: 'User',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Update stage and task IDs to avoid conflicts
        stages: workflow.stages.map((stage: Stage) => ({
          ...stage,
          id: `stage-${crypto.randomUUID()}`,
          tasks: stage.tasks.map((task: Task) => ({
            ...task,
            id: `task-${crypto.randomUUID()}`,
          })),
        })),
      };

      // Save the duplicated workflow
      const saveResponse = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(duplicatedWorkflow),
      });

      if (saveResponse.ok) {
        const newWorkflow = await saveResponse.json();
        // Navigate to the duplicated workflow
        window.location.href = `/${newWorkflow.id}`;
      } else {
        throw new Error('Failed to save duplicated workflow');
      }
    } catch (error) {
      console.error('Error duplicating workflow:', error);
      alert('Failed to duplicate workflow. Please try again.');
    } finally {
      setDuplicating(false);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-lg'>Loading example workflow...</div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className='min-h-screen flex items-center justify-center text-red-500'>
        Example workflow not found.
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background'>
      <div className='max-w-6xl mx-auto px-4 py-8'>
        {/* Header */}
        <div className='bg-gradient-to-r from-purple/10 to-blue/10 rounded-xl p-6 border border-purple/20 mb-8'>
          <div className='flex justify-between items-start'>
            <div className='flex items-center gap-4'>
              <Image
                src='/logodark.png'
                alt='Ningi'
                width={453}
                height={132}
                className='h-8 w-auto'
              />
              <div>
                <div className='flex items-center gap-3 mb-2'>
                  <h1
                    className='text-2xl font-bold text-dark'
                    style={{ fontFamily: 'var(--font-headers)' }}
                  >
                    {workflow.name}
                  </h1>
                  <span className='bg-purple/10 text-purple px-3 py-1 rounded-full text-sm font-medium'>
                    Example Workflow
                  </span>
                </div>
                <p className='text-gray-600 mb-2'>{workflow.description}</p>
                <div className='flex gap-4 text-sm text-gray-500'>
                  <span>Created by: {workflow.createdBy}</span>
                  <span>Created: {formatDate(workflow.createdAt)}</span>
                  <span>Updated: {formatDate(workflow.updatedAt)}</span>
                </div>
              </div>
            </div>
            <div className='flex gap-3'>
              <button
                onClick={handleDuplicateWorkflow}
                disabled={duplicating}
                className='bg-green-100 text-green-600 px-4 py-2 rounded-lg hover:bg-green-200 hover:scale-105 transition-all duration-200 font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
                style={{ fontFamily: 'var(--font-headers)' }}
              >
                {duplicating ? 'Duplicating...' : '📋 Duplicate'}
              </button>
              <button
                onClick={() => router.push('/')}
                className='bg-gray-200 text-dark px-4 py-2 rounded-lg hover:bg-gray-300 hover:scale-105 transition-all duration-200 font-medium cursor-pointer'
                style={{ fontFamily: 'var(--font-headers)' }}
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className='space-y-4'>
          {workflow.stages.map((stage) => (
            <div
              key={stage.id}
              className='bg-white rounded-xl shadow-lg border border-gray-100'
            >
              {/* Stage Header */}
              <div
                className='p-6 cursor-pointer hover:bg-gray-50 transition-colors'
                onClick={() => toggleStage(stage.id)}
              >
                <div className='flex justify-between items-center'>
                  <div className='flex items-center gap-3'>
                    <div className='text-gray-400 text-lg'>
                      {expandedStages.has(stage.id) ? '▼' : '▶'}
                    </div>
                    <div>
                      <h3
                        className='text-xl font-semibold text-dark'
                        style={{ fontFamily: 'var(--font-headers)' }}
                      >
                        {stage.name}
                      </h3>
                      <p className='text-gray-600 mt-1'>{stage.description}</p>
                    </div>
                  </div>
                  <div className='flex items-center gap-3'>
                    <span className='text-sm text-gray-500'>
                      {stage.tasks.length} tasks
                    </span>
                    <div className='text-sm text-gray-500'>
                      {stage.outcomes.length} outcomes
                    </div>
                  </div>
                </div>
              </div>

              {/* Stage Content */}
              {expandedStages.has(stage.id) && (
                <div className='px-6 pb-6 border-t border-gray-200'>
                  <div className='pt-6 space-y-4'>
                    {/* Outcomes Section */}
                    {stage.outcomes.length > 0 && (
                      <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
                        <h4
                          className='text-sm font-medium text-dark mb-3'
                          style={{ fontFamily: 'var(--font-headers)' }}
                        >
                          Stage Outcomes
                        </h4>
                        <div className='space-y-2'>
                          {stage.outcomes.map((outcome, index) => (
                            <div
                              key={index}
                              className='bg-purple/10 text-purple px-3 py-2 rounded text-sm font-medium'
                              style={{ fontFamily: 'var(--font-headers)' }}
                            >
                              {outcome}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tasks Section */}
                    <div>
                      <h4
                        className='text-sm font-medium text-dark mb-3'
                        style={{ fontFamily: 'var(--font-headers)' }}
                      >
                        Tasks
                      </h4>
                      <div className='space-y-3'>
                        {stage.tasks.map((task) => (
                          <div
                            key={task.id}
                            className='bg-white rounded-lg p-4 border border-gray-200'
                          >
                            <div className='flex justify-between items-start'>
                              <div className='flex-1'>
                                <h5
                                  className='font-medium text-dark mb-1'
                                  style={{ fontFamily: 'var(--font-headers)' }}
                                >
                                  {task.title}
                                </h5>
                                {task.description && (
                                  <p className='text-sm text-gray-600'>
                                    {task.description}
                                  </p>
                                )}
                              </div>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${getAssigneeColor(
                                  task.assignedTo
                                )}`}
                                style={{ fontFamily: 'var(--font-headers)' }}
                              >
                                {task.assignedTo}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
