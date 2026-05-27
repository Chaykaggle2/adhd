#!/usr/bin/env node
// Trình chạy eval. So sánh ADHD với baseline một phát trên bộ bài toán,
// chấm cả hai bằng LLM làm giám khảo, ghi EVALS.md với kết luận + tổng hợp.
//
// Cách dùng:
//   npx tsx bench/run-evals.ts                  # chạy đầy đủ
//   npx tsx bench/run-evals.ts --problem lru-100ms
//   npx tsx bench/run-evals.ts --quick          # chỉ 2 bài đầu
//
// Thứ tự A/B trong prompt được ngẫu nhiên theo từng bài để cân bằng thiên lệch
// vị trí; mapping được lưu lại để tính tổng hợp chính xác.

import { readFileSync, writeFileSync } from "node:fs";
import { run } from "../src/index.js";
import { renderText } from "../src/render.js";
import { callLLM } from "../src/llm.js";
import { judge, type Verdict } from "./judge.js";

type Problem = { id: string; category: string; problem: string };

const BASELINE_SYSTEM =
  "Bạn là kỹ sư cấp cao giàu kinh nghiệm. Khi được yêu cầu lên ý tưởng cho một bài toán, " +
  "hãy đưa ra câu trả lời hữu ích với nhiều hướng tiếp cận, đánh đổi và khuyến nghị. " +
  "Nội dung phải chắc tay nhưng không lan man.";

async function baseline(problem: string): Promise<string> {
  return callLLM({
    systemPrompt: BASELINE_SYSTEM,
    userPrompt: `Hãy lên ý tưởng cho bài toán kỹ thuật này:\n\n${problem}\n\nHãy đưa cho người dùng một câu trả lời hữu ích.`,
  });
}

