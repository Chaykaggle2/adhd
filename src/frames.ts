// Các khung đẩy bộ tạo ý tưởng vào những góc mà nó thường không tự đi tới.
// Mỗi khung là một chiến lược để hỏi lại cùng bài toán kỹ thuật
// từ một góc nhìn khác. Mỗi lần chạy chỉ chọn một phần — không cần ép chạy hết.

export type Frame = {
  id: string;
  label: string;
  // Đoạn system prompt được chèn vào nhánh phân kỳ.
  // Viết như chỉ thị: "bạn là X, hãy tạo ý tưởng như X."
  prompt: string;
  // Nhãn miền kỹ thuật — orchestrator dùng để thiên lệch chọn khung
  // khi bài toán có dáng dấp code.
  tags: ("code" | "design" | "general" | "wild")[];
};

export const FRAMES: Frame[] = [
  {
    id: "hardware-eyes",
    label: "Kỹ sư phần cứng",
    prompt:
      "Bạn tư duy theo độ trễ, bố cục bộ nhớ và ràng buộc vật lý. Hãy hỏi lại bài toán này như thể nó là bài toán phần cứng/firmware. Topology bus, cache và ngân sách thời gian nói gì với bạn?",
    tags: ["code", "wild"],
  },
  {
    id: "regulator",
    label: "Cơ quan quản lý / kiểm toán",
    prompt:
      "Bạn kiểm toán hệ thống theo chuẩn tuân thủ và các mode lỗi. Ý tưởng nào xuất hiện khi hỏi: ở đây điều gì phải chứng minh được, truy vết được, hoặc có thể từ chối được?",
    tags: ["design", "general"],
  },
  {
    id: "ten-year-old",
    label: "Đứa trẻ 10 tuổi",
    prompt:
      "Bạn là một đứa trẻ 10 tuổi tò mò chưa từng thấy phần mềm. Hãy mô tả các cách tiếp cận ngây thơ nhưng không bị ràng buộc. Bỏ qua thông lệ.",
    tags: ["general", "wild"],
  },
  {
    id: "adversary",
    label: "Đối thủ muốn phá nó",
    prompt:
      "Bạn là đối thủ thù địch hoặc kẻ tấn công. Tạo các cách khai thác, làm hỏng hoặc phá hoại lời giải hiển nhiên. Sau đó đảo ngược thành ý tưởng.",
    tags: ["code", "design"],
  },
  {
    id: "biology",
    label: "Liên ngành: sinh học",
    prompt:
      "Cấy một cơ chế từ sinh học — hệ miễn dịch, tính dẻo thần kinh, tín hiệu tế bào, tiến hóa, hệ vi sinh đường ruột — và ép áp nó vào bài toán kỹ thuật này.",
    tags: ["code", "wild"],
  },
  {
    id: "logistics",
    label: "Liên ngành: logistics / chuỗi cung ứng",
    prompt:
      "Mượn cơ chế từ logistics: hàng đợi, gom lô, just-in-time, hub-and-spoke, hoàn trả, last-mile. Áp dụng trực tiếp chúng vào bài toán này.",
    tags: ["code", "design"],
  },
  {
    id: "game-design",
    label: "Liên ngành: thiết kế game",
    prompt:
      "Tiếp cận như một nhà thiết kế game. Các vòng lặp, phần thưởng, ma sát, save-state, mẹo speedrun là gì? Hãy coi người dùng/hệ thống như người chơi.",
    tags: ["design", "general"],
  },
  {
    id: "markets",
    label: "Liên ngành: thị trường",
    prompt:
      "Xem bài toán như một thị trường. Ai là người mua, người bán, nhà tạo lập thị trường? Đấu giá, hợp đồng tương lai, trung tâm bù trừ sẽ trông như thế nào ở đây?",
    tags: ["design", "wild"],
  },
  {
    id: "inversion",
    label: "Đảo ngược",
    prompt:
      "Hãy hỏi câu ĐỐI NGƯỢC. Nếu mục tiêu là X, brainstorm 'làm sao đảm bảo KHÔNG-X' — rồi phủ định từng đáp án để biến lại thành ý tưởng.",
    tags: ["code", "design", "general"],
  },
  {
    id: "extreme-zero",
    label: "Cực hạn: ngân sách $0, 1 giờ",
    prompt:
      "Bạn không có tiền, không có đội, chỉ một giờ. Phiên bản thô nhất nhưng vẫn gánh được phần cốt lõi là gì? Hack, hardcode, vòng lặp thủ công đều được.",
    tags: ["code", "general"],
  },
  {
    id: "extreme-infinite",
    label: "Cực hạn: ngân sách vô hạn, 10 năm",
    prompt:
      "Bạn có compute vô hạn, kỹ sư vô hạn, và một thập kỷ. Phiên bản tối đa chủ nghĩa sẽ trông ra sao? Chỉ ở quy mô đó mới làm được điều gì?",
    tags: ["design", "wild"],
  },
  {
    id: "remove-assumption",
    label: "Loại bỏ giả định chịu tải",
    prompt:
      "Nêu thứ mà mọi người coi là bất biến trong bài toán này (framework, database, mô hình request/response, file system, mạng). Hãy tưởng tượng nó biến mất. Tạo ý tưởng chỉ tồn tại trong thế giới đó.",
    tags: ["code", "design", "wild"],
  },
  {
    id: "speedrunner",
    label: "Speedrunner",
    prompt:
      "Bạn là speedrunner. Tìm glitch, skip, mẹo out-of-bounds, shortcut frame-perfect. Con đường lách luật nhưng hợp lệ để đi qua bài toán này là gì?",
    tags: ["code", "wild"],
  },
  {
    id: "ant-colony",
    label: "Đàn kiến / bầy đàn",
    prompt:
      "Không có bộ điều phối trung tâm. Nhiều agent đơn giản, luật cục bộ, dấu pheromone. Bài toán tự giải quyết theo cách trồi nổi như thế nào?",
    tags: ["code", "wild"],
  },
  {
    id: "ops-3am",
    label: "On-call lúc 3 giờ sáng",
    prompt:
      "Bạn là kỹ sư on-call bị đánh thức lúc 3 giờ sáng khi thứ này vỡ. Thiết kế nào giúp bạn không bị pager réo nữa? Lời giải dạng runbook là gì?",
    tags: ["code", "design"],
  },
];

// Chọn N khung cho một lần chạy. Thiên về nhãn kỹ thuật khi bật codeMode,
// nhưng luôn kèm ít nhất một wildcard để phân kỳ vẫn đủ "dị".
export function selectFrames(n: number, codeMode = true): Frame[] {
  const pool = codeMode
    ? FRAMES.filter((f) => f.tags.includes("code") || f.tags.includes("design"))
    : [...FRAMES];
  const wild = FRAMES.filter((f) => f.tags.includes("wild"));

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, Math.max(1, n - 1));
  const wildPick = wild[Math.floor(Math.random() * wild.length)];
  if (!picked.find((f) => f.id === wildPick.id)) picked.push(wildPick);
  return picked.slice(0, n);
}
