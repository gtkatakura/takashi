// Broad architecture questions for the graphify A/B, about the pinned headroom checkout (see code.ts).
// Each answer is graded on key facts (identifiers verified by reading the code).
import type { Task } from "./fixtures";
const end = "End your reply with a line `ANSWER: done`.";
export const tasks: Task[] = [
  {
    id: "flow-compress-pipeline",
    prompt: `Trace what happens when library code calls \`compress(messages, model=...)\` from headroom/compress.py with default settings: which function builds the pipeline, which pipeline class runs it, which transforms it contains and in what order, and which concrete compressor classes the content-routing transform dispatches JSON arrays and plain text to. Name the exact classes and functions. ${end}`,
    expect: ["_get_pipeline", "TransformPipeline", "CacheAligner", "ContentRouter", "SmartCrusher", "KompressCompressor"],
    grade: "text",
  },
  {
    id: "flow-proxy-anthropic-request",
    prompt: `Trace an Anthropic \`POST /v1/messages\` request through the Headroom proxy, starting from the \`headroom proxy\` CLI command: which function starts the server, which function builds the FastAPI app, which class holds the request handlers, which function registers the provider routes, which handler method processes the request, and which pipeline attribute on that class compresses the messages before forwarding upstream. Name the exact functions, classes and attributes. ${end}`,
    expect: ["run_server", "create_app", "HeadroomProxy", "register_provider_routes", "handle_anthropic_messages", "anthropic_pipeline"],
    grade: "text",
  },
  {
    id: "flow-ccr-roundtrip",
    prompt: `Explain the CCR (Compress-Cache-Retrieve) round trip in headroom: where the original content of a compressed tool output is stored (class and accessor function), which component makes the model aware it can ask for the original (class and the name of the retrieval tool), and which component on the response side detects that tool call and serves the original back (class and its entry method). Name the exact classes, functions and the tool name. ${end}`,
    expect: ["CompressionStore", "get_compression_store", "CCRToolInjector", "headroom_retrieve", "CCRResponseHandler", "handle_response"],
    grade: "text",
  },
  {
    id: "flow-python-rust-bridge",
    prompt: `How does the Python \`SmartCrusher\` transform in headroom/transforms/smart_crusher.py reach the Rust implementation under crates/? Name the compiled Python extension module, the build backend that produces it, the alias the Python code imports the Rust class under, the PyO3 wrapper struct in crates/headroom-py, and the Rust crate that holds the real SmartCrusher implementation. ${end}`,
    expect: ["_core", "maturin", "_RustSmartCrusher", "PySmartCrusher", "headroom_core"],
    grade: "text",
  },
  {
    id: "flow-wrap-claude",
    prompt: `Explain what \`headroom wrap claude\` does in headroom/cli/wrap.py between the user running it and Claude Code starting: which functions make sure a proxy is running (including the lock-free inner helper), which function spawns the proxy process, which function checks whether the proxy port is up, and which environment variable is set on the launched Claude Code process to route its API calls through the proxy. Name the exact functions and the variable. ${end}`,
    expect: ["_ensure_proxy", "_ensure_proxy_unlocked", "_start_proxy", "_check_proxy", "ANTHROPIC_BASE_URL"],
    grade: "text",
  },
];
