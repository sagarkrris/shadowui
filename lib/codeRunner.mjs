export const PISTON_EXECUTE_URL = "https://emkc.org/api/v2/piston/execute";

export const CODE_RUN_LIMITS = {
  maxCodeChars: 12000,
  maxStdinChars: 4000,
  requestTimeoutMs: 12000,
  compileTimeoutMs: 10000,
  runTimeoutMs: 8000,
  runMemoryBytes: 128000000,
};

export const SUPPORTED_CODE_LANGUAGES = [
  {
    id: "python",
    label: "Python",
    pistonLanguage: "python",
    pistonVersion: "3.10.0",
    fileName: "main.py",
    starter: "print(\"Hello, InterviewIQ!\")\n",
  },
  {
    id: "javascript",
    label: "JavaScript",
    pistonLanguage: "javascript",
    pistonVersion: "18.15.0",
    fileName: "main.js",
    starter: "console.log(\"Hello, InterviewIQ!\");\n",
  },
  {
    id: "typescript",
    label: "TypeScript",
    pistonLanguage: "typescript",
    pistonVersion: "5.0.3",
    fileName: "main.ts",
    starter: "const message: string = \"Hello, InterviewIQ!\";\nconsole.log(message);\n",
  },
  {
    id: "java",
    label: "Java",
    pistonLanguage: "java",
    pistonVersion: "15.0.2",
    fileName: "Main.java",
    starter: "class Main {\n  public static void main(String[] args) {\n    System.out.println(\"Hello, InterviewIQ!\");\n  }\n}\n",
  },
  {
    id: "cpp",
    label: "C++",
    pistonLanguage: "c++",
    pistonVersion: "10.2.0",
    fileName: "main.cpp",
    starter: "#include <iostream>\n\nint main() {\n  std::cout << \"Hello, InterviewIQ!\" << std::endl;\n  return 0;\n}\n",
  },
  {
    id: "go",
    label: "Go",
    pistonLanguage: "go",
    pistonVersion: "1.16.2",
    fileName: "main.go",
    starter: "package main\n\nimport \"fmt\"\n\nfunc main() {\n  fmt.Println(\"Hello, InterviewIQ!\")\n}\n",
  },
  {
    id: "rust",
    label: "Rust",
    pistonLanguage: "rust",
    pistonVersion: "1.50.0",
    fileName: "main.rs",
    starter: "fn main() {\n  println!(\"Hello, InterviewIQ!\");\n}\n",
  },
];

export function getCodeLanguage(language) {
  const id = String(language || "").trim().toLowerCase();
  return SUPPORTED_CODE_LANGUAGES.find((item) => item.id === id) || null;
}

function stringField(value) {
  return typeof value === "string" ? value : "";
}

export function normalizeRunCodeRequest(body = {}) {
  const language = stringField(body.language).trim().toLowerCase();
  const code = stringField(body.code);
  const stdin = stringField(body.stdin);
  const languageConfig = getCodeLanguage(language);

  if (!languageConfig) {
    return {
      ok: false,
      status: 400,
      error: `Unsupported language. Supported: ${SUPPORTED_CODE_LANGUAGES.map((item) => item.id).join(", ")}`,
    };
  }

  if (!code.trim()) {
    return { ok: false, status: 400, error: "Code is required." };
  }

  if (code.length > CODE_RUN_LIMITS.maxCodeChars) {
    return {
      ok: false,
      status: 413,
      error: `Code is too large. Keep it under ${CODE_RUN_LIMITS.maxCodeChars} characters.`,
    };
  }

  if (stdin.length > CODE_RUN_LIMITS.maxStdinChars) {
    return {
      ok: false,
      status: 413,
      error: `Input is too large. Keep stdin under ${CODE_RUN_LIMITS.maxStdinChars} characters.`,
    };
  }

  return {
    ok: true,
    value: {
      language,
      code,
      stdin,
      languageConfig,
    },
  };
}

export function buildPistonPayload({ language, code, stdin = "" }) {
  const languageConfig = getCodeLanguage(language);
  if (!languageConfig) throw new Error(`Unsupported language: ${language}`);

  return {
    language: languageConfig.pistonLanguage,
    version: languageConfig.pistonVersion,
    files: [{ name: languageConfig.fileName, content: code }],
    stdin,
    compile_timeout: CODE_RUN_LIMITS.compileTimeoutMs,
    run_timeout: CODE_RUN_LIMITS.runTimeoutMs,
    compile_memory_limit: -1,
    run_memory_limit: CODE_RUN_LIMITS.runMemoryBytes,
  };
}

export function extractPistonResult(data = {}) {
  const compile = data.compile || {};
  const run = data.run || {};
  const stdout = [compile.stdout, run.stdout].filter(Boolean).join("");
  const stderr = [compile.stderr, run.stderr].filter(Boolean).join("");
  const exitCode = Number.isInteger(compile.code) && compile.code !== 0
    ? compile.code
    : (Number.isInteger(run.code) ? run.code : 0);

  return { stdout, stderr, exitCode };
}
