import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import path from 'path'
import fs from 'fs'


/**
 * Read the SKILL.md file from a style directory.
 * This is the briefing document that tells the agent what patterns to look for
 * before it reads the actual sample files.
 */
export const readSkillMeta = tool(
    async () => {

    },
    {
        name: "readSkillMeta",
        description: "Read the SKILL.md briefing document from a style directory. This tells you what writing patterns to look for in the samples. Call this FIRST, before reading any sample files.",
        schema: z.object({
            styleDir: z
            .string()
            .describe("Path to the style directory (e.g., './writing-style/personal/')")
        })
    }
)

/**
 * Read all sample .md files (excluding SKILL.md) from a style directory.
 * Call this AFTER readSkillMeta so you can analyze the samples through the lens
 * of the briefing document.
 */
export const readStyleSamples = tool(
    async ({ styleDir }) => {
        if(!fs.existsSync(styleDir)){
            return `Style directory not found: ${styleDir}`
        }

        const files = fs
            .readdirSync(styleDir)
            .filter(
                (file) => file.endsWith(".md") && file !== "SKILL.md"
            )

        if(files.length === 0){
            return `No sample .md files found in ${styleDir}`
        }

        let output = ""
        for(let i = 0; i < files.length; i++){
            const filePath = path.join(styleDir, files[i])
            const content = fs.readFileSync(filePath, "utf-8")
            output += `=== Sample ${i + 1}: ${files[i]} ===\n${content}\n\n`
        }

        return output || "No samples cound be read."
    },
    {
        name: "readStyleSamples",
        description: "Read all sample .md blog post files from a style directory (NOT SKILL.md - use readSkillMeta for that). Call this AFTER readSkillMeta to analyze the samples through the briefing lens.",
        schema: z.object({
            styleDir: z
                .string()
                .describe("Path to the style directory (e.g., './writing-style/personal/')")
        })
    }
)

/**
 * Read explicit file paths (fallback/legacy mode — no SKILL.md involved).
 * Used when the user passes raw file paths instead of a style name.
 */
export const readRawStyleFiles = tool(
    async ({ paths }) => {
        let output = ""

    for(let i = 0; i < paths.length; i++){
        const filePath = paths[i]
        if(!fs.existsSync(filePath)){
            output += `Sample ${i + 1}: File not found at ${filePath}\n\n`
            continue;
        }

        const content = fs.readFileSync(filePath, "utf-8")
        output += `=== Sample ${i + 1}: ${filePath} ===\n${content}\n\n`
    }

    return output || "No samples could be read."

    },
    {
        name: "readRawStyleFiles",
        description: "Read one or more blog post files directly (no SKILL.md involved). Use this when analyzing raw files instead of an organized style directory.",
        schema: z.object({
            paths: z
                .array(z.string())
                .describe("Array of file paths to sample blog posts")
        })
    }
)