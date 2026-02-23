export async function pollinationsChat(
  systemPrompt: string,
  userMessage: string,
  opts?: { maxLen?: number }
): Promise<string> {
  const encoded = encodeURIComponent(userMessage);
  const sys = encodeURIComponent(systemPrompt.slice(0, 500));
  const url = `https://text.pollinations.ai/${encoded}?model=openai&system=${sys}&seed=${Date.now() % 9999}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`Pollinations text: ${res.status}`);
  const text = await res.text();
  return opts?.maxLen ? text.slice(0, opts.maxLen) : text;
}
