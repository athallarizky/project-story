import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'


// Tool: Read a file
export const readFile = tool(
    async ({ filePath }) => {
        const absolutePath = path.isAbsolute(filePath) 
        ? filePath
        : path.join(process.cwd(), filePath)

        if(!fs.existsSync(absolutePath)){
            return `Error: File not found at ${absolutePath}`
        }

        const content = fs.readFileSync(absolutePath, "utf-8")
        
        // Capped to avoid blowing context
        const maxLines = 500
        const lines = content.split("\n")
        const truncated = lines.length > maxLines
        const display = lines.slice(0, maxLines).join("\n")

        let result = `File: ${absolutePath} (${lines.length} lines) \n\n ${display}`
        if(truncated){
            result += `\n\n[File truncated - showing first ${maxLines} of ${lines.length} lines]`
        }

        return result
    },
    {
        name: "readFile",
        description: "Read the contents of a file. Use this to inspect source code, README, config files, etc.",
        schema: z.object({
            filePath: z.string().describe("Path to the file (absolute or relative to working directory)")
        })
    }
)

// Tool: Parse package.json
export const readPackageJson = tool(
    async ({ repoPath }) => {
        const pgkPath = path.join(repoPath, "package.json")

        if(!fs.existsSync(pgkPath)){
            return "No package.json found in this repository (might not be a Node.js project)"
        }

        const raw = JSON.parse(fs.readFileSync(pgkPath, "utf-8"))
        const summary = {
            name: raw.name,
            description: raw.description,
            version: raw.version,
            dependencies: raw.dependencies,
            devDependencies: raw.devDependencies,
            scripts: raw.scripts,
            main: raw.main,
            type: raw.type
        }

        return JSON.stringify(summary, null, 2)
    },
    {
        name: "readPackageJson",
        description: "Parse the package.json file in a repo. Returns dependencies, scripts, and project metadata.",
        schema: z.object({
            repoPath: z.string().describe("The path where the repo was cloned")
        })
    }
)

// Tool: Search code with a pattern
export const searchCode = tool(
    async ({ repoPath, pattern }) => {
        const { execSync } = await import("child_process")

        try {
            const result = execSync(
                `grep -rnF --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" --include="*.json" --include="*.md" -- "${pattern}" ${repoPath}`,
                { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 }
            )

            const lines = result.split("\n").filter(Boolean)
            if(lines.length === 0){
                return `No matches found for pattern: "${pattern}"`
            }

            const display = lines.slice(0, 30).join("\n")
            if(lines.length > 30){
                return `${display}\n\n[${lines.length - 30} more matches truncated]`
            }

            return display
        } catch (error: any) {
            if(error.status === 1){
                return `No matches found for pattern: "${pattern}"`
            }
            return `Search error: ${error.message}`
        }
    }, 
    {
        name: "searchCode",
        description: "Search for a atext pattern across all source files in the repository. Returns matching lines with file paths and line numbers.",
        schema: z.object({
            repoPath: z.string().describe("The path where the repo was cloned"),
            pattern: z.string().describe("The text or regex pattern to search for")
        })
    }
)

export const fileSystemTools = [readFile, readPackageJson, searchCode]