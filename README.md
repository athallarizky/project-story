# Project Story

> Turn any GitHub repo into a blog article — powered by AI agents.

Project Story uses 4 AI agents working together to research a codebase, learn your writing style, and produce a polished blog article. Clone a repo, pick a style, get a blog.

## Quick Start

```bash
# Clone and install
git clone https://github.com/athallarizky/project-story.git
cd project-story
npm install

# You need an LLM provider — add your API key to .env
cp .env.example .env
# Edit .env with your key

# Generate a blog
npx tsx src/index.ts https://github.com/sindresorhus/is.git --style personal
```

## How It Works

4 specialized agents collaborate under a supervisor:

| Agent | Role | Model |
|-------|------|-------|
| 🔍 Researcher | Clones repo, studies codebase, produces research report | `glm-5.2` |
| 📝 Style Analyzer | Reads your SKILL.md + sample posts, extracts writing style | `glm-5-turbo` |
| ✍️ Writer | Turns research into a blog article in your voice | `glm-4.7` |
| 🧭 Supervisor | Routes between agents, decides when the article is done | `glm-5.1` |

Each agent uses a different LLM model — heavy reasoning for research, lightweight for writing.

## Writing Styles

Organize your writing styles in `writing-style/`:

```
writing-style/
  personal/
    SKILL.md         ← meta: tone, structure, language (id/en)
    samples/         ← your actual blog posts
      post-1.md
      post-2.md
  casual/
    SKILL.md
    samples/
      weekend-dump.md
```

The Style Analyzer reads `SKILL.md` first as a briefing, then analyzes your samples through that lens. Set `language: id` for Indonesian output.

```bash
# Indonesian article with your personal style
npx tsx src/index.ts https://github.com/solidjs/solid.git --style personal

# English article with casual tone
npx tsx src/index.ts https://github.com/user/repo.git --style casual
```

## CLI

```bash
npx tsx src/index.ts <repo-url-or-path> [--style <name>] [--model <model>] [--provider <provider>]
```

Output auto-saves to `output/<repo>/<repo>-<YYYYMMDD>-<style>.md`.

Accepts both GitHub URLs (auto-clones into `./repos/`) and local paths.

## Stack

- **LangChain.js + LangGraph** for multi-agent orchestration
- **createAgent + tool calling** for agent logic
- **Supervisor pattern** with structured output routing
- **GLM models** via Z.AI (provider-agnostic)

## License

MIT
