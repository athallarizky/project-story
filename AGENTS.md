# Project Story — Agent Briefing

> This file tells AI agents (Claude Code, Copilot, etc.) what this project is, how to help, and how to run things. Read this first.

---

## What This Project Is

A CLI tool that turns any GitHub repo into a blog article using LangChain.js + LangGraph multi-agent orchestration.

- 4 AI agents work together: **Researcher** (studies codebases), **Style Analyzer** (learns writing style from SKILL.md), **Writer** (produces the article), **Supervisor** (routes between them)
- Supports GitHub URLs (auto-clones into `./repos/`) and local paths (uses directly)
- Writing styles are organized in `./writing-style/<name>/` with a `SKILL.md` briefing document + sample `.md` files
- Output auto-saves to `./output/<repo-name>/<repo-name>-<YYYYMMDD>-<style>.md`

---

## How to Run

```bash
# Basic — no style (saves as "default")
npx tsx src/index.ts https://github.com/sindresorhus/is-odd.git

# Named style from writing-style/
npx tsx src/index.ts https://github.com/solidjs/solid.git --style personal

# Local repo path
npx tsx src/index.ts /development/personal/my-project --style professional

# Override model/provider
npx tsx src/index.ts https://github.com/expressjs/express.git \
  --model gpt-4o \
  --provider openai
```

---

## How You Can Help

**Answer questions about:**
- LangChain.js concepts (createReactAgent, StateGraph, Annotation.Root, tool calling, supervisor pattern)
- How the multi-agent pipeline works
- Any code in this project — explain what a file does, why a pattern was used
- SKILL.md pattern — how agents consume meta-instructions before data
- How to extend the project (new tools, new agents, new writing styles)

**Do NOT implement code unless explicitly asked.** The user is learning by doing and writes code themselves. Your job is to explain, clarify, and guide.

**When the user asks to "generate a story" or "turn X repo into a blog":**
Run the CLI directly:
```
npx tsx src/index.ts <repo-url-or-path> [--style <name>]
```

---

## Project Structure

```
project-story/
├── repos/                    ← cloned repos (gitignored)
├── output/                   ← generated articles (gitignored)
├── writing-style/            ← style configs (version controlled)
│   ├── personal/SKILL.md
│   ├── professional/SKILL.md
│   └── casual/SKILL.md
├── docs/                     ← build guide (phases 1-5)
│   ├── plan.md               ← start here to understand the architecture
│   ├── phase-1-scaffold.md
│   ├── phase-2-tools.md
│   ├── phase-3-agents.md
│   ├── phase-4-graph.md
│   └── phase-5-cli.md
└── src/
    ├── index.ts              ← CLI entry point
    ├── graph.ts              ← StateGraph orchestration
    ├── state.ts              ← shared state schema
    ├── agents/               ← researcher, style-analyzer, writer, supervisor
    ├── tools/                ← git, filesystem, style tools
    └── llm.ts                ← provider-agnostic LLM factory
```

---

## Key Concepts

- **Supervisor pattern** — central agent routes to specialized workers via structured output
- **SKILL.md** — per-directory briefing doc; agents read it first, then process data through that lens
- **createReactAgent** — wraps LLM + tools + prompt into a ReAct-loop agent
- **StateGraph** — directed graph where nodes are agents and edges are routing decisions
- **Tool calling** — agents invoke typed functions (Zod schemas) to interact with git/filesystem
