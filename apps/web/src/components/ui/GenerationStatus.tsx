'use client';
import React from 'react';

interface GenerationStatusProps {
  state: 'idle' | 'generating' | 'success' | 'error';
  error?: string;
  progress?: number; // 0-100
}

export function GenerationStatus({ state, error, progress }: GenerationStatusProps) {
  if (state === 'idle') return null;

  if (state === 'generating') {
    return (
      <div className="generation-status generating">
        <div className="spinner" />
        <span>Generating{progress !== undefined ? ` (${progress}%)` : '...'}</span>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="generation-status error">
        <span>{error || 'Generation failed. Please try again.'}</span>
      </div>
    );
  }

  return null;
}
