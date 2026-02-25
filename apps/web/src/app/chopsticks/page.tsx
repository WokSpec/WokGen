// Chopsticks — WokGen Discord Bot
// Command reference and setup guide

import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chopsticks Discord Bot — WokGen',
  description: 'Chopsticks is the official WokGen Discord bot. Generate assets, chat with Eral, browse the gallery, and more — all from Discord.',
};

interface Command {
  syntax:      string;
  description: string;
  example:     string;
  permission:  'everyone' | 'admin';
  args:        Array<{ name: string; type: string; required: boolean; desc: string }>;
}

const COMMANDS: Command[] = [
  {
    syntax:      '/generate [mode] [prompt]',
    description: 'Generate an AI asset from a prompt. Supports all 4 WokGen modes.',
    example:     '/generate pixel cute dragon warrior sprite',
    permission:  'everyone',
    args: [
      { name: 'mode',   type: 'string',  required: true,  desc: 'pixel | business | vector | uiux' },
      { name: 'prompt', type: 'string',  required: true,  desc: 'Your generation prompt' },
    ],
  },
  {
    syntax:      '/pixel [prompt]',
    description: 'Shorthand for /generate pixel — quickly generate a pixel art asset.',
    example:     '/pixel neon cyberpunk city tileset',
    permission:  'everyone',
    args: [
      { name: 'prompt', type: 'string', required: true, desc: 'Pixel art generation prompt' },
    ],
  },
  {
    syntax:      '/tools',
    description: 'List all 8 WokGen tool categories with links to the relevant studios.',
    example:     '/tools',
    permission:  'everyone',
    args: [],
  },
  {
    syntax:      '/eral [message]',
    description: 'Chat with Eral 7c, the WokGen AI companion. Ask anything — prompts, code, creative direction.',
    example:     '/eral What\'s the best prompt style for dark fantasy sprites?',
    permission:  'everyone',
    args: [
      { name: 'message', type: 'string', required: true, desc: 'Your message to Eral' },
    ],
  },
  {
    syntax:      '/gallery',
    description: 'Preview the 3 most recent public gallery assets with image thumbnails.',
    example:     '/gallery',
    permission:  'everyone',
    args: [],
  },
  {
    syntax:      '/roast @user [intensity]',
    description: 'Generate a fun, LLM-powered roast of a Discord user. Keep it light!',
    example:     '/roast @Wokspec intensity:savage',
    permission:  'everyone',
    args: [
      { name: 'user',      type: 'string', required: true,  desc: 'Username to roast' },
      { name: 'intensity', type: 'string', required: false, desc: 'mild | medium | savage (default: medium)' },
    ],
  },
  {
    syntax:      '/simulate [topic]',
    description: 'Start a simulated creative conversation between 3 AI agents: Creative Director, Art Director, and Game Designer.',
    example:     '/simulate pixel art style guide for a horror RPG',
    permission:  'everyone',
    args: [
      { name: 'topic', type: 'string', required: true, desc: 'Topic for the agents to discuss' },
    ],
  },
  {
    syntax:      '/automate [schedule] [prompt]',
    description: 'Create a recurring asset generation automation. Results delivered on a schedule.',
    example:     '/automate schedule:daily prompt:random fantasy character portrait',
    permission:  'everyone',
    args: [
      { name: 'schedule', type: 'string', required: true, desc: 'hourly | daily | weekly' },
      { name: 'prompt',   type: 'string', required: true, desc: 'Generation prompt to run on schedule' },
    ],
  },
  {
    syntax:      '/battle [prompt1] [prompt2]',
    description: 'Pit two concept prompts against each other. Community votes with reactions.',
    example:     '/battle prompt1:"fire dragon" prompt2:"ice phoenix"',
    permission:  'everyone',
    args: [
      { name: 'prompt1', type: 'string', required: true, desc: 'First concept prompt' },
      { name: 'prompt2', type: 'string', required: true, desc: 'Second concept prompt' },
    ],
  },
];

const PERMISSION_COLORS: Record<string, string> = {
  everyone: 'bg-emerald-900/50 text-emerald-300 border-emerald-800',
  admin:    'bg-amber-900/50 text-amber-300 border-amber-800',
};

