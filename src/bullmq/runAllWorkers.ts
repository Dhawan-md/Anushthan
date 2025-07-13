import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const workersDir = path.resolve(__dirname, "workers");

let files: string[] = [];

try {
  files = fs.readdirSync(workersDir).filter((f) => f.endsWith(".worker.ts"));
} catch (err) {
  console.error(`Failed to read workers directory:`, err);
  process.exit(1);
}

for (const file of files) {
  const workerPath = path.join(workersDir, file);
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
