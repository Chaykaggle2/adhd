export type Idea = {
  id: string;
  frameId: string;
  cluster?: string;
  text: string;        // cụm một dòng, không phải đoạn văn
  rationale?: string;  // tùy chọn, ngắn
  score?: Score;
  depth: number;       // 0 = phân kỳ gốc, 1+ = đã đào sâu
  parentId?: string;
};

export type Score = {
  novelty: number;     // 0-10, độ xa so với phương án hiển nhiên
  viability: number;   // 0-10, có thể triển khai thực tế
  fit: number;         // 0-10, giải quyết bài toán đã nêu
  total: number;       // tổng có trọng số
  trap?: string;       // nếu trông ổn nhưng là bẫy thì vì sao
};

export type Branch = {
  frameId: string;
  ideas: Idea[];
};

export type RunResult = {
  problem: string;
  reframe?: string;
  branches: Branch[];        // phân kỳ thô theo từng khung
  clusters: Cluster[];        // hình dạng không gian sau hội tụ
  shortlist: Idea[];          // 2-4 phương án hứa hẹn nhất
  nonObviousPick: Idea | null;
  traps: Idea[];
  deepened: DeepenedIdea[];   // các nhánh top đã mở rộng
  provocation: string;        // một câu hỏi/ý tưởng wildcard
};

export type Cluster = {
  label: string;
  ideaIds: string[];
};

export type DeepenedIdea = {
  ideaId: string;
  sketch: string;       // 4-8 câu: cách hoạt động, rủi ro chính, bước đầu tiên
  childIdeas: Idea[];   // ý tưởng con xuất hiện khi đào sâu
};

export type RunOptions = {
  problem: string;
  context?: string;                    // đoạn codebase, ràng buộc, stack
  framesPerRun?: number;               // mặc định 5
  ideasPerFrame?: number;              // mặc định 6
  topK?: number;                       // số ý tưởng cần đào sâu, mặc định 3
  concurrency?: number;                // số nhánh song song, mặc định 4
  codeMode?: boolean;                  // thiên lệch khung theo hướng kỹ thuật
  model?: string;                      // ghi đè model SDK
  onEvent?: (e: RunEvent) => void;     // stream tiến trình ra caller/CLI
};

export type RunEvent =
  | { kind: "frame:start"; frameId: string; frameLabel: string }
  | { kind: "frame:done"; frameId: string; count: number }
  | { kind: "score:done"; total: number }
  | { kind: "cluster:done"; clusters: number }
  | { kind: "deepen:start"; ideaId: string; text: string }
  | { kind: "deepen:done"; ideaId: string }
  | { kind: "warn"; message: string };
