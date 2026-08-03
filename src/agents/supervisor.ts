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

You will receive a summary of the current state with YES/NO flags. Decide the next agent based on these rules (apply the FIRST rule that matches):

1. Research NOT completed → call researcher
2. Research completed + style samples provided + style guide NOT generated → call style_analyzer
3. Research completed + (style guide generated OR no style samples) + blog draft NOT generated → call writer
4. Blog draft generated → call FINISH

Do NOT call the same agent repeatedly. Always progress forward or FINISH.
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