import { createLLM } from '../llm'
import { agentConfig } from '../config'

async function test() {
    const llm = createLLM(agentConfig.researcher)
    const response = await llm.invoke("say hello")
    console.log("Response:", response.content)
}

test()
