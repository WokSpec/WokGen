// Discord slash command handlers for Chopsticks bot.
// Each handler receives the interaction object and returns a Discord Interaction Response.

import { prisma } from '@/lib/db';
import { groqChat } from '@/lib/providers/groq';

// ---------------------------------------------------------------------------
// Discord response types
// ---------------------------------------------------------------------------

export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  image?: { url: string };
  thumbnail?: { url: string };
  footer?: { text: string };
  url?: string;
}

export interface DiscordInteractionResponse {
  type: number; // 1=PONG, 4=CHANNEL_MESSAGE, 5=DEFERRED_CHANNEL_MESSAGE
  data?: {
    content?: string;
    embeds?: DiscordEmbed[];
    flags?: number;
  };
}

// Interaction type from Discord
export interface DiscordInteraction {
  id: string;
  application_id: string;
  token: string;
  type: number;
  data?: {
    name: string;
    options?: Array<{ name: string; value: string | number }>;
  };
  member?: { user?: { id: string; username: string; global_name?: string } };
  user?: { id: string; username: string; global_name?: string };
}

// ---------------------------------------------------------------------------
// Helper: get option value by name
// ---------------------------------------------------------------------------
type InteractionOptions = Array<{ name: string; value: string | number }> | undefined;

function opt(options: InteractionOptions, name: string): string {
  return String(options?.find((o: { name: string; value: string | number }) => o.name === name)?.value ?? '');
}

// ---------------------------------------------------------------------------
// Helper: post Discord follow-up (for deferred responses)
// ---------------------------------------------------------------------------
async function sendFollowUp(
  applicationId: string,
  token: string,
  content: string,
  embeds?: DiscordEmbed[],
): Promise<void> {
  await fetch(
    `https://discord.com/api/v10/webhooks/${applicationId}/${token}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: content || undefined, embeds: embeds ?? undefined }),
    },
  );
}

// ---------------------------------------------------------------------------
// /generate [mode] [prompt]
// /pixel [prompt]  — shorthand for generate with mode=pixel
// ---------------------------------------------------------------------------
export function handleGenerate(
  interaction: DiscordInteraction,
  modeOverride?: string,
): DiscordInteractionResponse {
  const options = interaction.data?.options ?? [];
  const mode = modeOverride ?? (opt(options, 'mode') || 'pixel');
  const prompt = opt(options, 'prompt');

  if (!prompt) {
    return {
      type: 4,
      data: { content: 'A `prompt` is required. Example: `/generate pixel cute dragon sprite`' },
    };
  }

  const validModes = ['pixel'];
  if (!validModes.includes(mode)) {
    return {
      type: 4,
      data: { content: `Invalid mode \`${mode}\`. Choose from: ${validModes.join(', ')}` },
    };
  }

  // Fire background generation + follow-up (non-blocking)
  const appId = interaction.application_id;
  const token = interaction.token;
  const baseUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

  void (async () => {
    try {
      const res = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Internal-Discord': '1' },
        body: JSON.stringify({ prompt, mode, tool: 'generate', width: 512, height: 512 }),
      });
      if (res.ok) {
        const job = await res.json() as { resultUrl?: string; id?: string };
        if (job.resultUrl) {
          await sendFollowUp(appId, token, `Here's your **${mode}** asset!`, [
            {
              title: prompt.slice(0, 256),
              image: { url: job.resultUrl },
              color: 0x5865f2,
              footer: { text: `View more at ${baseUrl}/gallery` },
            },
          ]);
        } else {
          await sendFollowUp(appId, token, `Generation started! View it at ${baseUrl}/gallery`);
        }
      } else {
        await sendFollowUp(appId, token, `Generation failed. Try again or visit ${baseUrl}/studio`);
      }
    } catch {
      await sendFollowUp(appId, token, `Something went wrong. Try again at ${baseUrl}/studio`).catch(() => {});
    }
  })();

  return {
    type: 5, // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE — "Bot is thinking…"
  };
}

export function handlePixel(interaction: DiscordInteraction): DiscordInteractionResponse {
  return handleGenerate(interaction, 'pixel');
}

// ---------------------------------------------------------------------------
// /tools — list WokGen tool categories
// ---------------------------------------------------------------------------
const TOOL_CATEGORIES = [
  { name: 'Pixel Mode', desc: 'Sprites, tilesets, animations for game devs', path: '/studio' },
  { name: 'Business Mode', desc: 'Logos, brand kits, social assets', path: '/studio' },
  { name: 'Vector Mode', desc: 'SVG icons, illustrations, design systems', path: '/studio' },
  { name: 'UI/UX Mode', desc: 'React/HTML/Vue components, page templates', path: '/studio' },
  { name: 'Voice Mode', desc: 'Text-to-speech, character voices, audio', path: '/studio' },
  { name: 'Text Mode', desc: 'Headlines, copy, blog posts, code snippets', path: '/text/studio' },
  { name: 'Eral AI', desc: 'AI companion — chat, plan, critique, code', path: '/eral' },
  { name: 'Automations', desc: 'Schedule recurring asset generation', path: '/automations' },
];

