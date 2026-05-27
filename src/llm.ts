// Wrapper mỏng quanh hàm `query` của Claude Agent SDK.
// Dùng theo kiểu one-shot phi trạng thái: mỗi lần gọi có một session mới
// với system prompt ngắn gọn và khung bài toán của người dùng.
//
// Mỗi nhánh phân kỳ là một lần gọi query() riêng để chạy song song thực sự —
// đây là cơ chế fan-out "ADHD". Các nhánh không thấy output của nhau khi
// phân kỳ (trộn lẫn sẽ làm giảm chất lượng ý tưởng).

import { query } from "@anthropic-ai/claude-agent-sdk";

export type LLMOptions = {
  model?: string;
  systemPrompt: string;
  userPrompt: string;
};

export async function callLLM(opts: LLMOptions): Promise<string> {
  const chunks: string[] = [];

  const iter = query({
    prompt: opts.userPrompt,
    options: {
      model: opts.model,
      systemPrompt: { type: "preset", preset: "claude_code", append: opts.systemPrompt },
      // Không dùng tool — phân kỳ là tạo sinh thuần. Tool = áp lực hội tụ.
      allowedTools: [],
      permissionMode: "bypassPermissions",
    },
  });

  for await (const message of iter) {
    if (message.type === "assistant") {
      for (const block of message.message.content) {
        if (block.type === "text") chunks.push(block.text);
      }
    }
    if (message.type === "result" && message.subtype !== "success") {
      throw new Error(`Gọi LLM thất bại: ${message.subtype}`);
    }
  }

  return chunks.join("").trim();
}

// Bóc lớp ```json và parse. LLM rất thích bọc rào.
export function parseJSON<T>(raw: string): T {
  let s = raw.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) s = fence[1].trim();
  // Tìm ký tự { hoặc [ đầu tiên — đôi khi vẫn có phần mở đầu dù đã dặn.
  const firstObj = s.indexOf("{");
  const firstArr = s.indexOf("[");
  const start =
    firstObj === -1
      ? firstArr
      : firstArr === -1
      ? firstObj
      : Math.min(firstObj, firstArr);
  if (start > 0) s = s.slice(start);
  return JSON.parse(s) as T;
}
