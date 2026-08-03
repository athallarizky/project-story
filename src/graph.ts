import { StateGraph, END, START } from '@langchain/langgraph'
import { AIMessage, HumanMessage } from '@langchain/core/messages'
import { AgentState } from './state'
import { createLLM } from './llm'
import { 
    createResearcherAgent,
    createStyleAnalyzerAgent,
    createWriterAgent,
    createSupervisorChain
} from './agents'


// Agent member names (used as node names and routing targets)
const MEMBERS = {
    RESEARCHER: "researcher",
    STYLE_ANALYZER: "style_analyzer",
    WRITER: "writer",
    SUPERVISOR: "supervisor"
} as const;

// Worker agents (createAgent)
const llm = createLLM({})
const researcherAgent = createResearcherAgent(llm)
const styleAnalyzerAgent = createStyleAnalyzerAgent(llm)
const writerAgent = createWriterAgent(llm)

// Supervisor (structured output chain)
const supervisorChain = createSupervisorChain(llm)

// Node Function

/**
 * Researcher node.
 * Handles both remote repos (clone first) and local paths (use directly).
 */
async function researcherNode(state: typeof AgentState.State) {
    const isRemote = state.repoInput?.startsWith("http")

    const prompt = isRemote
        ?   `Please research this repository: ${state.repoInput}\n\n` +
            `First, clone it to: ${state.repoPath} (use the cloneRepo tool).\n` +
            `Then study the codebase thoroughly and produce your research report.`
        :   `Please research this local repository at: ${state.repoPath}\n\n` +
            `The repository is already on disk — no need to clone.\n` +
            `Study the codebase thoroughly and produce your research report.`;

    const input = {
        messages: [
            new HumanMessage(prompt)
        ]
    }

    const result = await researcherAgent.invoke(input)
    const lastMessage = result.messages[result.messages.length - 1]

    const reportText = typeof lastMessage.content === "string"
        ? lastMessage.content
        : JSON.stringify(lastMessage.content)

    return {
        messages: [
            new AIMessage({ 
                content: reportText,
                name: MEMBERS.RESEARCHER
            })
        ],
        researchReport: reportText
    }

}

/**
 * Style Analyzer node.
 * Two modes:
 * - SKILL.md mode: styleDir is set → agent reads SKILL.md first, then samples
 * - Raw files mode: styleSamplePaths has entries → agent reads files directly
 */
async function styleAnalyzerNode(state: typeof AgentState.State) {
    const hasStyleDir = state.styleDir && state.styleDir.length > 0
    const hasRawPaths = state.styleSamplePaths && state.styleSamplePaths.length > 0

    if(!hasStyleDir && !hasRawPaths){
        return {
            messages: [
                new AIMessage({
                    content: "No style configuration provided. Using default writing style.",
                    name: MEMBERS.STYLE_ANALYZER
                })
            ],
            styleGuide: "",
        }
    }

    const prompt = hasStyleDir
        ?   `Analyze the writing style in this directory: ${state.styleDir}\n\n` +
            `IMPORTANT: First, call readSkillMeta to get the briefing. Then call readStyleSamples to read the blog posts. ` +
            `Use the SKILL.md as your lens when analyzing the samples.`
        :   `Analyze these blog posts and produce a style guide:\n` +
            (state.styleSamplePaths ?? []).map((p) => `- ${p}`).join("\n");

    const input = {
        messages: [
            new HumanMessage(prompt)
        ]
    }

    const result = await styleAnalyzerAgent.invoke(input);
    const lastMessage = result.messages[result.messages.length - 1]

    const guideText = typeof lastMessage.content === "string"
        ? lastMessage.content
        : JSON.stringify(lastMessage.content)


    return {
        messages: [
            new AIMessage({ 
                content: guideText, 
                name: MEMBERS.STYLE_ANALYZER
            })
        ],
        styleGuide: guideText
    }
}

/**
 * Writer node.
 * Takes research report and style guide, produces a blog article.
 */
