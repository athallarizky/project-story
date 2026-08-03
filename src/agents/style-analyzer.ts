import { createAgent } from 'langchain'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { readSkillMeta, readStyleSamples, readRawStyleFiles } from '../tools/style'

const STYLE_ANALYZER_PROMPT = `
You are a writing style analyst. Your job is to analyze blog posts and extract the author's writing style into a concrete style guide.

**CRITICAL — Language detection:**
When you call readSkillMeta, pay attention to the "Detected language:" field. This tells you what language the final article MUST be written in. Include the language in your style guide summary as the FIRST line: "LANGUAGE: id" or "LANGUAGE: en".

**IMPORTANT — Your workflow depends on the input type:**

If you received a style directory path (e.g., "./writing-style/personal/"):
1. FIRST, call readSkillMeta with the style directory.
2. THEN, call readStyleSamples with the same directory.
3. Analyze the samples through the lens of the SKILL.md briefing.

If you received raw file paths (not a directory):
1. Call readRawStyleFiles with the paths. No SKILL.md involved.

**Style Guide Structure:**
Start with "LANGUAGE: <code>" then:
1. Tone: Formal, casual, conversational, technical, humorous?
2. Sentence Structure: Short and punchy? Long and complex?
3. Vocabulary Level: Simple/accessible or technical/dense?
4. Structure: How are articles typically organized?
5. Code Usage: Are code blocks used? Inline code?
6. Headings: How are sections organized?
7. Openings/Closings: How do articles begin and end?
8. Length: Approximate word count range.

Output the complete style guide. Do not ask follow-up questions.`

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