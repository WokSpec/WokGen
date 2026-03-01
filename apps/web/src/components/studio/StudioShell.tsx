/**
 * StudioShell — shared 3-panel studio layout
 *
 * Layout:
 *   [AppShell sidebar 56px] | [ControlPanel --panel-width] | [OutputCanvas flex-1]
 *
 * Usage:
 *   <StudioShell mode="pixel" controlPanel={<PixelControls />}>
 *     <OutputArea />
 *   </StudioShell>
 */

import type { ModeId } from '@/lib/modes';
import { getMode } from '@/lib/modes';

interface StudioShellProps {
  /** Studio mode — drives accent color theming */
  mode: ModeId;
  /** Left control panel content (prompt form, settings, presets) */
  controlPanel: React.ReactNode;
  /** Main output canvas (image result, idle state, loading state) */
  children: React.ReactNode;
  /** Optional title shown in the control panel header */
  title?: string;
  /** Optional extra actions rendered in the panel header (badges, toggles) */
  headerActions?: React.ReactNode;
}

export function StudioShell({
  mode,
  controlPanel,
  children,
  title,
  headerActions,
}: StudioShellProps) {
  const modeConfig = getMode(mode);

  return (
    <div
      className="studio-layout studio-shell"
      style={{ '--studio-accent': modeConfig.accentColor } as React.CSSProperties}
    >
      {/* ── Control panel (left) ───────────────────────────── */}
      <div className="studio-shell__panel">
        {(title || headerActions) && (
          <div className="studio-shell__panel-header">
            {title && (
              <span className="studio-shell__panel-title">{title}</span>
            )}
            {headerActions && (
              <div className="studio-shell__panel-actions">{headerActions}</div>
            )}
          </div>
        )}
        <div className="studio-shell__panel-body">
          {controlPanel}
        </div>
      </div>

      {/* ── Output canvas (right, flex-1) ──────────────────── */}
      <div className="studio-shell__canvas">
        {children}
      </div>
    </div>
  );
}