async function writerNode(state: typeof AgentState.State){
    let prompt =  `Write a blog article about this codebase. \n\nResearch Report:\n
                    ${state.researchReport ??  "No research available."}`;

    if (state.styleGuide) {
        prompt += `\n\nUse this writing style:\n${state.styleGuide}`;
    }

    if (state.blogDraft) {
        prompt += `\n\nHere is the current draft. Improve it based on the research and any previous feedback:\n${state.blogDraft}`;
    }

    const input = {
        messages: [
            new HumanMessage(prompt)
        ]
    }

    const result = await writerAgent.invoke(input)
    const lastMessage = result.messages[result.messages.length - 1]

    const blogText = typeof lastMessage.content === "string"
        ? lastMessage.content
        : JSON.stringify(lastMessage.content)

    return {
        messages: [
            new AIMessage({
                content: blogText,
                name: MEMBERS.WRITER
            })
        ],
        blogDraft: blogText
    }
}

/**
 * Supervisor node.
 * Reviews the current state and decides which agent should go next.
 * We summarize the state explicitly so the supervisor doesn't get lost
 * in the full conversation history.
 */
async function supervisorNode(state: typeof AgentState.State){
    const hasResearch = !!state.researchReport
    const hasStyleGuide = !!state.styleGuide
    const hasBlogDraft = !!state.blogDraft
    const hasStyleSamples = !!(state.styleDir || (state.styleSamplePaths && state.styleSamplePaths.length > 0))

    const summary = `
Current state:
- Research completed: ${hasResearch ? "YES" : "NO"}
- Style samples provided: ${hasStyleSamples ? "YES" : "NO"}
- Style guide generated: ${hasStyleGuide ? "YES" : "NO"}
- Blog draft exists: ${hasBlogDraft ? "YES" : "NO"}

Based on the workflow rules, which agent should go next? Respond with the routing decision.
`

    const result = await supervisorChain.invoke({
        messages: [
            new HumanMessage(summary)
        ]
    })

    console.log(`[Supervisor] → ${result.next} (${result.reason})`)

    return {
        next: result.next,
        messages: [
            new AIMessage({
                content: `Routing to: ${result.next} (Reason: ${result.reason})`,
                name: MEMBERS.SUPERVISOR
            })
        ]
    }
}

/**
 * Routing function for conditional edges.
 * Reads state.next and returns the next node name, or END.
 */
function supervisorRouter(state: typeof AgentState.State) : string {
    const next = state.next

    if(next === "FINISH"){
        return END; // from langgraph '__end__'
    }

    // Route to the named worker node
    if(next === MEMBERS.RESEARCHER) return MEMBERS.RESEARCHER
    if(next === MEMBERS.STYLE_ANALYZER) return MEMBERS.STYLE_ANALYZER
    if(next === MEMBERS.WRITER) return MEMBERS.WRITER

    // Fallback: go back to supervisor for re-evaluation
    return MEMBERS.SUPERVISOR
}

// Build the graph 
const workflow = new StateGraph(AgentState)
// add nodes
.addNode(MEMBERS.SUPERVISOR, supervisorNode)
.addNode(MEMBERS.RESEARCHER, researcherNode)
.addNode(MEMBERS.STYLE_ANALYZER, styleAnalyzerNode)
.addNode(MEMBERS.WRITER, writerNode)

// start: directly call supervisor
.addEdge(START, MEMBERS.SUPERVISOR)

// workers always return to supervisor for next decision
.addEdge(MEMBERS.RESEARCHER, MEMBERS.SUPERVISOR)
.addEdge(MEMBERS.STYLE_ANALYZER, MEMBERS.SUPERVISOR)
.addEdge(MEMBERS.WRITER, MEMBERS.SUPERVISOR)

// supervisor uses conditional routing
.addConditionalEdges(MEMBERS.SUPERVISOR, supervisorRouter)

// Compile the graph
export const app = workflow.compile() // entrypoint
