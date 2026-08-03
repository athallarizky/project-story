import 'dotenv/config'

/**
 * Centralized configuration for agent names, models, and providers.
 *
 * Each agent can use a different model via env vars:
 *   RESEARCHER_MODEL, RESEARCHER_PROVIDER
 *   STYLE_MODEL, STYLE_PROVIDER
 *   WRITER_MODEL, WRITER_PROVIDER
 *   SUPERVISOR_MODEL, SUPERVISOR_PROVIDER
 *
 * Falls back to LLM_MODEL / LLM_PROVIDER if per-agent vars are not set.
 */

// ── Agent member names (used as graph node names and routing targets) ──

export const MEMBERS = {
  RESEARCHER: 'researcher',
  STYLE_ANALYZER: 'style_analyzer',
  WRITER: 'writer',
  SUPERVISOR: 'supervisor',
} as const

export type MemberName = (typeof MEMBERS)[keyof typeof MEMBERS]

// ── Per-agent model configuration ──

export interface AgentModelConfig {
  provider: string
  model: string
  temperature: number
}

function resolveConfig(
  agentKey: string,
  defaultModel: string,
  defaultTemperature: number,
): AgentModelConfig {
  const envPrefix = agentKey.toUpperCase()
  const provider =
    process.env[`${envPrefix}_PROVIDER`] ??
    process.env.LLM_PROVIDER ??
    'zai'
  const model =
    process.env[`${envPrefix}_MODEL`] ??
    process.env.LLM_MODEL ??
    defaultModel

  return { provider, model, temperature: defaultTemperature }
}

/**
 * Per-agent model assignments:
 *
 * - researcher: glm-5.2  — long-horizon tasks, 1M context, sustained tool calling
 * - supervisor: glm-5.1  — critical routing decisions from small state summary
 * - style_analyzer: glm-5-turbo — medium, pattern extraction from files
 * - writer: glm-4.7 — creative output from structured research report
 */
export const agentConfig: Record<MemberName, AgentModelConfig> = {
  researcher: resolveConfig('researcher', 'glm-5.2', 0),
  style_analyzer: resolveConfig('style', 'glm-5-turbo', 0),
  writer: resolveConfig('writer', 'glm-4.7', 0.7),
  supervisor: resolveConfig('supervisor', 'glm-5.1', 0),
}
