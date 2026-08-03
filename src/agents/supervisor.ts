import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import z from 'zod'


// Schema for the routing decision
const RoutingDecision = z.object({
    next: z
        .enum([
            "researcher",
            "style_analyzer",
            "writer",
            "FINISH"
        ])
        .describe("The next agent to call, or FINISH when the task is complete"),
    reason: z
        .string()
        .describe("Brief explanation of why this agent was chosen next")
})

const SUPERVISOR_PROMPT = 
`
You are a supervisor orchestrating a team of agents to turn a codebase into a blog article.

Available agents:
- **researcher**: Deeply analyzes a GitHub repository. Call this FIRST to understand the codebase.
- **style_analyzer**: Analyzes sample blog posts to extract writing style. Call this after research ONLY if the user provided style samples.
- **writer**: Writes the blog article. Call this after research is complete and style analysis is done (if applicable).

The workflow is:
1. If no research has been done → call researcher
2. If research done + style samples provided + no style guide yet → call style_analyzer
3. If research done + style analysis done (or not needed) + no blog draft → call writer
4. If blog draft exists and it looks complete → call FINISH
5. If blog draft exists but needs revision → call writer again with feedback

Current state of the conversation is provided. Make your decision based on what has been completed so far.
`

/**
 * Creates a supervisor chain that decides which agent to call next.
 * Returns { next: string, reason: string }.
 */
export function createSupervisorChain(llm: BaseChatModel){
    const prompt = ChatPromptTemplate.fromMessages([
        ["system", SUPERVISOR_PROMPT],
        ["placeholder", "{messages}"]
    ])

    return prompt.pipe(llm.withStructuredOutput(RoutingDecision))
}