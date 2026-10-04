import { CodesssaKernel } from "../core/codessa-kernel";
import { handleRequest } from "../runtime/caller";

async function main(): Promise<void> {
  const kernel = new CodesssaKernel();
  const request = {
    request_id: "kernel-1",
    text: "review claim",
    context_ids: ["policy"],
    allowed_actions: ["read_file"],
    action: "read_file",
    reply: "The claim is covered.",
  };
  const direct = await handleRequest(request);
  const governed = await kernel.runGoverned(request);
  const report = {
    kernel_bridge_does_not_commit: governed.committed === false && direct.committed === false,
    kernel_bridge_matches_caller: governed.refused === direct.refused && governed.promoted === false,
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (Object.values(report).some((ok) => !ok)) process.exitCode = 1;
}

main();
