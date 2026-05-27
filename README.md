# ADHD

**ADHD** là một skill cho coding agent giúp tránh hội tụ quá sớm khi giải bài toán mở.
Thay vì chốt đáp án đầu tiên, ADHD tách ra nhiều nhánh tư duy phân kỳ, chấm điểm,
loại bẫy, rồi đào sâu các phương án tốt nhất.

> Tree-of-thought có cắt tỉa, xây trên Claude Agent SDK.

> Lưu ý: README tiếng Việt này tập trung vào phần thực hành nhanh. Chi tiết đầy đủ
> về phương pháp và đánh giá xem thêm `docs/index.html`, `SOURCE-SPEC.md`, `EVALS.md`.

## Vì sao dùng ADHD?

Khi bài toán cần **khám phá nhiều hướng** (kiến trúc, refactor, gỡ lỗi mơ hồ, đặt tên,
thiết kế API), câu trả lời “đúng chuẩn sách giáo khoa” thường chưa đủ.
ADHD giúp:

- Mở rộng không gian ý tưởng trước khi hội tụ.
- Tăng khả năng tìm phương án không-hiển-nhiên nhưng khả thi.
- Gọi tên các bẫy “trông ổn nhưng không ship được”.
- Tạo bước tiếp theo cụ thể để bắt đầu triển khai.

## Cài đặt

### Dùng như CLI

```bash
npm install -g adhd-agent
adhd "thiết kế rate limiter qua bầu lại leader"
```

### Dùng như thư viện

```bash
npm install adhd-agent
```

```ts
import { run, renderText } from "adhd-agent";

const result = await run({
  problem: "Thiết kế cơ chế retry/timeout cho CLI gọi LLM",
  framesPerRun: 5,
  ideasPerFrame: 6,
  topK: 3,
  concurrency: 4,
  codeMode: true,
});

console.log(renderText(result));
```

## CLI

```bash
adhd "<problem>" [flags]
```

Các cờ chính:

- `--frames N`: số nhánh phân kỳ song song (mặc định 5)
- `--ideas N`: số ý tưởng mỗi nhánh (mặc định 6)
- `--top N`: số ý tưởng được đào sâu (mặc định 3)
- `--concurrency N`: số gọi LLM song song tối đa (mặc định 4)
- `--context PATH`: nạp tệp làm ngữ cảnh
- `--model NAME`: ghi đè model của SDK
- `--no-code-mode`: bỏ thiên lệch theo hướng kỹ thuật
- `--json`: xuất JSON thay vì văn bản định dạng
- `--quiet`: ẩn log tiến trình

## Cách hoạt động

ADHD chạy theo 2 pha chính:

1. **Phân kỳ (Diverge)**
   - Chọn nhiều khung nhận thức (ví dụ: regulator, speedrunner, biology, logistics...).
   - Mỗi khung chạy ở một lời gọi LLM độc lập.
   - Không chia sẻ ngữ cảnh giữa các nhánh để tránh neo tư duy.

2. **Hội tụ (Converge/Focus)**
   - Chấm điểm ý tưởng theo `novelty`, `viability`, `fit`.
   - Gom cụm để thấy “hình dạng” không gian ý tưởng.
   - Đào sâu top-K ý tưởng: cách chạy, rủi ro chính, bước đầu tiên, ý tưởng con.

## Kết quả đầu ra

`RunResult` gồm:

- `branches`: ý tưởng thô theo từng khung
- `clusters`: cụm ý tưởng theo góc nhìn nền tảng
- `shortlist`: danh sách rút gọn các ứng viên hứa hẹn
- `nonObviousPick`: lựa chọn không-hiển-nhiên
- `traps`: các ý tưởng có bẫy
- `deepened`: các nhánh đã đào sâu
- `provocation`: câu hỏi/ý tưởng wildcard để kích thích tư duy

## Đánh giá

Bộ benchmark nằm trong `bench/` và báo cáo gần nhất ở `EVALS.md`.
Repo so sánh ADHD với baseline một-phát trên nhiều bài toán mở và chấm bằng
một lượt LLM-as-judge độc lập.

## Tài liệu liên quan

- [SOURCE-SPEC.md](./SOURCE-SPEC.md): mô tả gốc của skill phân kỳ
- [EVALS.md](./EVALS.md): tổng hợp kết quả đánh giá
- [skills/adhd/SKILL.md](./skills/adhd/SKILL.md): hướng dẫn dùng skill
- [docs/index.html](./docs/index.html): bản preprint dạng web

## Phát triển

```bash
npm ci
npm run typecheck
npm run build
```

## License

MIT
