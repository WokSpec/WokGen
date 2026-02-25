import { Metadata } from 'next';
import { ShadcnButton } from '@/components/shadcn/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/card';
import { Input } from '@/components/shadcn/input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export const metadata: Metadata = {
  title: 'Design System — WokGen',
  robots: { index: false },
};

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-[#0d0d14] text-white p-8 max-w-5xl mx-auto">
      <div className="mb-12">
        <h1 className="text-3xl font-bold mb-2">WokGen Design System</h1>
        <p className="text-white/40 text-sm">Internal component reference — not indexed</p>
      </div>

      {/* WokGen Native Components */}
      <section className="mb-16">
        <h2 className="text-lg font-semibold mb-6 text-white/60 uppercase tracking-wider text-xs">WokGen Components</h2>

        <div className="mb-8">
          <h3 className="text-sm font-medium mb-3 text-white/80">Button — Variants</h3>
          <div className="flex flex-wrap gap-3">
            {(['primary', 'secondary', 'ghost', 'danger', 'success', 'outline', 'link'] as const).map(v => (
              <Button key={v} variant={v}>{v}</Button>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-medium mb-3 text-white/80">Button — Sizes</h3>
          <div className="flex flex-wrap gap-3 items-center">
            {(['xs', 'sm', 'md', 'lg'] as const).map(s => (
              <Button key={s} size={s} variant="primary">{s}</Button>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-medium mb-3 text-white/80">Badge</h3>
          <div className="flex flex-wrap gap-3">
            <Badge>default</Badge>
          </div>
        </div>
      </section>

      {/* shadcn/ui Components */}
      <section className="mb-16">
        <h2 className="text-lg font-semibold mb-6 text-white/60 uppercase tracking-wider text-xs">shadcn/ui Components</h2>

        <div className="mb-8">
          <h3 className="text-sm font-medium mb-3 text-white/80">Button</h3>
          <div className="flex flex-wrap gap-3">
            {(['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const).map(v => (
              <ShadcnButton key={v} variant={v}>{v}</ShadcnButton>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-medium mb-3 text-white/80">Card</h3>
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Component Card</CardTitle>
                <CardDescription>An example card component using shadcn/ui</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-white/60">Card content goes here.</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-medium mb-3 text-white/80">Input</h3>
          <div className="max-w-sm">
            <Input placeholder="Enter prompt..." className="mb-3" />
            <Input placeholder="Disabled input" disabled />
          </div>
        </div>
      </section>

      {/* Color Palette */}
      <section className="mb-16">
        <h2 className="text-lg font-semibold mb-6 text-white/60 uppercase tracking-wider text-xs">Color Palette</h2>
        <div className="grid grid-cols-4 gap-3">
          {[
            { name: 'Background', value: '#0d0d14' },
            { name: 'Surface', value: '#1a1a2e' },
            { name: 'Border', value: '#252538' },
            { name: 'Accent', value: '#41A6F6' },
            { name: 'Accent Hover', value: '#73EFF7' },
            { name: 'Text Primary', value: '#F4F4F4' },
            { name: 'Text Secondary', value: '#94B0C2' },
            { name: 'Text Muted', value: '#566C86' },
            { name: 'Danger', value: '#EF7D57' },
            { name: 'Success', value: '#38B764' },
            { name: 'Warning', value: '#FFCD75' },
            { name: 'Info', value: '#73EFF7' },
          ].map(c => (
            <div key={c.name} className="rounded-lg overflow-hidden border border-white/5">
              <div className="h-12" style={{ background: c.value }} />
              <div className="p-2">
                <p className="text-xs font-medium text-white/80">{c.name}</p>
                <p className="text-[10px] text-white/30 font-mono">{c.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Typography */}
      <section className="mb-16">
        <h2 className="text-lg font-semibold mb-6 text-white/60 uppercase tracking-wider text-xs">Typography</h2>
        <div className="space-y-4">
          {[
            { label: 'text-3xl', className: 'text-3xl font-bold', text: 'Heading Large' },
            { label: 'text-2xl', className: 'text-2xl font-semibold', text: 'Heading Medium' },
            { label: 'text-xl', className: 'text-xl font-semibold', text: 'Heading Small' },
            { label: 'text-base', className: 'text-base', text: 'Body — Regular text for paragraphs and descriptions' },
            { label: 'text-sm', className: 'text-sm text-white/70', text: 'Small — Labels, captions, secondary info' },
            { label: 'text-xs', className: 'text-xs text-white/40', text: 'Extra small — Timestamps, badges, micro copy' },
          ].map(t => (
            <div key={t.label} className="flex items-baseline gap-6">
              <span className="text-[10px] text-white/20 font-mono w-20 shrink-0">{t.label}</span>
              <span className={t.className}>{t.text}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
