'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { WorkflowListItem } from '@/types/workflow';

export default function Home() {
  const [workflows, setWorkflows] = useState<WorkflowListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    createdBy: '',
  });

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const response = await fetch('/api/workflows');
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

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-lg'>Loading workflows...</div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-6xl mx-auto px-4 py-8'>
        <div className='flex justify-between items-center mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>
            Ningi Workflow Builder
          </h1>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors'
          >
            {showCreateForm ? 'Cancel' : 'Create New Workflow'}
          </button>
        </div>

        {showCreateForm && (
          <div className='bg-white rounded-lg shadow-md p-6 mb-8'>
            <h2 className='text-xl font-semibold mb-4'>Create New Workflow</h2>
            <form onSubmit={handleCreateWorkflow} className='space-y-4'>
              <div>
                <label
                  htmlFor='name'
                  className='block text-sm font-medium text-gray-700 mb-1'
                >
                  Workflow Name
                </label>
                <input
                  type='text'
                  id='name'
                  value={newWorkflow.name}
                  onChange={(e) =>
                    setNewWorkflow({ ...newWorkflow, name: e.target.value })
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  required
                />
              </div>
              <div>
                <label
                  htmlFor='description'
                  className='block text-sm font-medium text-gray-700 mb-1'
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
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  rows={3}
                  required
                />
              </div>
              <div>
                <label
                  htmlFor='createdBy'
                  className='block text-sm font-medium text-gray-700 mb-1'
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
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  required
                />
              </div>
              <div className='flex gap-2'>
                <button
                  type='submit'
                  className='bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors'
                >
                  Create Workflow
                </button>
                <button
                  type='button'
                  onClick={() => setShowCreateForm(false)}
                  className='bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors'
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {workflows.length === 0 ? (
          <div className='text-center py-12'>
            <div className='text-gray-500 text-lg mb-4'>No workflows yet</div>
            <p className='text-gray-400'>
              Create your first workflow to get started!
            </p>
          </div>
        ) : (
          <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {workflows.map((workflow) => (
              <Link
                key={workflow.id}
                href={`/${workflow.id}`}
                className='bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer'
              >
                <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                  {workflow.name}
                </h3>
                <p className='text-gray-600 mb-4 line-clamp-3'>
                  {workflow.description}
                </p>
                <div className='text-sm text-gray-500 space-y-1'>
                  <div>Created by: {workflow.createdBy}</div>
                  <div>Created: {formatDate(workflow.createdAt)}</div>
                  <div>Updated: {formatDate(workflow.updatedAt)}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
