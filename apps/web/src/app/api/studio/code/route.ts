import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { apiError, API_ERRORS } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';
import { log } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CODE_SYSTEM_PROMPT = `You are an expert React + Tailwind CSS + shadcn/ui component developer.

When the user describes a UI component:
1. Output ONLY the complete React component code
2. Use TypeScript
3. Use Tailwind CSS classes for styling (dark theme: bg-zinc-900, text-zinc-100, border-zinc-800, etc.)
4. Use shadcn/ui components where appropriate (import from "@/components/shadcn/...")
5. Use lucide-react for icons
6. Make it visually polished and production-ready
7. Include realistic placeholder content
8. Export a default function component

IMPORTANT OUTPUT FORMAT:
- Start with \`\`\`tsx
- End with \`\`\`
- Nothing else — no explanation, no commentary, just the code block`;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return apiError({ message: 'Unauthorized', code: 'UNAUTHORIZED', status: 401 });

    const rl = await checkRateLimit(`code-studio:${session.user.id}`, 20, 60 * 1000);
    if (!rl.allowed) return apiError({ message: 'Rate limit exceeded', code: 'RATE_LIMITED', status: 429 });

    const { prompt } = await req.json();
    if (!prompt?.trim()) return apiError({ message: 'Prompt required', code: 'BAD_REQUEST', status: 400 });

    const togetherKey = process.env.TOGETHER_API_KEY;
    if (!togetherKey) return apiError({ message: 'Code model not configured', code: 'INTERNAL_ERROR', status: 503 });

    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${togetherKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-ai/DeepSeek-V3',
        messages: [
          { role: 'system', content: CODE_SYSTEM_PROMPT },
          { role: 'user', content: `Create a React component: ${prompt}` },
        ],
        max_tokens: 4096,
        temperature: 0.2,
        stream: false,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return apiError({ message: `Code generation failed: ${err}`, code: 'INTERNAL_ERROR', status: 502 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '';

    // Extract code from markdown code block
    const codeMatch = content.match(/```(?:tsx?|jsx?)?\n([\s\S]*?)```/);
    const code = codeMatch ? codeMatch[1].trim() : content.trim();

    return NextResponse.json({ code, raw: content });
  } catch (err) {
    log.error({ err }, 'POST /api/studio/code failed');
    return API_ERRORS.INTERNAL();
  }
}
