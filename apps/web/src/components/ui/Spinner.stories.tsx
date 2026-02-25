import type { Meta, StoryObj } from '@storybook/react';
import { Spinner, SpinnerOverlay } from './Spinner';

const meta: Meta<typeof Spinner> = {
  title: 'UI/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
export default meta;
type Story = StoryObj<typeof Spinner>;

export const Default: Story = {};
export const ExtraSmall: Story = {
  args: { size: 'xs' },
};
export const Small: Story = {
  args: { size: 'sm' },
};
export const Medium: Story = {
  args: { size: 'md' },
};
export const Large: Story = {
  args: { size: 'lg' },
};
export const ExtraLarge: Story = {
  args: { size: 'xl' },
};
export const CustomColor: Story = {
  args: { size: 'md', color: '#FFCD75' },
};
export const DangerColor: Story = {
  args: { size: 'md', color: '#EF7D57' },
};
export const SuccessColor: Story = {
  args: { size: 'md', color: '#38B764' },
};
export const CustomPixelSize: Story = {
  args: { size: 48 },
};
export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map(s => (
        <Spinner key={s} size={s} />
      ))}
    </div>
  ),
};
export const WithOverlay: Story = {
  name: 'SpinnerOverlay',
  render: () => (
    <div style={{ background: '#1a1a2e', borderRadius: 8, width: 300 }}>
      <SpinnerOverlay message="Generating your image…" />
    </div>
  ),
};
export const OverlayNoMessage: Story = {
  name: 'SpinnerOverlay (no message)',
  render: () => (
    <div style={{ background: '#1a1a2e', borderRadius: 8, width: 200 }}>
      <SpinnerOverlay />
    </div>
  ),
};
