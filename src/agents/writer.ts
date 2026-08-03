import { createAgent } from "langchain";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";

const WRITER_PROMPT = `You are a technical blog writer. Your job is to write an engaging, well-structured blog article about a codebase based on research findings.

You will receive:
- A research report about the codebase (from the Researcher agent)
- Optionally: A style guide with writing preferences (from the Style Analyzer agent)

**Your Process:**
1. Read the research report carefully. Identify the most interesting aspects of the project.
2. If a style guide is provided, match its tone, structure, and patterns.
3. Write a blog article in markdown format.

**Article Requirements:**
- Engaging title that captures attention
- Opening hook — why should the reader care about this project?
- Clear explanation of what the project does (not just technical, but why it matters)
- Walk through the architecture and key design decisions
- Include code snippets or examples where meaningful
- Mention interesting technical details from the research
- Conclusion that ties everything together
- Length: Aim for an article that takes 5-8 minutes to read (roughly 1000-1500 words)

**Format:**
Output the article as clean markdown with appropriate headings, code blocks, and formatting.

When you're done, output only the article. Do not wrap it in additional commentary.`;

export function createWriterAgent(llm: BaseChatModel) {
  return createAgent({
    model: llm,
    tools: [], // Writer doesn't need external tools — it works from state
    systemPrompt: WRITER_PROMPT,
  });
}