// Engine tree-of-thought có cắt tỉa.
//
// Vòng lặp "connecting the dots" kiểu Steve Jobs:
//   1. Phân kỳ rộng — tỏa N nhánh song song, mỗi nhánh chạy dưới một
//      khung nhận thức khác nhau. Không phê bình, không nói chuyện chéo.
//   2. Chấm điểm từng lá theo độ mới / tính khả thi / độ phù hợp.
//   3. Gom cụm — làm lộ HÌNH DẠNG của không gian ý tưởng, không chỉ từng lá.
//   4. Cắt còn top-K và ĐÀO SÂU chúng bằng mở rộng đệ quy.
//      Đây là lúc agent "tập trung" — nối một chấm với nhiều chấm khác.
//   5. Chọn phương án không-hiển-nhiên-nhưng-khả-thi. Gắn cờ bẫy. Khiêu khích một lần.
//
// Hội tụ xảy ra sau phân kỳ, không bao giờ trong lúc phân kỳ.

import pLimit from "p-limit";
import { randomUUID } from "node:crypto";
import { callLLM, parseJSON } from "./llm.js";
import { selectFrames, type Frame } from "./frames.js";
import type {
  Branch,
  Cluster,
  DeepenedIdea,
  Idea,
  RunOptions,
  RunResult,
  Score,
} from "./types.js";

const DIVERGE_SYSTEM = `Bạn đang ở chế độ PHÂN KỲ. Bạn là bộ tạo ý tưởng, không phải nhà phê bình.
Luật:
- Chỉ xuất mảng JSON. Không thêm văn xuôi trước/sau.
- Tạo đúng số lượng ý tưởng khác biệt được yêu cầu.
- Mỗi ý tưởng là một cụm ngắn hoặc một câu đơn. Không viết đoạn văn.
- Vượt qua điều hiển nhiên. 3 ý tưởng đầu tiên bạn nghĩ tới bị cấm —
  giả định người đọc đã có chúng. Nhắm tới vùng "khó chịu" ở giữa.
- Ý tưởng tệ, lạ, hay phi lý đều được chào đón; chúng gieo mầm cho ý tưởng tốt hơn.
- Không đánh giá, không rào trước, không xếp hạng. Chỉ tạo ra ý tưởng.`;

const SCORE_SYSTEM = `Bạn đang ở chế độ HỘI TỤ. Bây giờ bạn là nhà phê bình.
Chấm mỗi ý tưởng trên ba trục 0-10:
- novelty: mức độ xa lời giải mặc định hiển nhiên
- viability: có thể thật sự triển khai / hoạt động trong thực tế không
- fit: mức độ trực tiếp giải quyết bài toán đã nêu
Nếu ý tưởng trông hấp dẫn nhưng là BẪY (chi phí ẩn, tiết kiệm giả,
không thể mở rộng, trừu tượng hóa quá sớm), đặt "trap" là lý do một dòng.
Nếu không thì bỏ "trap".
Chỉ xuất JSON.`;

const CLUSTER_SYSTEM = `Bạn nhóm ý tưởng thành 3-6 cụm theo GÓC NHÌN NỀN TẢNG
(không phải theo từ khóa bề mặt). Nhãn cụm phải đặt theo góc nhìn, ví dụ:
"nhóm bỏ máy chủ", "nhóm đẩy việc sang client", "nhóm theo hình cache".
Chỉ xuất JSON.`;

const DEEPEN_SYSTEM = `Bạn đang ở chế độ TẬP TRUNG. Lấy một ý tưởng hứa hẹn và nối các điểm:
- Phác thảo cách nó vận hành thật sự (4-8 câu).
- Nêu rủi ro chịu tải cốt lõi.
- Nêu bước cụ thể đầu tiên mà lập trình viên sẽ làm.
- Sau đó tạo 3-5 ý tưởng con tách từ nhánh này (biến thể,
  kết hợp với miền khác, những gì nó mở khóa).
Chỉ xuất JSON.`;

