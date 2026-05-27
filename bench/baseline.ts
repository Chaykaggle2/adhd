// Baseline: agent thông thường — một truy vấn, không fan-out theo khung,
// không chấm điểm, không đào sâu. Cách thẳng tay "hỏi Claude cho ý tưởng"
// cho bài toán này mà connect-dots được kỳ vọng vượt qua.

import { callLLM } from "../src/llm.js";

const problem = process.argv.slice(2).join(" ");
if (!problem) { console.error("cách dùng: baseline.ts <problem>"); process.exit(1); }

const out = await callLLM({
  systemPrompt:
    "Bạn là kỹ sư cấp cao giàu kinh nghiệm. Khi được yêu cầu lên ý tưởng cho một bài toán, " +
    "hãy đưa ra câu trả lời hữu ích với nhiều hướng tiếp cận, đánh đổi và khuyến nghị. " +
    "Nội dung phải chắc tay nhưng không lan man.",
  userPrompt: `Hãy lên ý tưởng cho bài toán kỹ thuật này:\n\n${problem}\n\n` +
              `Hãy đưa cho người dùng một câu trả lời hữu ích.`,
});

console.log(out);
