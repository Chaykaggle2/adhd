# Hướng dẫn đóng góp

Cảm ơn bạn đã quan tâm đóng góp cho **ADHD**.
Mục tiêu của tài liệu này là giúp bạn gửi thay đổi nhanh, rõ và dễ review.

## Trước khi bắt đầu

- Đọc `README.md`, `SOURCE-SPEC.md`, và `skills/adhd/SKILL.md`.
- Kiểm tra issue hiện có để tránh trùng lặp.
- Với thay đổi lớn, nên mở issue thảo luận trước.

## Thiết lập môi trường

```bash
npm ci
npm run typecheck
npm run build
```

## Quy ước chung

- Giữ thay đổi **nhỏ, tập trung, có mục đích rõ ràng**.
- Không sửa các phần không liên quan.
- Giữ TypeScript đúng kiểu và không phá API công khai nếu không cần thiết.
- Khi chỉnh prompt hoặc text hiển thị, ưu tiên rõ ràng và nhất quán thuật ngữ.

## Quy trình đề xuất

1. Fork và tạo nhánh mới.
2. Thực hiện thay đổi tối thiểu để giải quyết vấn đề.
3. Chạy `npm run typecheck` và `npm run build`.
4. Cập nhật tài liệu nếu thay đổi tác động tới người dùng.
5. Gửi PR với mô tả ngắn gọn: vấn đề, cách sửa, cách kiểm chứng.

## Quy tắc cho mã nguồn

### `src/`

- `engine.ts`: logic phân kỳ/hội tụ, chấm điểm, gom cụm, đào sâu.
- `frames.ts`: thư viện khung nhận thức.
- `render.ts`: hiển thị CLI.
- `cli.ts`: phân tích cờ dòng lệnh.
- `llm.ts`: gọi SDK và parse JSON.

Khi sửa các file này, vui lòng:

- Bảo toàn tách biệt giữa generator và critic.
- Không làm rò rỉ ngữ cảnh giữa các nhánh phân kỳ.
- Tránh tăng độ phức tạp không cần thiết.

### `bench/`

- Cập nhật benchmark khi thay đổi ảnh hưởng logic chấm điểm hoặc output.
- Tránh hardcode kết quả mong muốn theo model cụ thể.

## Commit message

Nên dùng dạng rõ nghĩa, ví dụ:

- `feat: add frame for reliability operations`
- `fix: prevent invalid JSON parse fallback`
- `docs: clarify cli flags in README`

## Báo lỗi và đề xuất tính năng

Dùng mẫu issue trong `.github/ISSUE_TEMPLATE/`:

- `bug_report.md`
- `feature_request.md`

## Chính sách hành vi

Khi tham gia dự án, bạn đồng ý tuân thủ `CODE_OF_CONDUCT.md`.

## Câu hỏi

Nếu chưa chắc cách triển khai, hãy mở issue và nêu:

- Bối cảnh
- Ràng buộc
- Các hướng bạn đã thử

Chúng tôi sẽ hỗ trợ bạn chọn hướng phù hợp.
