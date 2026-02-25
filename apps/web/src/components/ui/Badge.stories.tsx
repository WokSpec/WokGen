import type { Meta, StoryObj } from '@storybook/react';
import { Badge, RarityBadge, ProviderBadge, StatusBadge } from './Badge';

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: { children: 'Default' },
};
export const Accent: Story = {
  args: { variant: 'accent', children: 'Accent' },
};
export const Success: Story = {
  args: { variant: 'success', children: 'Success' },
};
export const Warning: Story = {
  args: { variant: 'warning', children: 'Warning' },
};
export const Danger: Story = {
  args: { variant: 'danger', children: 'Danger' },
};
export const Muted: Story = {
  args: { variant: 'muted', children: 'Muted' },
};
export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Ghost' },
};
export const Uppercase: Story = {
  args: { variant: 'accent', children: 'New', uppercase: true },
};
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      {(['default', 'accent', 'success', 'warning', 'danger', 'muted', 'ghost'] as const).map(v => (
        <Badge key={v} variant={v}>{v}</Badge>
      ))}
    </div>
  ),
};
export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Badge size="xs">XS</Badge>
      <Badge size="sm">SM</Badge>
      <Badge size="md">MD</Badge>
    </div>
  ),
};

// RarityBadge stories
export const RarityCommon: Story = {
  name: 'RarityBadge / Common',
  render: () => <RarityBadge rarity="common" />,
};
export const RarityUncommon: Story = {
  name: 'RarityBadge / Uncommon',
  render: () => <RarityBadge rarity="uncommon" />,
};
export const RarityRare: Story = {
  name: 'RarityBadge / Rare',
  render: () => <RarityBadge rarity="rare" />,
};
export const RarityEpic: Story = {
  name: 'RarityBadge / Epic',
  render: () => <RarityBadge rarity="epic" />,
};
export const RarityLegendary: Story = {
  name: 'RarityBadge / Legendary',
  render: () => <RarityBadge rarity="legendary" />,
};
export const AllRarities: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      {(['common', 'uncommon', 'rare', 'epic', 'legendary'] as const).map(r => (
        <RarityBadge key={r} rarity={r} />
      ))}
    </div>
  ),
};

// ProviderBadge stories
export const ProviderReplicate: Story = {
  name: 'ProviderBadge / Replicate',
  render: () => <ProviderBadge provider="replicate" />,
};
export const ProviderFal: Story = {
  name: 'ProviderBadge / fal.ai',
  render: () => <ProviderBadge provider="fal" />,
};
export const ProviderTogether: Story = {
  name: 'ProviderBadge / Together',
  render: () => <ProviderBadge provider="together" />,
};
export const ProviderComfyUI: Story = {
  name: 'ProviderBadge / ComfyUI',
  render: () => <ProviderBadge provider="comfyui" />,
};
export const AllProviders: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      {(['replicate', 'fal', 'together', 'comfyui'] as const).map(p => (
        <ProviderBadge key={p} provider={p} />
      ))}
    </div>
  ),
};

// StatusBadge stories
export const StatusPending: Story = {
  name: 'StatusBadge / Pending',
  render: () => <StatusBadge status="pending" />,
};
export const StatusRunning: Story = {
  name: 'StatusBadge / Running',
  render: () => <StatusBadge status="running" />,
};
export const StatusSucceeded: Story = {
  name: 'StatusBadge / Succeeded',
  render: () => <StatusBadge status="succeeded" />,
};
export const StatusFailed: Story = {
  name: 'StatusBadge / Failed',
  render: () => <StatusBadge status="failed" />,
};
export const AllStatuses: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      {(['pending', 'running', 'succeeded', 'failed'] as const).map(s => (
        <StatusBadge key={s} status={s} />
      ))}
    </div>
  ),
};
