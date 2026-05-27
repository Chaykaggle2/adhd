// Dùng LLM làm giám khảo.
//
// Không có ground-truth cho bài toán lên ý tưởng, nên dùng một lượt phê bình
// riêng để chấm hai đầu ra (ADHD vs baseline) theo các chiều quan trọng với
// thiết kế *mở*: độ rộng, độ mới, phát hiện bẫy, tính khả thi hành động và
// độ hữu ích tổng thể với người xây hệ thống.
//
// Để giảm thiên lệch cùng-model: giám khảo chạy với system prompt yêu cầu đọc
// phản biện ("hãy là staff engineer hoài nghi"), và thấy CẢ HAI đầu ra ở dạng
// ẩn danh (gắn nhãn A/B ngẫu nhiên theo từng bài) để cân bằng thiên lệch vị trí.

import { callLLM, parseJSON } from "../src/llm.js";

export type Verdict = {
  breadth: { a: number; b: number; reason: string };       // 0-10, độ rộng góc nhìn khác biệt
  novelty: { a: number; b: number; reason: string };       // 0-10, không-hiển-nhiên nhưng khả thi
  trap_detection: { a: number; b: number; reason: string };// 0-10, gọi tên bẫy kèm lý do
  actionability: { a: number; b: number; reason: string }; // 0-10, có bước đầu cụ thể
  builder_usefulness: { a: number; b: number; reason: string }; // 0-10, người xây có ship được từ đây không?
  overall_winner: "A" | "B" | "tie";
  one_line_summary: string;
};

const JUDGE_SYSTEM = `Bạn là staff engineer hoài nghi, đang đánh giá hai đầu ra lên ý tưởng (A và B)
cho cùng một bài toán. Nhiệm vụ của bạn là chấm theo các chiều của công việc
thiết kế mở, không chấm độ bóng bẩy văn phong.

Bạn KHÔNG biết hệ thống nào tạo ra đầu ra nào. Chỉ chấm theo thực chất.

Rubric (mỗi chiều 0-10):
- breadth: độ rộng của các góc nhìn KHÁC BIỆT về cấu trúc. 10 biến thể nhỏ của một ý tưởng = breadth thấp.
- novelty: có bao nhiêu ý tưởng không-hiển-nhiên nhưng khả thi. Đáp án sách giáo khoa hiển nhiên KHÔNG mới.
- trap_detection: có gọi tên ý tưởng trông ổn nhưng là bẫy, kèm lý do không?
- actionability: khuyến nghị top có phác thảo, rủi ro chính và bước cụ thể đầu tiên không?
- builder_usefulness: nếu bạn là kỹ sư phải ship, cái nào hữu ích hơn?

Sau đó khai báo overall_winner: "A", "B" hoặc "tie".
Chỉ xuất JSON. Không có đoạn mở đầu bằng văn xuôi.`;

export async function judge(
  problem: string,
  outputA: string,
  outputB: string,
  model?: string,
): Promise<Verdict> {
  const userPrompt = `BÀI TOÁN:
${problem}

ĐẦU RA A:
${outputA}

---

ĐẦU RA B:
${outputB}

---

Chấm cả hai theo rubric. Xuất JSON dạng:
{
  "breadth": {"a": 0-10, "b": 0-10, "reason": "..."},
  "novelty": {"a": 0-10, "b": 0-10, "reason": "..."},
  "trap_detection": {"a": 0-10, "b": 0-10, "reason": "..."},
  "actionability": {"a": 0-10, "b": 0-10, "reason": "..."},
  "builder_usefulness": {"a": 0-10, "b": 0-10, "reason": "..."},
  "overall_winner": "A" | "B" | "tie",
  "one_line_summary": "..."
}`;

  const raw = await callLLM({ model, systemPrompt: JUDGE_SYSTEM, userPrompt });
  return parseJSON<Verdict>(raw);
}