export default function ChopsticksPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-14">

        {/* Hero */}
        <div className="text-center space-y-4">
          <h2 className="text-lg font-semibold">Setup</h2>          <h1 className="text-4xl font-bold tracking-tight">Chopsticks</h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            The official WokGen Discord bot. Generate assets, chat with Eral, browse the gallery,
            and automate your creative workflow — all without leaving Discord.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <Link
              href="https://discord.com/api/oauth2/authorize?client_id=DISCORD_APPLICATION_ID&scope=applications.commands"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-lg transition text-sm"
            >
              Add to Discord
            </Link>
            <Link
              href="/studio"
              className="inline-flex items-center gap-2 bg-[var(--surface-raised)] hover:bg-zinc-700 text-[var(--text)] font-semibold px-5 py-2.5 rounded-lg transition text-sm"
            >
              Open Studio
            </Link>
          </div>
        </div>

        {/* Setup */}
        <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 space-y-3">
          <h2 className="text-lg font-semibold">Setup</h2>
          <p className="text-zinc-400 text-sm">
            Chopsticks uses Discord&apos;s Interactions Endpoint (webhook-based, no persistent bot connection required).
          </p>
          <ol className="list-decimal list-inside text-sm text-zinc-400 space-y-1.5">
            <li>Go to the <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Discord Developer Portal</a> and create an Application.</li>
            <li>Under <strong className="text-[var(--text)]">Bot</strong>, copy the Bot Token → set <code className="bg-[var(--surface-raised)] px-1 py-0.5 rounded text-xs">DISCORD_BOT_TOKEN</code>.</li>
            <li>Under <strong className="text-[var(--text)]">General Information</strong>, copy the Public Key → set <code className="bg-[var(--surface-raised)] px-1 py-0.5 rounded text-xs">DISCORD_PUBLIC_KEY</code>.</li>
            <li>Set <strong className="text-[var(--text)]">Interactions Endpoint URL</strong> to <code className="bg-[var(--surface-raised)] px-1 py-0.5 rounded text-xs">https://your-domain/api/discord/interactions</code>.</li>
            <li>Register slash commands via the Discord API using the commands listed below.</li>
          </ol>
        </section>

        {/* Commands */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Commands</h2>
          <div className="space-y-4">
            {COMMANDS.map((cmd) => (
              <div
                key={cmd.syntax}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 space-y-3"
              >
                {/* Header row */}
                <div className="flex flex-wrap items-start gap-3">
                  <code className="text-indigo-300 font-mono text-sm bg-indigo-950/40 px-2 py-1 rounded">
                    {cmd.syntax}
                  </code>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded border ${PERMISSION_COLORS[cmd.permission]}`}
                  >
                    {cmd.permission}
                  </span>
                </div>

                {/* Description */}
                <p className="text-[var(--text-secondary)] text-sm">{cmd.description}</p>

                {/* Args table */}
                {cmd.args.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-[var(--text-muted)] text-left border-b border-[var(--border)]">
                          <th className="pb-1.5 pr-4 font-medium">Argument</th>
                          <th className="pb-1.5 pr-4 font-medium">Type</th>
                          <th className="pb-1.5 pr-4 font-medium">Required</th>
                          <th className="pb-1.5 font-medium">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {cmd.args.map((arg) => (
                          <tr key={arg.name} className="text-zinc-400">
                            <td className="py-1.5 pr-4">
                              <code className="text-[var(--text-secondary)] font-mono">{arg.name}</code>
                            </td>
                            <td className="py-1.5 pr-4 text-[var(--text-muted)]">{arg.type}</td>
                            <td className="py-1.5 pr-4">
                              {arg.required
                                ? <span className="text-red-400">required</span>
                                : <span className="text-zinc-600">optional</span>
                              }
                            </td>
                            <td className="py-1.5">{arg.desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Example */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[var(--text-muted)]">Example:</span>
                  <code className="text-[var(--text-secondary)] bg-[var(--surface-raised)] px-2 py-0.5 rounded font-mono">{cmd.example}</code>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Architecture note */}
        <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/50 p-5 space-y-2">
          <h2 className="text-base font-semibold text-[var(--text-secondary)]">Architecture</h2>
          <p className="text-sm text-[var(--text-muted)]">
            Chopsticks uses Discord&apos;s <strong className="text-zinc-400">Interactions Endpoint</strong> pattern —
            a pure HTTP webhook with no persistent WebSocket connection. Discord POSTs to
            <code className="bg-[var(--surface-raised)] px-1 py-0.5 rounded text-xs mx-1">/api/discord/interactions</code>
            when a slash command is used. Signatures are verified using Ed25519 before any command is processed.
            Long-running commands (like <code className="bg-[var(--surface-raised)] px-1 py-0.5 rounded text-xs">/generate</code>)
            use deferred responses (type 5) with follow-up webhooks.
          </p>
        </section>

      </div>
    </div>
  );
}
