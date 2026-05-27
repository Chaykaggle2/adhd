---
name: adhd
description: Mở rộng tư duy trước khi hội tụ. Dành cho bài toán mở cần nhiều hướng không-hiển-nhiên.
allowed-tools: Read, Write, Edit, MultiEdit, Bash, Grep, Glob
---

# ADHD Skill

ADHD là một chế độ tư duy cho agent: **phân kỳ rộng trước, hội tụ có phê bình sau**.

Mục tiêu là tránh lỗi phổ biến: bám vào đáp án hợp lý đầu tiên rồi tối ưu hoá nó.

## Khi nào nên dùng

Dùng ADHD khi:

- Bài toán mở, có nhiều phương án hợp lệ.
- Chi phí chọn sai hướng ban đầu cao.
- Cần phương án không-hiển-nhiên nhưng vẫn triển khai được.
- Cần phát hiện bẫy kiến trúc/sản phẩm trước khi code sâu.

Không nên dùng ADHD cho:

- Câu hỏi tra cứu trực tiếp.
- Lỗi đã biết root cause.
- Tác vụ một bước có đáp án chuẩn rõ ràng.

## Vòng lặp cốt lõi

### Pha 1 — Phân kỳ

- Chọn nhiều khung nhận thức khác nhau.
- Chạy các nhánh song song, độc lập ngữ cảnh.
- Chỉ tạo ý tưởng, không chấm điểm.

### Pha 2 — Hội tụ

- Chấm điểm theo novelty / viability / fit.
- Gom cụm để thấy cấu trúc không gian ý tưởng.
- Chọn top-K để đào sâu.
- Gắn cờ các ý tưởng là bẫy.

### Pha 3 — Đào sâu

- Với từng ý tưởng top:
  - Mô tả cách vận hành thực tế.
  - Nêu rủi ro chịu tải chính.
  - Nêu bước cụ thể đầu tiên để triển khai.
  - Tạo thêm ý tưởng con.

## Khung nhận thức gợi ý

- Hardware engineer
- Regulator / auditor
- 10-year-old
- Adversary
- Biology
- Logistics
- Game design
- Markets
- Inversion
- Extreme constraints ($0 / vô hạn)
- Remove load-bearing assumption
- Speedrunner
- Ant colony
- 3am on-call

## Quy tắc chất lượng

- Không hội tụ trong lúc phân kỳ.
- Không để các nhánh đọc output của nhau ở pha 1.
- Tránh 10 biến thể nhỏ của cùng một ý tưởng.
- Bắt buộc chốt lập trường sau khi hội tụ.

## Dạng output đề xuất

1. Xác nhận bài toán (và reframe nếu có)
2. Tập rộng theo cụm
3. Danh sách rút gọn 2–4 ý tưởng + lựa chọn không-hiển-nhiên
4. Danh sách bẫy
5. Các nhánh đã đào sâu
6. Một câu khiêu khích wildcard

## Prompt khung tham khảo

### Divergent mode

- Chỉ JSON
- Cấm đánh giá/xếp hạng
- Ưu tiên độ đa dạng
- Vượt qua 3 ý tưởng hiển nhiên đầu tiên

### Convergent mode

- Chấm theo rubric rõ ràng
- Gọi tên bẫy có lý do
- Trung thực về đánh đổi

### Focus mode

- Phác thảo có thể thực thi
- Rủi ro chịu tải
- Bước triển khai đầu tiên
- Ý tưởng con để mở rộng

## Kết hợp với coding workflow

Bạn có thể chèn ADHD như một bước phụ trong agent lớn hơn:

- Trước khi chốt kiến trúc
- Khi review code và cần tìm failure mode
- Khi debug bế tắc sau nhiều patch
- Khi thiết kế test case đối kháng

## Checklist nhanh

- [ ] Bài toán đã đủ mở để cần phân kỳ chưa?
- [ ] Đã chọn đa dạng khung nhìn chưa?
- [ ] Đã tách generator và critic chưa?
- [ ] Đã gắn cờ trap chưa?
- [ ] Đã có bước đầu cụ thể để hành động chưa?