async function adhd(problem: string): Promise<string> {
  const result = await run({
    problem,
    framesPerRun: 5,
    ideasPerFrame: 6,
    topK: 3,
    concurrency: 4,
    codeMode: true,
    onEvent: () => {},
  });
  // Bỏ ANSI cho giám khảo — mã màu là nhiễu với model.
  return renderText(result).replace(/\x1b\[[0-9;]*m/g, "");
}

type RowResult = {
  problemId: string;
  category: string;
  problem: string;
  swapped: boolean;            // nếu true, A=baseline, B=adhd; ngược lại A=adhd, B=baseline
  baselineOutput: string;
  adhdOutput: string;
  verdict: Verdict;
};

function getArg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

async function main() {
  const allProblems: Problem[] = JSON.parse(
    readFileSync(new URL("./problems.json", import.meta.url), "utf8"),
  );

  const onlyId = getArg("--problem");
  const quick = hasFlag("--quick");
  let problems = onlyId ? allProblems.filter((p) => p.id === onlyId) : allProblems;
  if (quick) problems = problems.slice(0, 2);

  console.error(`▸ đang chạy ${problems.length} lượt eval`);

  const rows: RowResult[] = [];
  for (const p of problems) {
    console.error(`\n— ${p.id} (${p.category})`);

    console.error("  · đang tạo baseline…");
    const baselineOutput = await baseline(p.problem);

    console.error("  · đang tạo ADHD…");
    const adhdOutput = await adhd(p.problem);

    // Xáo trộn thứ tự A/B để cân bằng thiên lệch vị trí của giám khảo.
    const swapped = Math.random() < 0.5;
    const outA = swapped ? baselineOutput : adhdOutput;
    const outB = swapped ? adhdOutput : baselineOutput;

    console.error("  · đang chấm…");
    const verdict = await judge(p.problem, outA, outB);

    rows.push({
      problemId: p.id,
      category: p.category,
      problem: p.problem,
      swapped,
      baselineOutput,
      adhdOutput,
      verdict,
    });

    const adhdLabel = swapped ? "B" : "A";
    const baseLabel = swapped ? "A" : "B";
    const adhdWon =
      verdict.overall_winner === adhdLabel ? "ADHD thắng" :
      verdict.overall_winner === baseLabel ? "baseline thắng" : "hòa";
    console.error(`  → ${adhdWon} :: ${verdict.one_line_summary}`);
  }

  writeReport(rows);
  writeJson(rows);
  console.error(`\n✓ đã ghi EVALS.md + bench/results.json`);
}

function adhdScore(r: RowResult, dim: keyof Verdict): number {
  const v = r.verdict[dim] as { a: number; b: number };
  return r.swapped ? v.b : v.a;
}
function baselineScore(r: RowResult, dim: keyof Verdict): number {
  const v = r.verdict[dim] as { a: number; b: number };
  return r.swapped ? v.a : v.b;
}
function adhdWon(r: RowResult): "win" | "loss" | "tie" {
  const adhdLabel = r.swapped ? "B" : "A";
  const baseLabel = r.swapped ? "A" : "B";
  if (r.verdict.overall_winner === adhdLabel) return "win";
  if (r.verdict.overall_winner === baseLabel) return "loss";
  return "tie";
}

function writeReport(rows: RowResult[]) {
  const dims = ["breadth", "novelty", "trap_detection", "actionability", "builder_usefulness"] as const;

  const meanADHD = Object.fromEntries(
    dims.map((d) => [d, rows.reduce((s, r) => s + adhdScore(r, d), 0) / rows.length]),
  ) as Record<(typeof dims)[number], number>;
  const meanBase = Object.fromEntries(
    dims.map((d) => [d, rows.reduce((s, r) => s + baselineScore(r, d), 0) / rows.length]),
  ) as Record<(typeof dims)[number], number>;

  const wins = rows.filter((r) => adhdWon(r) === "win").length;
  const losses = rows.filter((r) => adhdWon(r) === "loss").length;
  const ties = rows.filter((r) => adhdWon(r) === "tie").length;

  const fmt = (n: number) => n.toFixed(2);
  const delta = (a: number, b: number) => {
    const d = a - b;
    return (d >= 0 ? "+" : "") + fmt(d);
  };

  const lines: string[] = [];
  lines.push(`# ADHD so với baseline — eval`);
  lines.push("");
  lines.push(`Lần chạy: ${new Date().toISOString()} · số bài: ${rows.length}`);
  lines.push("");
  lines.push(`**Tóm tắt:** ADHD ${wins}W / ${losses}L / ${ties}T so với baseline một phát.`);
  lines.push("");
  lines.push(`## Điểm tổng hợp (trung bình theo bài, 0–10)`);
  lines.push("");
  lines.push(`| Chiều đánh giá | ADHD | Baseline | Δ |`);
  lines.push(`| --- | ---: | ---: | ---: |`);
  for (const d of dims) {
    lines.push(`| ${d} | ${fmt(meanADHD[d])} | ${fmt(meanBase[d])} | ${delta(meanADHD[d], meanBase[d])} |`);
  }
  lines.push("");
  lines.push(`## Kết luận theo từng bài`);
  lines.push("");
  for (const r of rows) {
    const winner = adhdWon(r) === "win" ? "✓ ADHD" : adhdWon(r) === "loss" ? "✗ baseline" : "= hòa";
    lines.push(`### ${r.problemId} — ${winner}`);
    lines.push(`_${r.category} · thứ tự A/B đã đảo: ${r.swapped}_`);
    lines.push("");
    lines.push(`> ${r.problem}`);
    lines.push("");
    lines.push(`**Kết luận:** ${r.verdict.one_line_summary}`);
    lines.push("");
    lines.push(`| chiều | ADHD | base | lý do |`);
    lines.push(`| --- | ---: | ---: | --- |`);
    for (const d of dims) {
      const reason = (r.verdict[d] as { reason: string }).reason.replace(/\|/g, "\\|");
      lines.push(`| ${d} | ${adhdScore(r, d)} | ${baselineScore(r, d)} | ${reason} |`);
    }
    lines.push("");
  }
  lines.push("---");
  lines.push("");
  lines.push(`_Phương pháp: mỗi bài chạy qua ADHD (5 khung × 6 ý tưởng, đào sâu top-3) và baseline một phát dùng cùng model. Thứ tự A/B được ngẫu nhiên theo từng bài để cân bằng thiên lệch vị trí. Chấm bằng một lượt gọi LLM riêng với system prompt staff engineer hoài nghi._`);
  lines.push("");
  lines.push(`_Toàn bộ transcript: xem \`bench/results.json\`._`);

  writeFileSync("EVALS.md", lines.join("\n"));
}

function writeJson(rows: RowResult[]) {
  writeFileSync("bench/results.json", JSON.stringify(rows, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
