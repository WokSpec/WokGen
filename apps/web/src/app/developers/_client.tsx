'use client';

import { useState } from 'react';

type CodeTab = 'javascript' | 'python' | 'curl';

const JS_EXAMPLE = `const wokgen = require('@wokspec/sdk');
const client = new wokgen.Client({ apiKey: 'your-api-key' });

const result = await client.generate({
  prompt: 'pixel art dragon',
  mode: 'pixel',
  width: 512,
  height: 512,
});
console.log(result.imageUrl);`;

const PY_EXAMPLE = `import wokgen
client = wokgen.Client(api_key='your-api-key')

result = client.generate(
    prompt='pixel art dragon',
    mode='pixel',
    width=512,
    height=512,
)
print(result.image_url)`;

const CURL_EXAMPLE = `curl -X POST https://wokgen.wokspec.org/api/generate \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "pixel art dragon",
    "mode": "pixel",
    "width": 512,
    "height": 512
  }'`;

export function CodeExamples() {
  const [tab, setTab] = useState<CodeTab>('javascript');
  const code = tab === 'javascript' ? JS_EXAMPLE : tab === 'python' ? PY_EXAMPLE : CURL_EXAMPLE;

  return (
    <div className="code-example">
      <div className="code-tabs">
        {(['javascript', 'python', 'curl'] as CodeTab[]).map((t) => (
          <button
            key={t}
            className={`code-tab${tab === t ? ' code-tab--active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'javascript' ? 'JavaScript' : t === 'python' ? 'Python' : 'cURL'}
          </button>
        ))}
      </div>
      <pre className="code-block"><code>{code}</code></pre>
    </div>
  );
}

export function DevSidebarNav({ sections }: { sections: { id: string; label: string }[] }) {
  const [active, setActive] = useState(sections[0]?.id ?? '');

  function scrollTo(id: string) {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <nav className="dev-sidebar__nav">
      {sections.map((s) => (
        <button
          key={s.id}
          className={`dev-sidebar__link${active === s.id ? ' dev-sidebar__link--active' : ''}`}
          onClick={() => scrollTo(s.id)}
        >
          {s.label}
        </button>
      ))}
    </nav>
  );
}
