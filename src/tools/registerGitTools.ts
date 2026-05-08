import type { PlatformToolServer } from "@abhinav-dev/mcp-platform-kit";
import { z } from "zod";
import { toMcpOk } from "@abhinav-dev/mcp-platform-kit";
import { github } from "../github/githubClient.js";

type OwnerArg = { owner?: string };

type ListReposArgs = OwnerArg & {
  type?: "all" | "public" | "private";
};

type RepoArgs = OwnerArg & {
  repo: string;
};

type ListBranchesArgs = RepoArgs & {
  perPage?: number;
};

type CreateBranchArgs = RepoArgs & {
  branchName: string;
  fromBranch?: string;
};

type ListPullRequestsArgs = RepoArgs & {
  state?: "open" | "closed" | "all";
};

type PullRequestArgs = RepoArgs & {
  pullNumber: number;
};

type CreatePullRequestArgs = RepoArgs & {
  title: string;
  head: string;
  base?: string;
  body?: string;
};

type GetCommitsArgs = RepoArgs & {
  branch?: string;
  perPage?: number;
};

type AddPrCommentArgs = PullRequestArgs & {
  comment: string;
};

type GetFileContentArgs = RepoArgs & {
  path: string;
  ref?: string;
};

type CreateOrUpdateFileArgs = RepoArgs & {
  path: string;
  content: string;
  message: string;
  branch: string;
  sha?: string;
};

type CompareBranchesArgs = RepoArgs & {
  base: string;
  head: string;
};

