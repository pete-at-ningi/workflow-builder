'use client';

import { useState } from 'react';
import { Workflow } from '@/types/workflow';
import Image from 'next/image';

interface ReadOnlyWorkflowViewerProps {
  workflow: Workflow;
  onClose: () => void;
}

export default function ReadOnlyWorkflowViewer({
  workflow,
  onClose,
}: ReadOnlyWorkflowViewerProps) {
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());

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

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden'>
        {/* Header */}
        <div className='bg-gradient-to-r from-purple/10 to-blue/10 p-6 border-b border-gray-200'>
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
                <h1
                  className='text-2xl font-bold text-dark'
                  style={{ fontFamily: 'var(--font-headers)' }}
                >
                  {workflow.name}
                </h1>
                <p className='text-gray-600 mt-1'>{workflow.description}</p>
                <div className='flex gap-4 text-sm text-gray-500 mt-2'>
                  <span>Created by: {workflow.createdBy}</span>
                  <span>Created: {formatDate(workflow.createdAt)}</span>
                  <span>Updated: {formatDate(workflow.updatedAt)}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className='bg-gray-200 text-dark px-4 py-2 rounded-lg hover:bg-gray-300 hover:scale-105 transition-all duration-200 font-medium cursor-pointer'
              style={{ fontFamily: 'var(--font-headers)' }}
            >
              Close
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='p-6 overflow-y-auto max-h-[calc(90vh-140px)]'>
          <div className='space-y-4'>
            {workflow.stages.map((stage) => (
              <div
                key={stage.id}
                className='bg-gray-50 rounded-lg border border-gray-200'
              >
                {/* Stage Header */}
                <div
                  className='p-4 cursor-pointer hover:bg-gray-100 transition-colors'
                  onClick={() => toggleStage(stage.id)}
                >
                  <div className='flex justify-between items-center'>
                    <div className='flex items-center gap-3'>
                      <div className='text-gray-400'>
                        {expandedStages.has(stage.id) ? '▼' : '▶'}
                      </div>
                      <div>
                        <h3
                          className='text-lg font-semibold text-dark'
                          style={{ fontFamily: 'var(--font-headers)' }}
                        >
                          {stage.name}
                        </h3>
                        <p className='text-sm text-gray-600'>{stage.description}</p>
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='text-sm text-gray-500'>
                        {stage.tasks.length} tasks
                      </span>
                      <div className='flex gap-1'>
                        {stage.outcomes.map((outcome) => (
                          <span
                            key={outcome}
                            className='bg-purple/10 text-purple px-2 py-1 rounded text-xs font-medium'
                            style={{ fontFamily: 'var(--font-headers)' }}
                          >
                            {outcome}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stage Content */}
                {expandedStages.has(stage.id) && (
                  <div className='px-4 pb-4 border-t border-gray-200'>
                    <div className='pt-4 space-y-3'>
                      {stage.tasks.map((task) => (
                        <div
                          key={task.id}
                          className='bg-white rounded-lg p-4 border border-gray-200'
                        >
                          <div className='flex justify-between items-start'>
                            <div className='flex-1'>
                              <h4
                                className='font-medium text-dark mb-1'
                                style={{ fontFamily: 'var(--font-headers)' }}
                              >
                                {task.title}
                              </h4>
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
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
