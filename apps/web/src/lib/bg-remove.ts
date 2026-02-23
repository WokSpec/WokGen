/**
 * Remove background from a PNG using RMBG-1.4 via HuggingFace Inference API.
 * Returns a base64 PNG data URL with alpha channel, or null on failure.
 */
export async function removeBackground(imageUrl: string): Promise<string | null> {
  try {
    const hfToken = process.env.HF_TOKEN;
    if (!hfToken) return null;

    // Fetch source image as a blob
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return null;
    const imageBuffer = await imgRes.arrayBuffer();

    const res = await fetch('https://api-inference.huggingface.co/models/briaai/RMBG-1.4', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${hfToken}`,
        'Content-Type': 'application/octet-stream',
        Accept: 'image/png',
      },
      body: imageBuffer,
    });

    if (!res.ok) return null;

    const resultBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(resultBuffer).toString('base64');
    return `data:image/png;base64,${base64}`;
  } catch {
    return null;
  }
}