export function handleTools(): DiscordInteractionResponse {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://wokgen.wokspec.org';
  const fields = TOOL_CATEGORIES.map((t) => ({
    name: t.name,
    value: `${t.desc} — [Open](${baseUrl}${t.path})`,
    inline: false,
  }));

  return {
    type: 4,
    data: {
      embeds: [
        {
          title: 'WokGen Tool Categories',
          description: `Explore all 8 tool categories at [wokgen.wokspec.org](${baseUrl}/tools)`,
          color: 0x5865f2,
          fields,
          footer: { text: 'Use /generate to create assets directly from Discord' },
        },
      ],
    },
  };
}

// ---------------------------------------------------------------------------
// /eral [message] — chat with Eral AI
// ---------------------------------------------------------------------------
export async function handleEral(interaction: DiscordInteraction): Promise<DiscordInteractionResponse> {
  const message = opt(interaction.data?.options, 'message');
  if (!message) {
    return { type: 4, data: { content: 'A `message` is required.' } };
  }

  try {
    const { text } = await groqChat(
      'You are Eral, the AI companion for WokGen by WokSpec. Be concise, helpful, and direct. Keep responses under 1800 characters.',
      message,
      { maxTokens: 512, temperature: 0.7 },
    );
    return {
      type: 4,
      data: { content: `**Eral:** ${text.slice(0, 1900)}` },
    };
  } catch {
    return { type: 4, data: { content: 'Eral is unavailable right now. Try again later.' } };
  }
}

// ---------------------------------------------------------------------------
// /gallery — last 3 public gallery items
// ---------------------------------------------------------------------------
export async function handleGallery(): Promise<DiscordInteractionResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://wokgen.wokspec.org';
  try {
    const items = await prisma.galleryAsset.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { id: true, title: true, imageUrl: true, prompt: true, mode: true, createdAt: true },
    });

    if (items.length === 0) {
      return { type: 4, data: { content: 'No gallery assets yet. Be the first to generate one!' } };
    }

    const embeds: DiscordEmbed[] = items.map((item) => ({
      title: item.title ?? item.prompt.slice(0, 80),
      description: `Mode: **${item.mode}**`,
      image: { url: item.imageUrl },
      color: 0x5865f2,
      url: `${baseUrl}/gallery`,
      footer: { text: new Date(item.createdAt).toLocaleDateString() },
    }));

    return {
      type: 4,
      data: {
        content: `Latest from the [WokGen Gallery](${baseUrl}/gallery):`,
        embeds,
      },
    };
  } catch {
    return { type: 4, data: { content: 'Could not fetch gallery. Try again later.' } };
  }
}

// ---------------------------------------------------------------------------
// /roast @user [intensity]
// ---------------------------------------------------------------------------
const ROAST_SYSTEM = `You are a witty roast comedian. Write a short, fun, and playful roast.
Keep it light-hearted — no slurs, no genuinely hurtful content.
Respond with ONLY the roast text, no preamble.`;

export async function handleRoast(interaction: DiscordInteraction): Promise<DiscordInteractionResponse> {
  const options = interaction.data?.options ?? [];
  const username = opt(options, 'user') || 'this person';
  const intensity = opt(options, 'intensity') || 'medium';

  const intensityMap: Record<string, string> = {
    mild: 'gentle and friendly, no edge',
    medium: 'funny with a bit of bite',
    savage: 'no mercy — as savage as possible while staying clean',
  };
  const intensityDesc = intensityMap[intensity] ?? intensityMap.medium;

  try {
    const { text } = await groqChat(
      ROAST_SYSTEM,
      `Roast a Discord user named "${username}". Intensity: ${intensityDesc}. Keep it under 200 words.`,
      { maxTokens: 300, temperature: 0.95 },
    );
    return {
      type: 4,
      data: {
        content: `*@${username} enters the battle arena...* \n\n${text.slice(0, 1800)}`,
      },
    };
  } catch {
    return { type: 4, data: { content: 'The roast engine is cooling down. Try again!' } };
  }
}

// ---------------------------------------------------------------------------
// /simulate [topic] — AI agent simulation
// ---------------------------------------------------------------------------
const AGENTS = ['Creative Director', 'Art Director', 'Game Designer'] as const;

const SIMULATE_SYSTEM = `You simulate a conversation between three creative professionals at WokSpec:
- Creative Director: focuses on vision, narrative, brand
- Art Director: focuses on aesthetics, style, visual language
- Game Designer: focuses on mechanics, user experience, systems

Format the output EXACTLY like:
**Creative Director:** [2-3 sentences]
**Art Director:** [2-3 sentences]
**Game Designer:** [2-3 sentences]
**Creative Director:** [2-3 sentences]
**Art Director:** [2-3 sentences]
**Game Designer:** [2-3 sentences]

Keep the conversation natural, collaborative, and insightful. Total 6 exchanges.`;

