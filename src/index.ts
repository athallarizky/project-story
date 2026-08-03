import 'dotenv/config'
import { Command } from 'commander'
import { HumanMessage } from '@langchain/core/messages'
import fs from 'fs'
import path from 'path'

const program = new Command()

program
    .name('project-story')
    .description('Turn any GitHub repository into a blog article using AI agents')
    .version('1.0.0')
    .argument('<repo>', 'GitHub URL or local path to the repository')
    .option('-s, --style <name>', 'Writing style name (e.g., "personal") or path to style directory')
    .option('-m, --model <model>', 'Override the LLM model')
    .option('-p, --provider <provider>', 'Override the LLM provider (openai, anthropic, zai)')
    .action(async (repoInput, options) => {
        // Override env vars BEFORE importing the graph (LLM is created at import time)
        if (options.model) process.env.LLM_MODEL = options.model
        if (options.provider) process.env.LLM_PROVIDER = options.provider

        // Dynamic import so env vars take effect
        const { app } = await import('./graph.js')

        // ── Resolve repo input (URL or local path) ──
        let repoPath: string

        if (repoInput.startsWith('http://') || repoInput.startsWith('https://')) {
            const repoName = repoInput.split('/').pop()?.replace('.git', '') ?? 'repo'
            repoPath = path.join(process.cwd(), 'repos', repoName)
            console.log(`🔗 Remote repo: ${repoInput}`)
            console.log(`📁 Will clone to: ${repoPath}`)
        } else {
            repoPath = path.resolve(repoInput)
            if (!fs.existsSync(repoPath)) {
                console.error(`❌ Local path not found: ${repoPath}`)
                process.exit(1)
            }
            console.log(`📁 Local repo: ${repoPath}`)
        }

        // ── Resolve style input ──
        let styleName = ''
        let styleDir = ''
        let styleSamplePaths: string[] = []

        if (options.style) {
            const namedStyleDir = path.join(process.cwd(), 'writing-style', options.style)

            if (fs.existsSync(namedStyleDir) && fs.statSync(namedStyleDir).isDirectory()) {
                styleName = options.style
                styleDir = namedStyleDir
                console.log(`📝 Style: ${styleName} (${styleDir})`)
            } else if (fs.existsSync(options.style) && fs.statSync(options.style).isDirectory()) {
                styleDir = path.resolve(options.style)
                console.log(`📝 Style directory: ${styleDir}`)
            } else {
                styleSamplePaths = options.style
                    .split(',')
                    .map((p: string) => p.trim())
                    .filter(Boolean)
                console.log(`📝 Style files: ${styleSamplePaths.join(', ')}`)
            }
        }

        console.log(`🤖 Provider: ${process.env.LLM_PROVIDER ?? 'openai'} / ${process.env.LLM_MODEL ?? 'gpt-4o'}`)
        console.log('\n⏳ Running multi-agent pipeline...\n')

        try {
            const result = await app.invoke({
                messages: [
                    new HumanMessage(
                        `Please analyze this repository and create a blog article: ${repoInput}\n\n` +
                        (styleName
                            ? `Use the "${styleName}" writing style for the article.`
                            : styleDir
                                ? `Use the writing style from: ${styleDir}`
                                : styleSamplePaths.length > 0
                                    ? `Use these blog posts to match the writing style: ${styleSamplePaths.join(', ')}`
                                    : '')
                    ),
                ],
                repoInput,
                repoPath,
                styleName,
                styleDir,
                styleSamplePaths,
            }, { recursionLimit: 100 })

            const blog = result.blogDraft

            if (!blog) {
                console.error('❌ No blog article was generated.')
                process.exit(1)
            }

            // ── Auto-save to output/<repo-name>/<repo-name>-<YYYYMMDD>-<style>.md ──
            const repoName = path.basename(repoPath)
            const date = new Date().toISOString().split('T')[0]
            const styleLabel = styleName || 'default'
            const outputDir = path.join(process.cwd(), 'output', repoName)
            const outputFile = path.join(outputDir, `${repoName}-${date}-${styleLabel}.md`)

            fs.mkdirSync(outputDir, { recursive: true })
            fs.writeFileSync(outputFile, blog, 'utf-8')

            // Print preview to stdout
            const preview = blog.length > 500 ? blog.slice(0, 500) + '...' : blog
            console.log('\n' + '='.repeat(60))
            console.log(preview)

            console.log(`\n✅ Saved: ${outputFile}`)
            const wordCount = blog.split(/\s+/).length
            console.log(`📊 Stats: ~${wordCount} words | ${blog.split('\n').length} lines`)
        } catch (error) {
            console.error('❌ Pipeline failed:', error)
            process.exit(1)
        }
    })

program.parse()
