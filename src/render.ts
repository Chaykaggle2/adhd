// Bộ render terminal. Khớp dạng output mà skill gốc quy định:
// tóm tắt → tập rộng (theo cụm) → hội tụ (shortlist + không-hiển-nhiên + bẫy)
// → bản phác thảo đã đào sâu → một câu khiêu khích.
//
// Những bức tường văn xuôi đồng trọng số sẽ che mất ý tưởng hay —
// nên dùng thụt lề, nhấn mạnh lựa chọn không-hiển-nhiên và chip điểm nhỏ.

import type { Idea, RunResult } from "./types.js";

const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;

function chip(i: Idea): string {
  if (!i.score) return "";
  const { novelty, viability, fit } = i.score;
  return dim(`[N${novelty} V${viability} F${fit}]`);
}

export function renderText(r: RunResult): string {
  const out: string[] = [];

  out.push(bold("Bài toán: ") + r.problem);
  out.push("");

  // Tập rộng theo cụm.
  out.push(bold("Tập rộng"));
  const byCluster = new Map<string, Idea[]>();
  for (const b of r.branches) {
    for (const idea of b.ideas) {
      const key = idea.cluster ?? "(chưa gom cụm)";
      if (!byCluster.has(key)) byCluster.set(key, []);
      byCluster.get(key)!.push(idea);
    }
  }
  for (const [label, ideas] of byCluster) {
    out.push("  " + cyan(label));
    for (const i of ideas) {
      out.push(`    - ${i.text} ${chip(i)}`);
    }
  }
  out.push("");

  // Hội tụ.
  out.push(bold("Hội tụ — danh sách rút gọn"));
  for (const i of r.shortlist) {
    const mark = r.nonObviousPick?.id === i.id ? green("★ lựa chọn không-hiển-nhiên → ") : "  ";
    out.push(`  ${mark}${i.text} ${chip(i)}`);
    if (i.rationale) out.push(`    ${dim(i.rationale)}`);
  }
  out.push("");

  if (r.traps.length > 0) {
    out.push(bold("Bẫy (trông ổn nhưng không ổn)"));
    for (const t of r.traps) {
      out.push(`  ${red("⚠")} ${t.text}`);
      out.push(`    ${dim(t.score?.trap ?? "")}`);
    }
    out.push("");
  }

  // Đào sâu — các lượt "focus" / connecting-the-dots.
  out.push(bold("Tập trung — các nhánh đã đào sâu"));
  for (const d of r.deepened) {
    const parent = r.branches.flatMap((b) => b.ideas).find((i) => i.id === d.ideaId);
    out.push("  " + cyan("→ " + (parent?.text ?? d.ideaId)));
    out.push("    " + d.sketch.split("\n").join("\n    "));
    if (d.childIdeas.length > 0) {
      out.push("    " + dim("nhánh tách ra:"));
      for (const c of d.childIdeas) {
        out.push(`      · ${c.text}${c.rationale ? dim(" — " + c.rationale) : ""}`);
      }
    }
    out.push("");
  }

  out.push(bold("Khiêu khích"));
  out.push("  " + yellow(r.provocation));

  return out.join("\n");
}
