import "dotenv/config";
import { cloneRepo, getRepoStructure, getGitLog } from "../tools/git.js";
import { readFile, readPackageJson } from "../tools/filesystem.js";

async function test() {
  const testUrl = "https://github.com/lodash/lodash.git"

  console.log("Cloning...");
  const cloneResult = await cloneRepo.invoke({ url: testUrl });
  console.log(cloneResult);

  const repoPath = cloneResult.replace("Repository cloned to: ", "").trim();

  console.log("\nStructure:");
  const structure = await getRepoStructure.invoke({ repoPath });
  console.log(structure);

  console.log("\nGit log:");
  const log = await getGitLog.invoke({ repoPath, maxCommits: 5 });
  console.log(log);

  console.log("\nPackage.json:");
  const pkg = await readPackageJson.invoke({ repoPath });
  console.log(pkg);
}

test();
