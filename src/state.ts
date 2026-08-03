import { Annotation } from '@langchain/langgraph'
import { BaseMessage } from '@langchain/core/messages'

/**
 * Shared state for the multi-agent graph.
 *
 * Key pattern: messages use a concat reducer so every agent
 * sees the full conversation history. Other fields are plain
 * values (last write wins).
 */
export const AgentState = Annotation.Root({
    // ── Conversation history ──
    // The concat reducer means new messages are appended, not overwritten.
    messages: Annotation<BaseMessage[]>({
        reducer: (prev, next) => prev.concat(next),
        default: () => [],
    }),

    // Inputs (set by CLI before graph starts)
    repoInput: Annotation<string>(), // raw input: URL or local path
    repoPath: Annotation<string>(), // resolved absolute path on disk
    styleName: Annotation<string>(), // "personal" | "casual" | "" (from --style)
    styleDir: Annotation<string>(), // resolved directory (e.g., "./writing-style/personal/")
    styleSamplePaths: Annotation<string[]>({
        reducer: (_, next) => next,
        default: () => []
    }), // legacy: raw file paths

    // Agent outputs
    researchReport: Annotation<string>(),
    styleGuide: Annotation<string>(),
    blogDraft: Annotation<string>(),
    language: Annotation<string>(),       // extracted from SKILL.md: "id" | "en"

    // Supervisor routing
    next: Annotation<string>({
        reducer: (_, next) => next,
        default: () => "researcher"
    })

})

export type AgentStateType = typeof AgentState.State;