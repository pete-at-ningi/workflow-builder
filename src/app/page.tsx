'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { WorkflowListItem, Workflow } from '@/types/workflow';

export default function Home() {
  const [workflows, setWorkflows] = useState<WorkflowListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    createdBy: '',
  });
  const [importing, setImporting] = useState(false);
  const [exampleWorkflows, setExampleWorkflows] = useState<Workflow[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDiagram, setShowDiagram] = useState(false);

  useEffect(() => {
    fetchWorkflows();
    fetchExampleWorkflows();
  }, []);

  const fetchExampleWorkflows = async () => {
    try {
      const workflows = [
        '/example-workflows/new-financial-planning-client.json',
        '/example-workflows/annual-review.json',
        '/example-workflows/letter-of-authority.json',
      ];

      const exampleData = await Promise.all(
        workflows.map(async (path) => {
          const response = await fetch(path);
          if (!response.ok) {
            throw new Error(
              `HTTP error! status: ${response.status} for ${path}`
            );
          }
          return response.json();
        })
      );

      setExampleWorkflows(exampleData);
    } catch (error) {
      console.error('Error fetching example workflows:', error);
    }
  };

  const fetchWorkflows = async () => {
    try {
      const response = await fetch('/api/workflows');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setWorkflows(data);
    } catch (error) {
      console.error('Error fetching workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newWorkflow),
      });

      if (response.ok) {
        const createdWorkflow = await response.json();
        setWorkflows([...workflows, createdWorkflow]);
        setNewWorkflow({ name: '', description: '', createdBy: '' });
        setShowCreateForm(false);
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error creating workflow:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleImportWorkflow = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
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
        setWorkflows([...workflows, newWorkflow]);
        // Navigate to the imported workflow
        window.location.href = `/${newWorkflow.id}`;
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error importing workflow:', error);
      alert(
        'Failed to import workflow template. Please check the file format.'
      );
    } finally {
      setImporting(false);
      // Reset the file input
      event.target.value = '';
    }
  };

  const handleDeleteWorkflow = async (
    workflowId: string,
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (
      !confirm(
        'Are you sure you want to delete this workflow template? This action cannot be undone.'
      )
    ) {
      return;
    }

    setDeleting(workflowId);
    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setWorkflows(workflows.filter((w) => w.id !== workflowId));
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting workflow:', error);
      alert('Failed to delete workflow template. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-lg'>Loading workflows...</div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background'>
      <div className='max-w-6xl mx-auto px-4 py-8'>
        <div className='flex justify-between items-center mb-8'>
          <div className='flex items-center gap-4'>
            <Image
              src='/logodark.png'
              alt='Ningi'
              width={453}
              height={132}
              className='h-12 w-auto'
            />
          </div>
          <div className='flex gap-3'>
            <label
              className='bg-blue text-white px-6 py-3 rounded-lg hover:opacity-90 hover:scale-105 transition-all duration-200 font-medium cursor-pointer'
              style={{ fontFamily: 'var(--font-headers)' }}
            >
              {importing ? 'Importing...' : 'Import Workflow Template'}
              <input
                type='file'
                accept='.json'
                onChange={handleImportWorkflow}
                className='hidden'
                disabled={importing}
              />
            </label>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className='bg-purple text-white px-6 py-3 rounded-lg hover:opacity-90 hover:scale-105 transition-all duration-200 font-medium cursor-pointer'
              style={{ fontFamily: 'var(--font-headers)' }}
            >
              {showCreateForm ? 'Cancel' : 'Create New Workflow Template'}
            </button>
          </div>
        </div>

        {showCreateForm ? (
          <div className='bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100'>
            <h2
              className='text-xl font-semibold mb-4 text-dark'
              style={{ fontFamily: 'var(--font-headers)' }}
            >
              Create New Workflow Template
            </h2>
            <form onSubmit={handleCreateWorkflow} className='space-y-4'>
              <div>
                <label
                  htmlFor='name'
                  className='block text-sm font-medium text-dark mb-2'
                  style={{ fontFamily: 'var(--font-headers)' }}
                >
                  Workflow Template Name
                </label>
                <input
                  type='text'
                  id='name'
                  value={newWorkflow.name}
                  onChange={(e) =>
                    setNewWorkflow({ ...newWorkflow, name: e.target.value })
                  }
                  className='w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple focus:border-transparent transition-all'
                  required
                />
              </div>
              <div>
                <label
                  htmlFor='description'
                  className='block text-sm font-medium text-dark mb-2'
                  style={{ fontFamily: 'var(--font-headers)' }}
                >
                  Description
                </label>
                <textarea
                  id='description'
                  value={newWorkflow.description}
                  onChange={(e) =>
                    setNewWorkflow({
                      ...newWorkflow,
                      description: e.target.value,
                    })
                  }
                  className='w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple focus:border-transparent transition-all resize-none'
                  rows={3}
                  required
                />
              </div>
              <div>
                <label
                  htmlFor='createdBy'
                  className='block text-sm font-medium text-dark mb-2'
                  style={{ fontFamily: 'var(--font-headers)' }}
                >
                  Created By
                </label>
                <input
                  type='text'
                  id='createdBy'
                  value={newWorkflow.createdBy}
                  onChange={(e) =>
                    setNewWorkflow({
                      ...newWorkflow,
                      createdBy: e.target.value,
                    })
                  }
                  className='w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple focus:border-transparent transition-all'
                  required
                />
              </div>
              <div className='flex gap-3'>
                <button
                  type='submit'
                  className='bg-purple text-white px-6 py-3 rounded-lg hover:opacity-90 hover:scale-105 transition-all duration-200 font-medium cursor-pointer'
                  style={{ fontFamily: 'var(--font-headers)' }}
                >
                  Create Workflow Template
                </button>
                <button
                  type='button'
                  onClick={() => setShowCreateForm(false)}
                  className='bg-gray-200 text-dark px-6 py-3 rounded-lg hover:bg-gray-300 hover:scale-105 transition-all duration-200 font-medium cursor-pointer'
                  style={{ fontFamily: 'var(--font-headers)' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className='bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100'>
            <h1
              className='text-3xl font-bold text-dark mb-4'
              style={{ fontFamily: 'var(--font-headers)' }}
            >
              Workflow Template Builder
            </h1>

            {/* Collapsible Description */}
            <div className='space-y-3 text-gray-700 leading-relaxed'>
              <div className='flex items-start gap-3'>
                <div className='flex-1'>
                  <p>
                    <strong>What is a Workflow Template?</strong> A workflow
                    template is a reusable blueprint that defines a sequence of
                    stages and tasks for completing a specific process. Each
                    template has a title, description, and is organized into
                    stages.
                  </p>
                </div>
                <button
                  onClick={() => setShowDiagram(!showDiagram)}
                  className='flex-shrink-0 p-2 text-gray-500 hover:text-purple hover:bg-purple/5 rounded-lg transition-all duration-200 cursor-pointer'
                  title={
                    showDiagram
                      ? 'Hide structure diagram'
                      : 'Show structure diagram'
                  }
                >
                  {showDiagram ? '🔽' : '▶️'}
                </button>
              </div>

              {/* Collapsible Visual Diagram */}
              {showDiagram && (
                <div className='mt-4 p-6 bg-gradient-to-r from-purple/5 to-blue/5 rounded-lg border border-purple/20'>
                  <div className='text-sm text-gray-600 mb-4 font-medium'>
                    Workflow Structure:
                  </div>

                  {/* Workflow Level */}
                  <div className='flex justify-center mb-4'>
                    <div className='text-center'>
                      <div className='w-24 h-10 bg-purple/20 rounded border border-purple/30 flex items-center justify-center mb-2'>
                        <span className='text-purple font-medium text-sm'>
                          Workflow
                        </span>
                      </div>
                      <div className='text-gray-500 text-xs'>
                        Title & Description
                      </div>
                    </div>
                  </div>

                  {/* Arrow down */}
                  <div className='flex justify-center mb-4'>
                    <div className='text-gray-400 text-lg'>↓</div>
                  </div>

                  {/* Stages Level */}
                  <div className='flex justify-center gap-3 mb-4'>
                    <div className='text-center'>
                      <div className='w-20 h-8 bg-blue/20 rounded border border-blue/30 flex items-center justify-center mb-2'>
                        <span className='text-blue font-medium text-xs'>
                          Stage 1
                        </span>
                      </div>
                      <div className='text-gray-500 text-xs'>
                        Name, Description
                        <br />& Outcomes
                      </div>
                    </div>
                    <div className='text-center'>
                      <div className='w-20 h-8 bg-blue/20 rounded border border-blue/30 flex items-center justify-center mb-2'>
                        <span className='text-blue font-medium text-xs'>
                          Stage 2
                        </span>
                      </div>
                      <div className='text-gray-500 text-xs'>
                        Name, Description
                        <br />& Outcomes
                      </div>
                    </div>
                    <div className='text-center'>
                      <div className='w-20 h-8 bg-blue/20 rounded border border-blue/30 flex items-center justify-center mb-2'>
                        <span className='text-blue font-medium text-xs'>
                          Stage N
                        </span>
                      </div>
                      <div className='text-gray-500 text-xs'>
                        Name, Description
                        <br />& Outcomes
                      </div>
                    </div>
                  </div>

                  {/* Arrows down from stages */}
                  <div className='flex justify-center gap-3 mb-4'>
                    <div className='text-gray-400 text-sm'>↓</div>
                    <div className='text-gray-400 text-sm'>↓</div>
                    <div className='text-gray-400 text-sm'>↓</div>
                  </div>

                  {/* Tasks Level */}
                  <div className='flex justify-center gap-2'>
                    <div className='text-center'>
                      <div className='w-16 h-6 bg-green/20 rounded border border-green/30 flex items-center justify-center mb-1'>
                        <span className='text-green-600 font-medium text-xs'>
                          Task 1
                        </span>
                      </div>
                      <div className='text-gray-500 text-xs'>
                        Title, Description
                        <br />& Assignee
                      </div>
                    </div>
                    <div className='text-center'>
                      <div className='w-16 h-6 bg-green/20 rounded border border-green/30 flex items-center justify-center mb-1'>
                        <span className='text-green-600 font-medium text-xs'>
                          Task 2
                        </span>
                      </div>
                      <div className='text-gray-500 text-xs'>
                        Title, Description
                        <br />& Assignee
                      </div>
                    </div>
                    <div className='text-center'>
                      <div className='w-16 h-6 bg-green/20 rounded border border-green/30 flex items-center justify-center mb-1'>
                        <span className='text-green-600 font-medium text-xs'>
                          Task 3
                        </span>
                      </div>
                      <div className='text-gray-500 text-xs'>
                        Title, Description
                        <br />& Assignee
                      </div>
                    </div>
                    <div className='text-center'>
                      <div className='w-16 h-6 bg-green/20 rounded border border-green/30 flex items-center justify-center mb-1'>
                        <span className='text-green-600 font-medium text-xs'>
                          Task N
                        </span>
                      </div>
                      <div className='text-gray-500 text-xs'>
                        Title, Description
                        <br />& Assignee
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <p>
                <strong>Structure:</strong> Each stage has a name, description,
                and predefined outcomes (like "Complete", "Failed", "Client
                Rejected"). Within each stage, you can add multiple tasks with
                titles, descriptions, and assign them to specific people
                (Client, Adviser, Administrator, or Paraplanner).
              </p>

              <p>
                <strong>Purpose:</strong> These templates can be deployed and
                utilized in the Ningi Backoffice for specific clients. Instead
                of manually typing out 50 tasks every time you want to do an
                annual review, you simply select the template and it
                automatically creates all the tasks, allocating them to the
                relevant adviser or paraplanner for that client.
              </p>

              <p className='text-sm text-gray-600 bg-blue/5 p-3 rounded-lg border border-blue/20'>
                💡 <strong>Think of it as a shortcut:</strong> Create once, use
                many times. Perfect for standardizing processes and ensuring
                consistency across all client work.
              </p>
            </div>
          </div>
        )}

        {/* Example Workflows Section */}
        {exampleWorkflows.length > 0 && (
          <div className='mb-12'>
            <div className='bg-gradient-to-r from-purple/5 to-blue/5 rounded-xl p-6 border border-purple/20'>
              <div className='flex items-center gap-3 mb-6'>
                <div className='w-1 h-8 bg-gradient-to-b from-purple to-blue rounded-full'></div>
                <h2
                  className='text-2xl font-bold text-dark'
                  style={{ fontFamily: 'var(--font-headers)' }}
                >
                  Example Workflow Templates
                </h2>
                <span className='bg-purple/10 text-purple px-3 py-1 rounded-full text-sm font-medium'>
                  Read Only
                </span>
              </div>
              <p className='text-gray-600 mb-6'>
                These are example workflow templates to help you understand how
                to structure your own. Click on any template to view it in
                detail, you can also duplicate them to get started.
              </p>
              <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                {exampleWorkflows.map((workflow) => {
                  const getExampleId = (workflowId: string) => {
                    switch (workflowId) {
                      case 'example-new-client':
                        return 'new-financial-planning-client';
                      case 'example-annual-review':
                        return 'annual-review';
                      case 'example-loa':
                        return 'letter-of-authority';
                      default:
                        return workflowId;
                    }
                  };

                  return (
                    <div
                      key={workflow.id}
                      className='bg-white rounded-lg p-4 border border-gray-200 hover:border-purple/30 hover:shadow-md transition-all group h-full flex flex-col relative'
                    >
                      <Link
                        href={`/example/${getExampleId(workflow.id)}`}
                        className='flex flex-col h-full cursor-pointer'
                      >
                        <div className='flex items-start justify-between mb-3'>
                          <h3
                            className='text-lg font-semibold text-dark group-hover:text-purple transition-colors flex-1'
                            style={{ fontFamily: 'var(--font-headers)' }}
                          >
                            {workflow.name}
                          </h3>
                          <span className='bg-blue/10 text-blue px-2 py-1 rounded text-xs font-medium ml-2 flex-shrink-0'>
                            Example
                          </span>
                        </div>
                        <p className='text-sm text-gray-600 mb-3 line-clamp-2 flex-1'>
                          {workflow.description}
                        </p>
                        <div className='flex items-center justify-between text-xs text-gray-500 mt-auto'>
                          <span>{workflow.stages.length} stages</span>
                          <span className='text-purple font-medium'>
                            View Details →
                          </span>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Your Workflows Section */}
        <div className='mb-8'>
          <div className='flex items-center gap-3 mb-6'>
            <div className='w-1 h-8 bg-gradient-to-b from-blue to-purple rounded-full'></div>
            <h2
              className='text-2xl font-bold text-dark'
              style={{ fontFamily: 'var(--font-headers)' }}
            >
              Your Workflow Templates
            </h2>
          </div>
        </div>

        {workflows.length === 0 ? (
          <div className='text-center py-16'>
            <div
              className='text-gray-500 text-lg mb-4'
              style={{ fontFamily: 'var(--font-headers)' }}
            >
              No workflow templates yet
            </div>
            <p className='text-gray-400'>
              Create your first workflow template to get started!
            </p>
          </div>
        ) : (
          <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                className='bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all border border-gray-100 hover:border-purple/20 group relative'
              >
                <Link href={`/${workflow.id}`} className='block cursor-pointer'>
                  <h3
                    className='text-xl font-semibold text-dark mb-3 group-hover:text-purple transition-colors'
                    style={{ fontFamily: 'var(--font-headers)' }}
                  >
                    {workflow.name}
                  </h3>
                  <p className='text-gray-600 mb-4 line-clamp-3 leading-relaxed'>
                    {workflow.description}
                  </p>
                  <div className='text-sm text-gray-500 space-y-1 pt-2 border-t border-gray-100'>
                    <div>
                      Created by:{' '}
                      <span className='font-medium'>{workflow.createdBy}</span>
                    </div>
                    <div>Created: {formatDate(workflow.createdAt)}</div>
                    <div>Updated: {formatDate(workflow.updatedAt)}</div>
                  </div>
                </Link>

                {/* Action buttons - only show in development */}
                {process.env.NODE_ENV === 'development' && (
                  <div className='absolute top-3 right-3 flex gap-2'>
                    <button
                      onClick={(e) => handleDeleteWorkflow(workflow.id, e)}
                      disabled={deleting === workflow.id}
                      className='bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200 hover:scale-105 transition-all duration-200 text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
                      style={{ fontFamily: 'var(--font-headers)' }}
                      title='Delete workflow template'
                    >
                      {deleting === workflow.id ? '...' : '🗑️'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
