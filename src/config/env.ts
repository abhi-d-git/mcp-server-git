export const env = {
  MCP_NAME: process.env.MCP_NAME ?? "git",
  MCP_VERSION: process.env.MCP_VERSION ?? "1.0.0",
  MCP_PORT: parseInt(process.env.MCP_PORT ?? "3002", 10),
  MCP_SELF_URL: process.env.MCP_SELF_URL ?? `http://localhost:${process.env.MCP_PORT ?? "3002"}`,
  GATEWAY_URL: process.env.GATEWAY_URL,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN ?? "",
  GITHUB_DEFAULT_OWNER: process.env.GITHUB_DEFAULT_OWNER ?? "",
};