async function divergeBranch(
  problem: string,
  context: string | undefined,
  frame: Frame,
  ideasPerFrame: number,
  model: string | undefined,
): Promise<Branch> {
  const userPrompt = `BÀI TOÁN:
${problem}

${context ? `NGỮ CẢNH:\n${context}\n\n` : ""}KHUNG — ${frame.label}:
${frame.prompt}

Tạo ${ideasPerFrame} ý tưởng trong khung này.
Xuất mảng JSON: [{"text": "...", "rationale": "..."}]
- text: một cụm/câu, chính là ý tưởng
- rationale: 1 mệnh đề ngắn vì sao khung này làm lộ ý tưởng đó (tùy chọn)`;

  const raw = await callLLM({
    model,
    systemPrompt: DIVERGE_SYSTEM,
    userPrompt,
  });

  type Row = { text: string; rationale?: string };
  let rows: Row[];
  try {
    rows = parseJSON<Row[]>(raw);
  } catch {
    return { frameId: frame.id, ideas: [] };
  }

  const ideas: Idea[] = rows.map((r) => ({
    id: randomUUID(),
    frameId: frame.id,
    text: r.text,
    rationale: r.rationale,
    depth: 0,
  }));
  return { frameId: frame.id, ideas };
}

async function scoreIdeas(
  problem: string,
  ideas: Idea[],
  model: string | undefined,
): Promise<Map<string, Score>> {
  if (ideas.length === 0) return new Map();

  const userPrompt = `BÀI TOÁN:
${problem}

Ý TƯỞNG (id → text):
${ideas.map((i) => `${i.id} :: ${i.text}`).join("\n")}

Chấm từng ý tưởng. Xuất mảng JSON:
[{"id":"...","novelty":0-10,"viability":0-10,"fit":0-10,"trap":"... or omit"}]`;

  const raw = await callLLM({
    model,
    systemPrompt: SCORE_SYSTEM,
    userPrompt,
  });

  type Row = { id: string; novelty: number; viability: number; fit: number; trap?: string };
  let rows: Row[];
  try {
    rows = parseJSON<Row[]>(raw);
  } catch {
    return new Map();
  }

  const out = new Map<string, Score>();
  for (const r of rows) {
    // Trọng số: novelty quan trọng vì mục tiêu là thoát khỏi lối mòn,
    // nhưng viability là cổng kiểm soát — ý tưởng xuất sắc nhưng không triển khai được là bẫy.
    const total = r.novelty * 0.35 + r.viability * 0.4 + r.fit * 0.25;
    out.set(r.id, {
      novelty: r.novelty,
      viability: r.viability,
      fit: r.fit,
      total,
      trap: r.trap,
    });
  }
  return out;
}

async function clusterIdeas(
  problem: string,
  ideas: Idea[],
  model: string | undefined,
): Promise<Cluster[]> {
  if (ideas.length === 0) return [];

  const userPrompt = `BÀI TOÁN:
${problem}

Ý TƯỞNG:
${ideas.map((i) => `${i.id} :: ${i.text}`).join("\n")}

Xuất JSON: [{"label":"...","ideaIds":["...","..."]}]`;

  const raw = await callLLM({
    model,
    systemPrompt: CLUSTER_SYSTEM,
    userPrompt,
  });

  try {
    return parseJSON<Cluster[]>(raw);
  } catch {
    return [];
  }
}

async function deepenIdea(
  problem: string,
  idea: Idea,
  siblings: Idea[],
  model: string | undefined,
): Promise<DeepenedIdea> {
  const userPrompt = `BÀI TOÁN:
${problem}

Ý TƯỞNG TẬP TRUNG:
${idea.text}
${idea.rationale ? `(${idea.rationale})` : ""}

Ý TƯỞNG CÙNG CẤP (dùng để tái tổ hợp nếu hữu ích):
${siblings
  .filter((s) => s.id !== idea.id)
  .slice(0, 12)
  .map((s) => `- ${s.text}`)
  .join("\n")}

Xuất JSON:
{
  "sketch": "4-8 câu. Cách hoạt động. Rủi ro chịu tải. Bước cụ thể đầu tiên.",
  "childIdeas": [
    {"text": "...", "rationale": "biến thể / lai ghép / mở khóa"}
  ]
}`;

  const raw = await callLLM({
    model,
    systemPrompt: DEEPEN_SYSTEM,
    userPrompt,
  });

  type Out = { sketch: string; childIdeas: { text: string; rationale?: string }[] };
  let parsed: Out;
  try {
    parsed = parseJSON<Out>(raw);
  } catch {
    return { ideaId: idea.id, sketch: "(không phân tích được kết quả lượt đào sâu)", childIdeas: [] };
  }

  const childIdeas: Idea[] = parsed.childIdeas.map((c) => ({
    id: randomUUID(),
    frameId: idea.frameId,
    text: c.text,
    rationale: c.rationale,
    depth: idea.depth + 1,
    parentId: idea.id,
  }));

  return { ideaId: idea.id, sketch: parsed.sketch, childIdeas };
}

