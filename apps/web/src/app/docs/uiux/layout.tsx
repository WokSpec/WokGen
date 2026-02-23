import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WokGen UI/UX Docs — React Components, Tailwind Sections & Design-to-Code',
  description:
    'Complete user documentation for WokGen UI/UX. Learn to generate production-ready ' +
    'React components, HTML/Tailwind sections, and Next.js pages. Covers all 18 component ' +
    'types, 8 style presets, prompting guide, output modes, frameworks, workspaces, credits, and FAQ.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
