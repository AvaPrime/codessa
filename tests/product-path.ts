import { listCommits, loadSnapshot, resetCore, runClaimsPath, tempFile } from "../runtime/product-path";

async function main(): Promise<void> {
  resetCore();
  const file = await tempFile();
  const claimed = await runClaimsPath(file, "The claim is covered.");
  const loadedClaim = await loadSnapshot(file);
  const committed = await runClaimsPath(file, "The claim is covered.", { decisionId: "DEC-PATH", content: "Roof damage confirmed." });
  resetCore();
  const loaded = await loadSnapshot(file);
  const report = {
    summary_does_not_commit: claimed.committed === false && loadedClaim.commits.length === 0,
    supplied_path_commits: committed.committed === true && loaded.commits.includes("DEC-PATH"),
    loaded_file_does_not_commit_core: listCommits().length === 0,
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (Object.values(report).some((ok) => !ok)) process.exitCode = 1;
}

main();
