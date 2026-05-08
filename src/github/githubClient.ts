import { env } from "../config/env.js";

export class GitHubClient {
  owner(owner?: string): string {
    const value = owner ?? env.GITHUB_DEFAULT_OWNER;
    if (!value) throw new Error("owner is required or GITHUB_DEFAULT_OWNER must be configured");
    return value;
  }

  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    if (!env.GITHUB_TOKEN) throw new Error("GITHUB_TOKEN env var not set");
    const res = await fetch(`https://api.github.com${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
    if (res.status === 204) return {} as T;
    return res.json() as Promise<T>;
  }
}

export const github = new GitHubClient();
