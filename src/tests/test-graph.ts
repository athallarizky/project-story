import "dotenv/config";
import { app } from "../graph.js";
import { HumanMessage } from "@langchain/core/messages";
import path from "path";

async function test() {
  const repoUrl = "https://github.com/lodash/lodash.git"
  const repoPath = path.join(process.cwd(), "repos", "is-odd");

  console.log("Starting multi-agent pipeline...\n");

  const result = await app.invoke({
    messages: [
      new HumanMessage(
        `Please analyze this repository and create a blog article about it: ${repoUrl}`
      ),
    ],
    repoInput: repoUrl,
    repoPath,
    styleName: "",
    styleDir: "",
    styleSamplePaths: [],
  }, { recursionLimit: 100 });

  console.log("\n=== RESEARCH REPORT ===");
  console.log(result.researchReport?.slice(0, 500) + "...");

  console.log("\n=== BLOG DRAFT ===");
  console.log(result.blogDraft);
}

test().catch(console.error);