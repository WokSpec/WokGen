import type { Meta, StoryObj } from '@storybook/react';
import { GenerationStatus } from './GenerationStatus';

const meta: Meta<typeof GenerationStatus> = {
  title: 'UI/GenerationStatus',
  component: GenerationStatus,
  tags: ['autodocs'],
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
export default meta;
type Story = StoryObj<typeof GenerationStatus>;

export const Idle: Story = {
  args: { state: 'idle' },
};
export const Generating: Story = {
  args: { state: 'generating' },
};
export const GeneratingWithProgress: Story = {
  args: { state: 'generating', progress: 65 },
};
export const ErrorDefault: Story = {
  args: { state: 'error' },
};
export const ErrorWithMessage: Story = {
  args: { state: 'error', error: 'Out of credits. Please upgrade your plan.' },
};
