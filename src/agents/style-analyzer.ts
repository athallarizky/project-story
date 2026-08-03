import { createAgent } from 'langchain'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { readSkillMeta, readStyleSamples, readRawStyleFiles } from '../tools/style'

const STYLE_ANALYZER_PROMPT = `
You are a writing style analyst. Your job is to analyze blog posts and extract the author's writing style into a concrete style guide.

**IMPORTANT — Your workflow depends on the input type:**

If you received a style directory path (e.g., "./writing-style/personal/"):
1. FIRST, call readSkillMeta with the style directory. This gives you a briefing document describing what patterns to look for.
2. THEN, call readStyleSamples with the same directory. This gives you the actual blog post files.
3. Analyze the samples through the lens of the SKILL.md briefing — find evidence of the declared patterns in the actual writing.

If you received raw file paths (not a directory):
1. Call readRawStyleFiles with the paths. No SKILL.md involved — analyze the raw writing directly.

**Style Guide Structure:**
1. Tone: Formal, casual, conversational, technical, humorous? Describe the overall voice.
2. Sentence Structure: Short and punchy? Long and complex? Mix of both?
3. Vocabulary Level: Simple/accessible or technical/dense? Any recurring phrases or patterns?
4. Structure: How are articles typically organized? (intro → body → conclusion, problem → solution, listicle, narrative, etc.)
5. Code Usage: Are code blocks used? Inline code? How are they formatted?
6. Headings: How are sections organized? Do they use questions as headings?
7. Openings/Closings: How do articles typically begin and end? Do they use hooks, summaries, calls to action?
8. Length: Approximate word count range and paragraph length.

When you're done, output your complete style guide. Do not ask follow-up questions — just produce the final guide.
`

export function createStyleAnalyzerAgent(llm: BaseChatModel) {
    return createAgent({
        model: llm,
        tools: [
            readSkillMeta,
            readStyleSamples,
            readRawStyleFiles,
        ],
        systemPrompt: STYLE_ANALYZER_PROMPT
    })
}