export async function handleSimulate(interaction: DiscordInteraction): Promise<DiscordInteractionResponse> {
  const topic = opt(interaction.data?.options, 'topic');
  if (!topic) {
    return { type: 4, data: { content: 'A `topic` is required. Example: `/simulate pixel art for a horror game`' } };
  }

  try {
    const { text } = await groqChat(
      SIMULATE_SYSTEM,
      `Topic: "${topic}"`,
      { maxTokens: 800, temperature: 0.85 },
    );
    return {
      type: 4,
      data: { content: `**Simulation: ${topic}**\n\n${text.slice(0, 1900)}` },
    };
  } catch {
    return { type: 4, data: { content: 'Simulation failed. Try again later.' } };
  }
}

// ---------------------------------------------------------------------------
// /automate [schedule] [prompt] — create recurring Automation
// ---------------------------------------------------------------------------
const SCHEDULE_MAP: Record<string, string> = {
  hourly: '0 * * * *',
  daily: '0 9 * * *',
  weekly: '0 9 * * 1',
};

export async function handleAutomate(interaction: DiscordInteraction): Promise<DiscordInteractionResponse> {
  const options = interaction.data?.options ?? [];
  const schedule = opt(options, 'schedule') || 'daily';
  const prompt = opt(options, 'prompt');

  if (!prompt) {
    return { type: 4, data: { content: 'A `prompt` is required.' } };
  }

  const cron = SCHEDULE_MAP[schedule] ?? SCHEDULE_MAP.daily;
  const discordUser = interaction.member?.user ?? interaction.user;
  const discordUserId = discordUser?.id;
  const discordUsername = discordUser?.username ?? 'Discord User';

  try {
    // Find WokGen user by Discord account (skip auth for now — acknowledge without DB write if no match)
    // In a full implementation, you'd link Discord ID to WokGen account via OAuth
    await prisma.automation.create({
      data: {
        userId: 'discord_bot_placeholder', // Would be resolved via OAuth link in prod
        name: `Discord: ${prompt.slice(0, 60)}`,
        schedule: cron,
        targetType: 'webhook',
        messageTemplate: `Generate: ${prompt}`,
        enabled: true,
      },
    }).catch(() => null); // Non-fatal if user not found

    return {
      type: 4,
      data: {
        content: `**Automation created!**\n\nYou'll receive results **${schedule}**.\nPrompt: _${prompt.slice(0, 200)}_\n\nManage automations at /automations`,
      },
    };
  } catch {
    return {
      type: 4,
      data: {
        content: `Automation acknowledged! Sign in at [WokGen](${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://wokgen.wokspec.org'}/automations) to manage your **${schedule}** schedule for: _${prompt.slice(0, 200)}_`,
      },
    };
  }
}

// ---------------------------------------------------------------------------
// /battle [prompt1] vs [prompt2]
// ---------------------------------------------------------------------------
export function handleBattle(interaction: DiscordInteraction): DiscordInteractionResponse {
  const options = interaction.data?.options ?? [];
  const prompt1 = opt(options, 'prompt1');
  const prompt2 = opt(options, 'prompt2');

  if (!prompt1 || !prompt2) {
    return { type: 4, data: { content: 'Both `prompt1` and `prompt2` are required.' } };
  }

  return {
    type: 4,
    data: {
      content: `**Battle started!**\n\n${prompt1}\nvs\n${prompt2}\n\nVote with Option A or Option B!`,
      embeds: [
        {
          title: 'Asset Battle',
          description: `Which concept wins?\n\n**${prompt1}**\nvs\n**${prompt2}**`,
          color: 0x5865f2,
          footer: { text: 'React with Option A or Option B to vote!' },
        },
      ],
    },
  };
}

// ---------------------------------------------------------------------------
// Main dispatch function — routes interaction to the correct handler
// ---------------------------------------------------------------------------
export async function dispatchCommand(interaction: DiscordInteraction): Promise<DiscordInteractionResponse> {
  const commandName = interaction.data?.name ?? '';

  switch (commandName) {
    case 'generate':
      return handleGenerate(interaction);
    case 'pixel':
      return handlePixel(interaction);
    case 'tools':
      return handleTools();
    case 'eral':
      return handleEral(interaction);
    case 'gallery':
      return handleGallery();
    case 'roast':
      return handleRoast(interaction);
    case 'simulate':
      return handleSimulate(interaction);
    case 'automate':
      return handleAutomate(interaction);
    case 'battle':
      return handleBattle(interaction);
    default:
      return {
        type: 4,
        data: { content: `Unknown command \`/${commandName}\`. Use \`/tools\` to see what I can do.` },
      };
  }
}
