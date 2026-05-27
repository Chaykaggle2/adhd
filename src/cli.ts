#!/usr/bin/env node
// Bề mặt CLI cho connect-dots.
//
// Cách dùng:
//   connect-dots "how should we shard this queue?"
//   connect-dots "..." --frames 6 --ideas 8 --top 4 --context ./CONTEXT.md
//   connect-dots "..." --json > result.json

import { readFileSync } from "node:fs";
import { run } from "./engine.js";
import { renderText } from "./render.js";
import type { RunEvent, RunOptions } from "./types.js";

type Flags = {
  problem: string;
  context?: string;
  frames?: number;
  ideas?: number;
  top?: number;
  concurrency?: number;
  codeMode: boolean;
  json: boolean;
  quiet: boolean;
  model?: string;
};

function parse(argv: string[]): Flags {
  const f: Flags = { problem: "", codeMode: true, json: false, quiet: false };
  const rest: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "--frames": f.frames = Number(argv[++i]); break;
      case "--ideas": f.ideas = Number(argv[++i]); break;
      case "--top": f.top = Number(argv[++i]); break;
      case "--concurrency": f.concurrency = Number(argv[++i]); break;
      case "--context": f.context = readFileSync(argv[++i], "utf8"); break;
      case "--model": f.model = argv[++i]; break;
      case "--no-code-mode": f.codeMode = false; break;
      case "--json": f.json = true; break;
      case "--quiet": f.quiet = true; break;
      case "-h":
      case "--help":
        printHelp();
        process.exit(0);
      default:
        rest.push(a);
    }
  }
  f.problem = rest.join(" ").trim();
  return f;
}

function printHelp() {
  console.log(`adhd — kỹ năng dành cho coding agent

  Ngăn agent chọn ngay câu trả lời đầu tiên. Tỏa ra nhiều luồng tư duy
  phân kỳ song song dưới các khung nhận thức khác nhau, chấm điểm chúng,
  cắt bỏ bẫy và đào sâu các phương án sống sót. Tree-of-thought có cắt tỉa,
  xây trên Claude Agent SDK.

CÁCH DÙNG
  adhd "<problem>" [flags]

CỜ
  --frames N        số nhánh phân kỳ song song (mặc định 5)
  --ideas N         số ý tưởng mỗi nhánh (mặc định 6)
  --top N           số ý tưởng cần đào sâu / tập trung (mặc định 3)
  --concurrency N   số lần gọi LLM song song tối đa (mặc định 4)
  --context PATH    tệp nạp làm ngữ cảnh (code, ràng buộc, stack)
  --model NAME      ghi đè model của SDK
  --no-code-mode    không thiên lệch khung theo hướng kỹ thuật
  --json            xuất RunResult dưới dạng JSON
  --quiet           ẩn sự kiện tiến trình
  -h, --help

VÍ DỤ
  adhd "thiết kế rate limiter vẫn đúng qua một lần bầu lại leader"
  adhd "đặt tên hàm này" --frames 3 --ideas 8 --top 2
  adhd "..." --context ./snippet.ts --json > out.json
`);
}

async function main() {
  const flags = parse(process.argv.slice(2));
  if (!flags.problem) { printHelp(); process.exit(1); }

  const onEvent = flags.quiet ? undefined : (e: RunEvent) => {
    switch (e.kind) {
      case "frame:start": process.stderr.write(`  ▸ ${e.frameLabel}…\n`); break;
      case "frame:done":  process.stderr.write(`    ${e.count} ideas (${e.frameId})\n`); break;
      case "score:done":  process.stderr.write(`  đã chấm điểm ${e.total} ý tưởng\n`); break;
      case "cluster:done":process.stderr.write(`  ${e.clusters} cụm\n`); break;
      case "deepen:start":process.stderr.write(`  ◎ tập trung → ${e.text}\n`); break;
      case "warn":        process.stderr.write(`  ! ${e.message}\n`); break;
    }
  };

  const opts: RunOptions = {
    problem: flags.problem,
    context: flags.context,
    framesPerRun: flags.frames,
    ideasPerFrame: flags.ideas,
    topK: flags.top,
    concurrency: flags.concurrency,
    codeMode: flags.codeMode,
    model: flags.model,
    onEvent,
  };

  const result = await run(opts);

  if (flags.json) {
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  } else {
    process.stdout.write(renderText(result) + "\n");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
