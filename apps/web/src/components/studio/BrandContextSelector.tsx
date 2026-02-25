'use client';

import { useState, useEffect } from 'react';

interface BrandKitOption {
  id: string;
  name: string;
}

interface BrandContextSelectorProps {
  value: string | null;
  onChange: (id: string | null) => void;
}

export function BrandContextSelector({ value, onChange }: BrandContextSelectorProps) {
  const [kits, setKits] = useState<BrandKitOption[]>([]);

  useEffect(() => {
    fetch('/api/brand')
      .then(r => r.ok ? r.json() : [])
      .then((data: unknown) => {
        if (Array.isArray(data)) {
          setKits((data as { id: string; name: string }[]).map(k => ({ id: k.id, name: k.name })));
        }
      })
      .catch(() => { /* non-fatal */ });
  }, []);

  if (kits.length === 0) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', flexShrink: 0 }}>
        🎨 Brand
      </span>
      <select
        value={value ?? ''}
        onChange={e => onChange(e.target.value || null)}
        style={{
          flex: 1,
          fontSize: '0.7rem',
          padding: '3px 6px',
          borderRadius: 5,
          border: '1px solid var(--surface-border)',
          background: 'var(--surface-2)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          minWidth: 0,
        }}
        title="Apply brand context to generation"
      >
        <option value="">None</option>
        {kits.map(kit => (
          <option key={kit.id} value={kit.id}>{kit.name}</option>
        ))}
      </select>
    </div>
  );
}
