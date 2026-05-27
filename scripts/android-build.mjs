import { spawn } from "node:child_process";
import { platform } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const androidDir = resolve(rootDir, "android");
const wrapper = platform() === "win32" ? "gradlew.bat" : "./gradlew";

const child = spawn(wrapper, ["assembleDebug"], {
  cwd: androidDir,
  stdio: "inherit",
  shell: platform() === "win32",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
