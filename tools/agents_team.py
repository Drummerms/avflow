import os, asyncio
from agents import Agent, Runner, handoff
from agents.model_settings import ModelSettings
from agents.memory.sqlite import SQLiteSession
from agents.mcp.server import MCPServerStdio

PORT = os.environ.get("PORT", "5173")
BASE_URL = f"http://127.0.0.1:{PORT}"
SPEC_PATH = os.environ.get("SPEC_PATH", "docs/spec_1_av_schematic_builder.md")  # change if your path differs
PUSH = os.environ.get("PUSH", "0")  # set PUSH=1 to 'git push'

# MCP servers
context7 = MCPServerStdio(name="context7", command="npx", args=["-y", "@upstash/context7-mcp@latest"])
codex    = MCPServerStdio(name="codex",    command="codex", args=["mcp-server"])
chrome   = MCPServerStdio(name="chrome",   command="npx",   args=["-y", "chrome-devtools-mcp@latest"])
memory   = MCPServerStdio(name="memory",   command="npx",   args=["-y", "@modelcontextprotocol/server-memory"])

# --- Agents ---

dev = Agent(
    name="Dev",
    instructions=(
        "Use Codex MCP to run shell commands.\n"
        "1) pnpm i\n2) pnpm build\n"
        f"3) nohup pnpm preview --host 0.0.0.0 --port {PORT} > /tmp/preview.log 2>&1 & echo $! > /tmp/preview.pid\n"
        "Query Memory MCP at start for project=avflow and apply facts (port, base_url, approved_builds).\n"
        f"Return ONLY JSON: {{\"url\":\"{BASE_URL}\",\"build_ok\":true|false,\"pid\":\"$(cat /tmp/preview.pid)\"}}\n"
        "On success, upsert to Memory MCP: {project:'avflow', port:'" + PORT + "', base_url:'" + BASE_URL + "'}."
    ),
    mcp_servers=[codex, context7, memory],
    model_settings=ModelSettings(tool_choice="required"),
)

qa = Agent(
    name="QA",
    instructions=(
        "Before testing, query Memory MCP for project=avflow to get base_url and any flaky selectors.\n"
        f"1) Use Codex MCP to run: E2E_BASE_URL={BASE_URL} pnpm test:e2e\n"
        f"2) Use Chrome DevTools MCP to open {BASE_URL}, wait for network idle, record a 5s performance trace, collect console errors.\n"
        "Return ONLY JSON: {\"play_ok\":true|false,\"perf\":{\"tracePath\":\"...\"},\"errors\":[{\"message\":\"...\"}]}\n"
        "Upsert test results to Memory MCP: last_run_status, trace_path."
    ),
    mcp_servers=[chrome, codex, memory],
    model_settings=ModelSettings(tool_choice="required"),
)

# NEW: VCS agent — updates .gitignore, stages and commits (optionally pushes)
vcs = Agent(
    name="VCS",
    instructions=(
        "Use Codex MCP to ensure a sane .gitignore exists at repo root. Append lines if missing:\n"
        "node_modules/\n.pnpm-store/\nplaywright-report/\ntest-results/\ndist/\n.env*\n" 
        "Then run: git add -A.\n"
        "Create a conventional commit message summarizing the run using JSON you receive "
        "(keys: build_ok, play_ok, tracePath). Use type 'chore' when only config/docs changed, "
        "'feat' when new capabilities were added, 'test' when tests changed.\n"
        "Commit with: git commit -m \"<message>\". If env PUSH=1, run: git push.\n"
        "Return ONLY JSON: {\"git\":{\"committed\":true|false,\"pushed\":true|false}}"
    ),
    mcp_servers=[codex, memory],
    model_settings=ModelSettings(tool_choice="required"),
)

# NEW: Docs agent — updates the spec file using Context7 + run results
docs = Agent(
    name="Docs",
    instructions=(
        "Open SPEC_PATH and update it to reflect the current run:\n"
        f"- SPEC_PATH = {SPEC_PATH}\n"
        "- Add or update a 'Run Summary' section with build_ok, play_ok, and perf trace path.\n"
        "- In the 'Milestones' section, tick items achieved this run (e.g., M0 build, M2 custom edge, M7 export). "
        "Do not remove items; mark with [x] or [ ] only.\n"
        "- Append a short 'References' section by querying Context7 for the latest docs on: "
        "'@xyflow/react', 'Playwright test', 'Chrome DevTools'. Include titles and URLs only.\n"
        "Use Codex MCP to edit SPEC_PATH in-place. Return ONLY JSON: {\"doc\":{\"updated\":true}}"
    ),
    mcp_servers=[codex, context7, memory],
    model_settings=ModelSettings(tool_choice="required"),
)

reporter = Agent(
    name="Reporter",
    instructions=(
        "You receive JSON from Dev and QA. Produce a short human summary. "
        "If build_ok=false or play_ok=false or errors exist, list fails succinctly. "
        "Else confirm all checks passed with URL and trace path."
    ),
)

triage = Agent(
    name="Triage",
    instructions=(
        "Own the workflow.\n"
        "1) Hand off to Dev. If build_ok=false, hand back to Dev once with a terse fix list.\n"
        "2) Hand off to QA. If play_ok=false or errors non-empty, hand back to Dev once with issues, then QA again.\n"
        "3) Hand off to VCS with the JSON results so it can update .gitignore, add, commit, and optionally push.\n"
        "4) Hand off to Docs to update SPEC_PATH with a Run Summary, milestone ticks, and Context7 references.\n"
        "5) Hand off to Reporter with the final JSON payloads for a concise human summary."
    ),
    handoffs=[handoff(dev), handoff(qa), handoff(vcs), handoff(docs), handoff(reporter)],
)

session = SQLiteSession(
    "avflow_one_shot",
    max_messages=200,
    window_messages=10,
    summarization=True
)

async def main():
    goal = (
        f"Build and serve the Vite app on port {PORT}. "
        f"Run Playwright e2e against {BASE_URL}. "
        "Record a 5s Chrome perf trace and collect console errors. "
        "Update .gitignore, stage+commit(+push if PUSH=1). "
        f"Update SPEC_PATH ({SPEC_PATH}) with a run summary, milestone ticks, and references via Context7. "
        "Produce a concise human summary."
    )
    async with context7, codex, chrome, memory:
        result = await Runner.run(triage, goal, session=session)
        print("\n=== FINAL SUMMARY ===\n")
        print(result.final_output)

if __name__ == "__main__":
    asyncio.run(main())