export async function run(opts: RunOptions): Promise<RunResult> {
  const {
    problem,
    context,
    framesPerRun = 5,
    ideasPerFrame = 6,
    topK = 3,
    concurrency = 4,
    codeMode = true,
    model,
    onEvent,
  } = opts;

  const frames = selectFrames(framesPerRun, codeMode);
  const limit = pLimit(concurrency);

  // PHA 1 — PHÂN KỲ. Tỏa nhánh song song thuần túy. Không nhánh nào thấy nhánh khác.
  const branches = await Promise.all(
    frames.map((f) =>
      limit(async () => {
        onEvent?.({ kind: "frame:start", frameId: f.id, frameLabel: f.label });
        const b = await divergeBranch(problem, context, f, ideasPerFrame, model);
        onEvent?.({ kind: "frame:done", frameId: f.id, count: b.ideas.length });
        return b;
      }),
    ),
  );

  const allIdeas: Idea[] = branches.flatMap((b) => b.ideas);

  // PHA 2 — CHẤM ĐIỂM + GOM CỤM. Nhà phê bình quay lại.
  const [scoreMap, clusters] = await Promise.all([
    scoreIdeas(problem, allIdeas, model),
    clusterIdeas(problem, allIdeas, model),
  ]);
  for (const i of allIdeas) i.score = scoreMap.get(i.id);
  // Gán nhãn cụm cho từng ý tưởng để hiển thị đẹp hơn.
  for (const c of clusters) for (const id of c.ideaIds) {
    const idea = allIdeas.find((x) => x.id === id);
    if (idea) idea.cluster = c.label;
  }
  onEvent?.({ kind: "score:done", total: allIdeas.length });
  onEvent?.({ kind: "cluster:done", clusters: clusters.length });

  // Danh sách rút gọn: top theo tổng điểm, loại bẫy. Bẫy được báo riêng.
  const traps = allIdeas.filter((i) => i.score?.trap);
  const ranked = allIdeas
    .filter((i) => i.score && !i.score.trap)
    .sort((a, b) => (b.score!.total - a.score!.total));
  const shortlist = ranked.slice(0, Math.max(2, Math.min(4, topK + 1)));

  // Lựa chọn không-hiển-nhiên = novelty cao nhất trong shortlist khả thi.
  const nonObviousPick =
    shortlist.length === 0
      ? null
      : [...shortlist].sort(
          (a, b) =>
            (b.score!.novelty + b.score!.viability * 0.5) -
            (a.score!.novelty + a.score!.viability * 0.5),
        )[0];

  // PHA 3 — TẬP TRUNG / ĐÀO SÂU top-K. Đây là lượt "connecting the dots".
  const toDeepen = ranked.slice(0, topK);
  const deepened = await Promise.all(
    toDeepen.map((idea) =>
      limit(async () => {
        onEvent?.({ kind: "deepen:start", ideaId: idea.id, text: idea.text });
        const d = await deepenIdea(problem, idea, allIdeas, model);
        onEvent?.({ kind: "deepen:done", ideaId: idea.id });
        return d;
      }),
    ),
  );

  // Một câu khiêu khích = lá có novelty cao nhất (từ khung wild), diễn đạt lại thành câu hỏi.
  // Rẻ, không cần gọi LLM thêm.
  const wildcard = allIdeas
    .filter((i) => i.score)
    .sort((a, b) => b.score!.novelty - a.score!.novelty)[0];
  const provocation = wildcard
    ? `Nếu ta nghiêm túc làm điều này thì sao: ${wildcard.text}`
    : "Giả định nào mà chưa ai gọi tên?";

  return {
    problem,
    branches,
    clusters,
    shortlist,
    nonObviousPick,
    traps,
    deepened,
    provocation,
  };
}
