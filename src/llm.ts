import "dotenv/config"
import { ChatAnthropic } from '@langchain/anthropic'
import { ChatOpenAI } from '@langchain/openai'


const ZAI_API_KEY = process.env.ZAI_API_KEY
const ZAI_BASE_URL = process.env.ZAI_BASE_URL

export function createLLM() {
    const provider = process.env.LLM_PROVIDER ?? "openai"
    const model = process.env.LLM_MODEL ?? "glm-5.2"

    if(provider === "antrophic"){
        return new ChatAnthropic({
            model,
            temperature: 0
        })
    }

    if(provider === 'zai'){
        return new ChatAnthropic({
            apiKey: ZAI_API_KEY,
            anthropicApiUrl: ZAI_BASE_URL,
            model,
            temperature: 0
        })
    }

    return new ChatOpenAI({
        model,
        temperature: 0
    })
}