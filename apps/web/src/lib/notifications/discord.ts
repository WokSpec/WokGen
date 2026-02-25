import { prisma } from '@/lib/db';

export type NotifyEventType = 'levelUp' | 'jobComplete' | 'newGalleryAsset' | 'errorAlert';

export interface DiscordNotifyConfig {
  levelUp:         { webhookUrl: string; enabled: boolean };
  jobComplete:     { webhookUrl: string; enabled: boolean };
  newGalleryAsset: { webhookUrl: string; enabled: boolean };
  errorAlert:      { webhookUrl: string; enabled: boolean };
}

export const DEFAULT_DISCORD_CONFIG: DiscordNotifyConfig = {
  levelUp:         { webhookUrl: '', enabled: false },
  jobComplete:     { webhookUrl: '', enabled: false },
  newGalleryAsset: { webhookUrl: '', enabled: false },
  errorAlert:      { webhookUrl: '', enabled: false },
};

export async function readDiscordConfig(userId: string): Promise<DiscordNotifyConfig> {
  const prefs = await prisma.userPreference.findUnique({
    where:  { userId },
    select: { stats: true },
  });
  if (!prefs?.stats) return DEFAULT_DISCORD_CONFIG;
  try {
    const stats = JSON.parse(prefs.stats) as Record<string, unknown>;
    return (stats.discordNotifyConfig as DiscordNotifyConfig) ?? DEFAULT_DISCORD_CONFIG;
  } catch {
    return DEFAULT_DISCORD_CONFIG;
  }
}

export async function sendDiscordNotification(
  eventType: NotifyEventType,
  adminUserId: string,
  embed: {
    title: string;
    description?: string;
    color?: number;
    fields?: Array<{ name: string; value: string; inline?: boolean }>;
  },
): Promise<void> {
  const config = await readDiscordConfig(adminUserId);
  const channelConfig = config[eventType];
  if (!channelConfig.enabled || !channelConfig.webhookUrl) return;
  try {
    await fetch(channelConfig.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{ ...embed, timestamp: new Date().toISOString(), footer: { text: 'WokGen' } }],
      }),
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    // Non-fatal — notification delivery is best-effort
  }
}
