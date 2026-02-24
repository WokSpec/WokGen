'use client';

import { useEffect, useState } from 'react';

export default function ApiDocsPage() {
  const [spec, setSpec] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/openapi')
      .then((r) => r.json())
      .then(setSpec)
      .catch(() => setError('Failed to load API spec'));
  }, []);

  if (error) return <p className="p-8 text-red-500">{error}</p>;
  if (!spec) return <p className="p-8 text-gray-500">Loading…</p>;

  const info = spec.info as Record<string, string>;
  const paths = spec.paths as Record<string, Record<string, unknown>>;

  return (
    <main className="mx-auto max-w-4xl px-6 py-12 font-sans">
      <h1 className="text-3xl font-bold mb-2">{info.title}</h1>
      <p className="text-gray-500 mb-8">
        v{info.version} — {info.description}
      </p>

      {Object.entries(paths).map(([path, methods]) => (
        <section key={path} className="mb-8 border rounded-lg overflow-hidden">
          <h2 className="bg-gray-100 px-4 py-2 font-mono text-sm font-semibold text-gray-700">
            {path}
          </h2>
          {Object.entries(methods).map(([method, op]) => {
            const operation = op as Record<string, unknown>;
            return (
              <div key={method} className="px-4 py-3 border-t first:border-t-0">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-bold uppercase mr-3 ${
                    method === 'get'
                      ? 'bg-blue-100 text-blue-700'
                      : method === 'post'
                      ? 'bg-green-100 text-green-700'
                      : method === 'patch'
                      ? 'bg-yellow-100 text-yellow-700'
                      : method === 'delete'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {method}
                </span>
                <span className="text-sm text-gray-800">
                  {operation.summary as string}
                </span>
              </div>
            );
          })}
        </section>
      ))}

      <p className="text-xs text-gray-400 mt-8">
        Raw spec:{' '}
        <a href="/api/openapi" className="underline" target="_blank" rel="noreferrer">
          /api/openapi
        </a>
      </p>
    </main>
  );
}
