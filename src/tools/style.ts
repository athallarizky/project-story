import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import path from 'path'
import fs from 'fs'

/**
 * Read the SKILL.md file from a style directory.
 * Returns the briefing document AND parses metadata like language.
 */
export const readSkillMeta = tool(
  async ({ styleDir }) => {
    const skillPath = path.join(styleDir, 'SKILL.md')

    if (!fs.existsSync(skillPath)) {
      return `No SKILL.md found in ${styleDir}. Proceed with default analysis.`
    }

    const content = fs.readFileSync(skillPath, 'utf-8')

    // Extract metadata: language (first line like "language: id" or "language: en")
    const langMatch = content.match(/^language:\s*(.+)$/m)
    const language = langMatch ? langMatch[1].trim() : 'en'

    return [
      `=== SKILL.md (briefing) ===`,
      `Detected language: ${language}`,
      ``,
      content,
      ``,
      `Use this as your lens for analyzing the sample files.`,
      `IMPORTANT: Note the language field. The final blog article MUST be written in: ${language}`,
    ].join('\n')
  },
  {
    name: 'readSkillMeta',
    description:
      'Read the SKILL.md briefing document from a style directory. Returns metadata (language, tone) and instructions. Call this FIRST, before reading any sample files.',
    schema: z.object({
      styleDir: z
        .string()
        .describe("Path to the style directory (e.g., './writing-style/personal/')"),
    }),
  }
)

/**
 * Read all sample .md files from the samples/ subfolder.
 * Call this AFTER readSkillMeta so you can analyze through the briefing lens.
 */
export const readStyleSamples = tool(
  async ({ styleDir }) => {
    const samplesDir = path.join(styleDir, 'samples')

    if (!fs.existsSync(samplesDir)) {
      return `No samples/ directory found in ${styleDir}. Looking in root... trying flat structure.`
    }

    const files = fs.readdirSync(samplesDir).filter((f) => f.endsWith('.md'))

    if (files.length === 0) {
      return `No sample .md files found in ${samplesDir}`
    }

    let output = ''
    for (let i = 0; i < files.length; i++) {
      const filePath = path.join(samplesDir, files[i])
      const content = fs.readFileSync(filePath, 'utf-8')
      output += `=== Sample ${i + 1}: ${files[i]} ===\n${content}\n\n`
    }

    return output || 'No samples could be read.'
  },
  {
    name: 'readStyleSamples',
    description:
      'Read all sample .md blog post files from the samples/ subfolder of a style directory. Call this AFTER readSkillMeta to analyze through the briefing lens.',
    schema: z.object({
      styleDir: z
        .string()
        .describe("Path to the style directory (e.g., './writing-style/personal/')"),
    }),
  }
)

/**
 * Read explicit file paths (fallback/legacy mode — no SKILL.md involved).
 */
export const readRawStyleFiles = tool(
  async ({ paths }) => {
    let output = ''

    for (let i = 0; i < paths.length; i++) {
      const filePath = paths[i]
      if (!fs.existsSync(filePath)) {
        output += `Sample ${i + 1}: File not found at ${filePath}\n\n`
        continue
      }

      const content = fs.readFileSync(filePath, 'utf-8')
      output += `=== Sample ${i + 1}: ${filePath} ===\n${content}\n\n`
    }

    return output || 'No samples could be read.'
  },
  {
    name: 'readRawStyleFiles',
    description:
      'Read one or more blog post files directly (no SKILL.md involved). Use this when analyzing raw files instead of an organized style directory.',
    schema: z.object({
      paths: z
        .array(z.string())
        .describe('Array of file paths to sample blog posts'),
    }),
  }
)
