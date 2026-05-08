import "dotenv/config";
import {
  McpBaseConfig,
  McpServerBase,
  type PlatformToolServer,
} from "@abhinav-dev/mcp-platform-kit";
import { env } from "./config/env.js";
import { registerGitTools } from "./tools/registerGitTools.js";

class GitMcpServer extends McpServerBase {
  protected setupTools(server: PlatformToolServer): void {
    registerGitTools(server);
  }
}

console.log("╔══════════════════════════════════════════╗");
console.log("║           Git MCP  v1.0.0                ║");
console.log("╚══════════════════════════════════════════╝\n");

const config: McpBaseConfig = {
  name: env.MCP_NAME,
  version: env.MCP_VERSION,
  port: env.MCP_PORT,
  description: "GitHub MCP server — repos, branches, PRs, files, commits",
  selfUrl: env.MCP_SELF_URL,
  gatewayUrl: env.GATEWAY_URL,
};

await new GitMcpServer(config).start();
