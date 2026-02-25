import type { Meta, StoryObj } from '@storybook/react';
import { Button, ButtonGroup, IconButton } from './Button';
import { Download, Trash2, Plus, Sparkles } from 'lucide-react';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { variant: 'primary', children: 'Generate' },
};
export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Cancel' },
};
export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Dismiss' },
};
export const Danger: Story = {
  args: { variant: 'danger', children: 'Delete project' },
};
export const Success: Story = {
  args: { variant: 'success', children: 'Published' },
};
export const Outline: Story = {
  args: { variant: 'outline', children: 'View details' },
};
export const Link: Story = {
  args: { variant: 'link', children: 'Learn more' },
};
export const Loading: Story = {
  args: { variant: 'primary', children: 'Generating...', loading: true },
};
export const WithIcon: Story = {
  args: {
    variant: 'primary',
    children: 'Download',
    icon: <Download className="w-4 h-4" />,
  },
};
export const WithIconRight: Story = {
  args: {
    variant: 'secondary',
    children: 'Add tool',
    iconRight: <Plus className="w-4 h-4" />,
  },
};
export const IconOnly: Story = {
  args: {
    variant: 'ghost',
    icon: <Trash2 className="w-4 h-4" />,
    iconOnly: true,
    'aria-label': 'Delete',
  },
};
export const Disabled: Story = {
  args: { variant: 'primary', children: 'Disabled', disabled: true },
};
export const FullWidth: Story = {
  args: { variant: 'primary', children: 'Full width', fullWidth: true },
};
export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      <Button size="xs" variant="primary">Extra Small</Button>
      <Button size="sm" variant="primary">Small</Button>
      <Button size="md" variant="primary">Medium</Button>
      <Button size="lg" variant="primary">Large</Button>
    </div>
  ),
};
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      {(['primary', 'secondary', 'ghost', 'danger', 'success', 'outline', 'link'] as const).map(v => (
        <Button key={v} variant={v}>{v}</Button>
      ))}
    </div>
  ),
};
export const IconButtonStory: Story = {
  name: 'IconButton',
  render: () => (
    <div style={{ display: 'flex', gap: 8 }}>
      <IconButton icon={<Trash2 className="w-4 h-4" />} label="Delete" variant="danger" />
      <IconButton icon={<Plus className="w-4 h-4" />} label="Add" variant="primary" />
      <IconButton icon={<Sparkles className="w-4 h-4" />} label="Generate" />
    </div>
  ),
};
export const ButtonGroupStory: Story = {
  name: 'ButtonGroup',
  render: () => (
    <ButtonGroup>
      <Button variant="secondary" size="sm">Left</Button>
      <Button variant="secondary" size="sm">Middle</Button>
      <Button variant="secondary" size="sm">Right</Button>
    </ButtonGroup>
  ),
};
