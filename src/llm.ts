import 'dotenv/config'
import { ChatAnthropic } from '@langchain/anthropic'
import { ChatOpenAI } from '@langchain/openai'
import type { AgentModelConfig } from './config'

const ZAI_API_KEY = process.env.ZAI_API_KEY
const ZAI_BASE_URL = process.env.ZAI_BASE_URL

/**
 * Create an LLM instance based on an AgentModelConfig.
 * Each agent passes its own config from src/config.ts.
 */
export function createLLM(config: AgentModelConfig) {
  if (config.provider === 'anthropic') {
    return new ChatAnthropic({
      model: config.model,
      temperature: config.temperature,
    })
  }

  if (config.provider === 'zai') {
    return new ChatAnthropic({
      apiKey: ZAI_API_KEY,
      anthropicApiUrl: ZAI_BASE_URL,
      model: config.model,
      temperature: config.temperature,
    })
  }

  // Default: OpenAI
  return new ChatOpenAI({
    model: config.model,
    temperature: config.temperature,
  })
}
