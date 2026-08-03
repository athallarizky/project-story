import simpleGit from 'simple-git'
import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import path from 'path'
import fs from 'fs'


// Tool: Clone a repository
export const cloneRepo = tool(
    async({ url }) => {
        const reposDir = path.join(process.cwd(), "repos");
        if(!fs.existsSync(reposDir)) {
            fs.mkdirSync(reposDir, { recursive: true })
        }

        // Extract repo name from URL for the folder
        const repoName = url.split("/").pop()?.replace("/git", "") ?? "repo"
        const repoPath = path.join(reposDir, repoName)

        // Clone only if not already cloned
        if(!fs.existsSync(repoPath)){
            const git = simpleGit()
            await git.clone(url, repoPath, ["--depth", "1"])
        }

        return `Repository cloned to: ${repoPath}`
    },
    {
        name: "cloneRepo",
        description: "Clone a GitHub repository to the local filesystem. Use this first to get the repo on disk.",
        schema: z.object({
            url: z.string().describe("The GitHub repository URL (https or git protocol)")
        })
    }
)

// Tool: Get repository file structure
export const getRepoStructure = tool(
    async({ repoPath }) => {
        const git = simpleGit(repoPath)

        // Use git ls-files for a clean listing (respects .gitignore)
        const files = await git.raw("ls-files")
        const excludeDirs = ["node_modules", "dist", ".git", "build", "__pycache__", "coverage"]
        const filtered = files
            .split("\n")
            .filter((file) => file && !excludeDirs.some((dir) => file.startsWith(dir) || file.includes(`/${dir}/`)))

        // Build a simple tree representation
        const tree: Record<string, string[]> = {}
        for(const file of filtered){
            const dir = path.dirname(file);
            if(!tree[dir]) tree[dir] = []
            tree[dir].push(path.basename(file))
        }

        let output = `Repository structure (${filtered.length} files):\n`;
        for (const [dir, files] of Object.entries(tree).sort()) {
            output += `\n${dir}/\n`;
            for (const file of files) {
                output += `  ${file}\n`;
            }
        }

        return output;

    },
    {
        name: "getRepoStructure",
        description: "Get the file tree/structure of a cloned repository. Useful to understand the project layout.",
        schema: z.object({
            repoPath: z.string().describe("The path where the repo was cloned")
        })
    }
)

// Tool: Get git commit log
export const getGitLog = tool(
    async ({ repoPath, maxCommits = 20}) => {
        const git = simpleGit(repoPath)
        const log = await git.log({ maxCount: maxCommits })

        let output = `Recent commit:\n`
        for(const commit of log.all){
            const date = new Date(commit.date).toISOString().split("T")[0]
            const msg = commit.message.split("\n")[0];
            output += `[${date}] ${msg} (${commit.author_name})`
        }

        return output

    },
    {
        name: "getGitLog",
        description: "Get the recent commit history of a repository. Shows dates, messages, and authors.",
        schema: z.object({
            repoPath: z.string().describe("The path where the repo was cloned"),
            maxCommits: z
                .number()
                .optional()
                .default(20)
                .describe("Maximum number of commits to retrieve"),
        }),
    }
)