export function registerGitTools(server: PlatformToolServer): void {
  server.tool<ListReposArgs>(
    "list_repos",
    "List GitHub repositories for an owner or org",
    {
      owner: z.string().optional(),
      type: z.enum(["all", "public", "private"]).optional().default("all"),
    },
    async (args: ListReposArgs) => {
      const { owner, type = "all" } = args;
      const ownerName = github.owner(owner);
      let repos: unknown;
      try {
        repos = await github.request(
          "GET",
          `/orgs/${ownerName}/repos?type=${type}&per_page=50&sort=updated`,
        );
      } catch (err) {
        if (err instanceof Error && err.message.startsWith("GitHub API 404:"))
          repos = await github.request(
            "GET",
            `/users/${ownerName}/repos?type=${type}&per_page=50&sort=updated`,
          );
        else throw err;
      }
      return toMcpOk({ owner: ownerName, repos }, undefined, {
        source: "git",
        tool: "list_repos",
      });
    },
  );

  server.tool<RepoArgs>(
    "get_repo",
    "Get repository metadata",
    { repo: z.string(), owner: z.string().optional() },
    async (args: RepoArgs) => {
      const ownerName = github.owner(args.owner);
      const data = await github.request(
        "GET",
        `/repos/${ownerName}/${args.repo}`,
      );
      return toMcpOk(data, undefined, { source: "git", tool: "get_repo" });
    },
  );

  server.tool<ListBranchesArgs>(
    "list_branches",
    "List branches in a repository",
    {
      repo: z.string(),
      owner: z.string().optional(),
      perPage: z.number().optional().default(50),
    },
    async (args: ListBranchesArgs) => {
      const ownerName = github.owner(args.owner);
      const branches = await github.request(
        "GET",
        `/repos/${ownerName}/${args.repo}/branches?per_page=${args.perPage}`,
      );
      return toMcpOk(
        { owner: ownerName, repo: args.repo, branches },
        undefined,
        {
          source: "git",
          tool: "list_branches",
        },
      );
    },
  );

  server.tool<CreateBranchArgs>(
    "create_branch",
    "Create a branch from another branch",
    {
      repo: z.string(),
      branchName: z.string(),
      fromBranch: z.string().optional().default("main"),
      owner: z.string().optional(),
    },
    async (args: CreateBranchArgs) => {
      const ownerName = github.owner(args.owner);
      const ref = await github.request<{ object: { sha: string } }>(
        "GET",
        `/repos/${ownerName}/${args.repo}/git/ref/heads/${args.fromBranch}`,
      );
      const result = await github.request(
        "POST",
        `/repos/${ownerName}/${args.repo}/git/refs`,
        { ref: `refs/heads/${args.branchName}`, sha: ref.object.sha },
      );
      return toMcpOk(
        {
          owner: ownerName,
          repo: args.repo,
          branchName: args.branchName,
          fromBranch: args.fromBranch,
          result,
        },
        "Branch created",
        { source: "git", tool: "create_branch" },
      );
    },
  );

  server.tool<ListPullRequestsArgs>(
    "list_pull_requests",
    "List pull requests",
    {
      repo: z.string(),
      owner: z.string().optional(),
      state: z.enum(["open", "closed", "all"]).optional().default("open"),
    },
    async (args: ListPullRequestsArgs) => {
      const ownerName = github.owner(args.owner);
      const prs = await github.request(
        "GET",
        `/repos/${ownerName}/${args.repo}/pulls?state=${args.state}&per_page=50`,
      );
      return toMcpOk({ owner: ownerName, repo: args.repo, prs }, undefined, {
        source: "git",
        tool: "list_pull_requests",
      });
    },
  );

  server.tool<PullRequestArgs>(
    "get_pull_request",
    "Get a pull request by number",
    { repo: z.string(), pullNumber: z.number(), owner: z.string().optional() },
    async (args: PullRequestArgs) => {
      const ownerName = github.owner(args.owner);
      const pr = await github.request(
        "GET",
        `/repos/${ownerName}/${args.repo}/pulls/${args.pullNumber}`,
      );
      return toMcpOk(pr, undefined, {
        source: "git",
        tool: "get_pull_request",
      });
    },
  );

  server.tool<PullRequestArgs>(
    "get_pr_files",
    "Get changed files in a PR",
    { repo: z.string(), pullNumber: z.number(), owner: z.string().optional() },
    async (args: PullRequestArgs) => {
      const ownerName = github.owner(args.owner);
      const files = await github.request(
        "GET",
        `/repos/${ownerName}/${args.repo}/pulls/${args.pullNumber}/files?per_page=100`,
      );
      return toMcpOk(
        {
          owner: ownerName,
          repo: args.repo,
          pullNumber: args.pullNumber,
          files,
        },
        undefined,
        {
          source: "git",
          tool: "get_pr_files",
        },
      );
    },
  );

  server.tool<CreatePullRequestArgs>(
    "create_pull_request",
    "Create a pull request",
    {
      repo: z.string(),
      title: z.string(),
      head: z.string(),
      base: z.string().optional().default("main"),
      body: z.string().optional(),
      owner: z.string().optional(),
    },
    async (args: CreatePullRequestArgs) => {
      const ownerName = github.owner(args.owner);
      const pr = await github.request(
        "POST",
        `/repos/${ownerName}/${args.repo}/pulls`,
        {
          title: args.title,
          head: args.head,
          base: args.base,
          body: args.body,
        },
      );
      return toMcpOk(pr, "Pull request created", {
        source: "git",
        tool: "create_pull_request",
      });
    },
  );

  server.tool<GetCommitsArgs>(
    "get_commits",
    "Get recent commits for a branch",
    {
      repo: z.string(),
      owner: z.string().optional(),
      branch: z.string().optional(),
      perPage: z.number().optional().default(20),
    },
    async (args: GetCommitsArgs) => {
      const ownerName = github.owner(args.owner);
      const q = new URLSearchParams({ per_page: String(args.perPage) });
      if (args.branch) q.set("sha", args.branch);
      const commits = await github.request(
        "GET",
        `/repos/${ownerName}/${args.repo}/commits?${q.toString()}`,
      );
      return toMcpOk(
        { owner: ownerName, repo: args.repo, commits },
        undefined,
        {
          source: "git",
          tool: "get_commits",
        },
      );
    },
  );

  server.tool<AddPrCommentArgs>(
    "add_pr_comment",
    "Add an issue-style comment to a pull request",
    {
      repo: z.string(),
      pullNumber: z.number(),
      comment: z.string(),
      owner: z.string().optional(),
    },
    async (args: AddPrCommentArgs) => {
      const ownerName = github.owner(args.owner);
      const result = await github.request(
        "POST",
        `/repos/${ownerName}/${args.repo}/issues/${args.pullNumber}/comments`,
        { body: args.comment },
      );
      return toMcpOk(result, "PR comment added", {
        source: "git",
        tool: "add_pr_comment",
      });
    },
  );

  server.tool<GetFileContentArgs>(
    "get_file_content",
    "Get file content from repository",
    {
      repo: z.string(),
      path: z.string(),
      ref: z.string().optional(),
      owner: z.string().optional(),
    },
    async (args: GetFileContentArgs) => {
      const ownerName = github.owner(args.owner);
      const q = args.ref ? `?ref=${encodeURIComponent(args.ref)}` : "";
      const data = await github.request<{
        content?: string;
        encoding?: string;
      }>(
        "GET",
        `/repos/${ownerName}/${args.repo}/contents/${encodeURIComponent(args.path)}${q}`,
      );
      const text =
        data.encoding === "base64" && data.content
          ? Buffer.from(data.content, "base64").toString("utf8")
          : undefined;
      return toMcpOk(
        {
          owner: ownerName,
          repo: args.repo,
          path: args.path,
          ref: args.ref,
          data,
          text,
        },
        undefined,
        { source: "git", tool: "get_file_content" },
      );
    },
  );

  server.tool<CreateOrUpdateFileArgs>(
    "create_or_update_file",
    "Create or update a file",
    {
      repo: z.string(),
      path: z.string(),
      content: z.string(),
      message: z.string(),
      branch: z.string(),
      owner: z.string().optional(),
      sha: z.string().optional(),
    },
    async (args: CreateOrUpdateFileArgs) => {
      const ownerName = github.owner(args.owner);
      const result = await github.request(
        "PUT",
        `/repos/${ownerName}/${args.repo}/contents/${encodeURIComponent(args.path)}`,
        {
          message: args.message,
          content: Buffer.from(args.content, "utf8").toString("base64"),
          branch: args.branch,
          ...(args.sha && { sha: args.sha }),
        },
      );
      return toMcpOk(result, "File created/updated", {
        source: "git",
        tool: "create_or_update_file",
      });
    },
  );

  server.tool<CompareBranchesArgs>(
    "compare_branches",
    "Compare two branches or refs",
    {
      repo: z.string(),
      base: z.string(),
      head: z.string(),
      owner: z.string().optional(),
    },
    async (args: CompareBranchesArgs) => {
      const ownerName = github.owner(args.owner);
      const diff = await github.request(
        "GET",
        `/repos/${ownerName}/${args.repo}/compare/${encodeURIComponent(args.base)}...${encodeURIComponent(args.head)}`,
      );
      return toMcpOk(diff, undefined, {
        source: "git",
        tool: "compare_branches",
      });
    },
  );
}
