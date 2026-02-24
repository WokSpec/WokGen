export class WokGen {
  constructor(private config: { apiKey: string; baseUrl?: string }) {}

  async generate(params: {
    mode: string;
    prompt: string;
    tool?: string;
  }): Promise<{ resultUrl?: string; jobId?: string }> {
    const res = await fetch(
      `${this.config.baseUrl ?? 'https://wokgen.wokspec.org'}/api/generate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(params),
      },
    );
    return res.json();
  }

  async getJob(
    id: string,
  ): Promise<{ job?: { status: string; resultUrl?: string } }> {
    const res = await fetch(
      `${this.config.baseUrl ?? 'https://wokgen.wokspec.org'}/api/jobs/${id}`,
      {
        headers: { Authorization: `Bearer ${this.config.apiKey}` },
      },
    );
    return res.json();
  }
}
