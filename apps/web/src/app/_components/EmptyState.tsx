'use client';

import React from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <p className="empty-state-title">{title}</p>
      <p className="empty-state-desc">{description}</p>
      {action && (
        action.href ? (
          <a href={action.href} className="empty-state-action">{action.label}</a>
        ) : (
          <button className="empty-state-action" onClick={action.onClick}>{action.label}</button>
        )
      )}
    </div>
  );
}
