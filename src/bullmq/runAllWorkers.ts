import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const workersDir = path.resolve(__dirname, "workers");
const files = fs
  .readdirSync(workersDir)
  .filter((f) => f.endsWith(".worker.ts"));

for (const file of files) {
  const workerPath = path.join("src/bullmq/workers", file);
  const child = spawn(
    "npx",
    ["ts-node", "-r", "tsconfig-paths/register", workerPath],
    {
      stdio: "inherit",
      shell: true,
    }
  );

  child.on("exit", (code) => {
    console.log(`${file} exited with code ${code}`);
  });
}
