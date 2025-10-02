'use client';

import { useState, useEffect } from 'react';

type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface AutosaveIndicatorProps {
  status: AutosaveStatus;
  lastSaved?: Date | null;
}

export default function AutosaveIndicator({ status, lastSaved }: AutosaveIndicatorProps) {

  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          text: 'Saving...',
          icon: '⏳',
          className: 'text-blue-600',
        };
      case 'saved':
        return {
          text: 'Saved',
          icon: '✓',
          className: 'text-green-600',
        };
      case 'error':
        return {
          text: 'Save failed',
          icon: '⚠',
          className: 'text-red-600',
        };
      default:
        return {
          text: 'All changes saved',
          icon: '✓',
          className: 'text-gray-500',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`flex items-center gap-2 text-sm font-medium ${config.className}`}>
      <span className="text-xs">{config.icon}</span>
      <span>{config.text}</span>
      {lastSaved && status === 'idle' && (
        <span className="text-xs text-gray-400 ml-1">
          {lastSaved.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}
