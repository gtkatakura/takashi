// Code-navigation suite for tools such as graphify: questions about a pinned headroom checkout,
// answers checked by hand with grep (see docs/token-cost/TEST-PLAN.md, step 8).
import type { Task } from "./fixtures";

export const repo = { url: "https://github.com/headroomlabs-ai/headroom", commit: "0368a87" };

const end = "End your reply with a line `ANSWER: <answer>`.";
export const tasks: Task[] = [
  {
    id: "callers",
    prompt: `Which function in the CLI layer calls \`run_server\` from headroom/proxy/server.py? Give its file path and function name. ${end}`,
    expect: ["headroom/cli/proxy.py", "proxy"],
  },
  {
    id: "subclasses",
    prompt: `List every class under headroom/ (not tests) that directly subclasses \`Transform\` from headroom/transforms/base.py. ANSWER as comma-separated class names. ${end}`,
    expect: ["ToolResultInterceptorTransform", "CacheAligner", "SmartCrusher", "KompressCompressor", "CodeAwareCompressor", "ContentRouter"],
  },
  {
    id: "importers",
    prompt: `Which modules under headroom/ (not tests, and not the module itself) import from headroom/transforms/kompress_compressor.py? ANSWER as comma-separated file paths. ${end}`,
    expect: ["headroom/compression/universal.py", "headroom/evals/html_extraction.py", "headroom/proxy/server.py",
      "headroom/transforms/code_compressor.py", "headroom/transforms/content_router.py", "headroom/transforms/kompress_remote.py"],
    reject: ["headroom/offline.py"], // mentions the module name but does not import it
  },
  {
    id: "method-calls",
    prompt: `Which methods of the \`CacheAligner\` class call \`detect_volatile_content\`? ANSWER as comma-separated method names. ${end}`,
    expect: ["apply", "get_alignment_score"],
  },
  {
    id: "config-users",
    prompt: `Which classes take a \`KompressConfig\` as a constructor parameter? ANSWER as comma-separated class names. ${end}`,
    expect: ["KompressCompressor", "RemoteKompressCompressor"],
  },
  // Prose-heavy tasks, where output compressors such as Caveman have room to act. Graded loosely.
  {
    id: "explain",
    prompt: `Explain to a new contributor how the CacheAligner in headroom/transforms/cache_aligner.py works: what it detects, how, and why it exists. ${end}`,
    expect: ["volatile"], grade: "text",
  },
  {
    id: "review",
    prompt: `Review headroom/transforms/cache_aligner.py for bugs, edge cases and risks. Summarize your findings for the maintainers. ${end}`,
    expect: ["ANSWER:"], grade: "text",
  },
];
