import { createLLM } from '../llm'

async function test() {
    const llm = createLLM({})
    const response = await llm.invoke("say hello")
    console.log("Response:", response.content)
}

test()