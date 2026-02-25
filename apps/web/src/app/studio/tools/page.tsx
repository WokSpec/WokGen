import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Studio Tools — WokGen',
  description: 'Post-processing tools for your generated assets.',
};

const STUDIO_TOOLS = [
  { name: 'Background Remover', href: '/tools/background-remover', desc: 'Remove background from any image', category: 'Image' },
  { name: 'Vectorize', href: '/tools/vectorize', desc: 'Convert raster images to SVG vectors', category: 'Image' },
  { name: 'Image Resize', href: '/tools/image-resize', desc: 'Resize and crop images to any dimensions', category: 'Image' },
  { name: 'Image Compress', href: '/tools/image-compress', desc: 'Compress PNG, JPG, WebP files', category: 'Image' },
  { name: 'Color Extractor', href: '/tools/color-extractor', desc: 'Extract color palette from any image', category: 'Color' },
  { name: 'Color Palette', href: '/tools/color-palette', desc: 'Generate and export color palettes', category: 'Color' },
  { name: 'Sprite Packer', href: '/tools/sprite-packer', desc: 'Pack sprites into a single atlas', category: 'Game' },
  { name: 'Pixel Editor', href: '/tools/pixel-editor', desc: 'Edit pixel art in-browser', category: 'Game' },
  { name: 'Ideogram', href: '/tools/ideogram', desc: 'Generate text-in-image designs', category: 'AI Generate' },
  { name: 'Recraft', href: '/tools/recraft', desc: 'Generate vector art and icons', category: 'AI Generate' },
  { name: 'Text to 3D', href: '/tools/text-to-3d', desc: 'Generate 3D models from text', category: 'AI Generate' },
  { name: 'Skybox', href: '/tools/skybox', desc: 'Generate 360° environment skyboxes', category: 'AI Generate' },
  { name: 'Transcribe', href: '/tools/transcribe', desc: 'Transcribe audio files to text', category: 'AI' },
  { name: 'Exa Search', href: '/tools/exa-search', desc: 'Semantic web search with AI', category: 'AI' },
];

const categories = [...new Set(STUDIO_TOOLS.map(t => t.category))];

export default function StudioToolsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-10">
        <Link href="/studio" className="text-xs text-white/30 hover:text-white/60 mb-4 inline-flex items-center gap-1">← Studio</Link>
        <h1 className="text-2xl font-bold text-white mt-2">Studio Tools</h1>
        <p className="text-white/40 text-sm mt-1">Post-processing and utility tools for your generated assets.</p>
      </div>

      {categories.map(cat => (
        <div key={cat} className="mb-10">
          <h2 className="text-xs text-white/30 uppercase tracking-wider mb-4">{cat}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {STUDIO_TOOLS.filter(t => t.category === cat).map(tool => (
              <Link
                key={tool.href}
                href={tool.href}
                className="p-4 bg-white/[0.03] border border-white/[0.07] rounded-xl hover:border-white/20 hover:bg-white/5 transition-all group"
              >
                <p className="text-sm font-medium text-white/80 group-hover:text-white mb-1">{tool.name}</p>
                <p className="text-xs text-white/30">{tool.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
