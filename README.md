# git-mcp

Standalone MCP server for GitHub. Implements the [MCP Platform Spec](../MCP-SPEC.md).
Works independently or registered with mcp-gateway.

---

## Quickstart

```bash
cp .env.example .env
# Fill in GITHUB_TOKEN, GITHUB_DEFAULT_OWNER

docker compose up --build
curl http://localhost:3002/health
```

Run locally:

```bash
npm install && npm run dev
```

---

## Tools

| Tool                  | Description                        |
| --------------------- | ---------------------------------- |
| `list_repos`          | List repos for an owner or org     |
| `list_branches`       | List branches in a repository      |
| `create_branch`       | Create a branch from a base branch |
| `list_pull_requests`  | List PRs (open / closed / all)     |
| `create_pull_request` | Open a new pull request            |
| `get_commits`         | Recent commits on a branch         |
| `add_pr_comment`      | Add a comment to a pull request    |

---

## Environment Variables

| Variable               | Description                                  |
| ---------------------- | -------------------------------------------- |
| `MCP_NAME`             | Server name (default: `git`)                 |
| `MCP_PORT`             | Port (default: `3002`)                       |
| `MCP_SELF_URL`         | URL the gateway uses to reach this server    |
| `GATEWAY_URL`          | Gateway URL — omit to skip auto-registration |
| `GITHUB_TOKEN`         | GitHub personal access token                 |
| `GITHUB_DEFAULT_OWNER` | Default org/user when owner not specified    |

---

## Testing Standalone

```bash
# Health
curl http://localhost:3002/health

# List tools
curl -X POST http://localhost:3002/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'

curl -X POST http://localhost:3002/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
```

### Connect directly in VS Code (bypass gateway)

```json
{
	"mcp": {
		"servers": {
			"git": { "type": "http", "url": "http://localhost:3002/mcp" }
		}
	}
}
```
