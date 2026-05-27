# ADHD so với baseline — báo cáo đánh giá

Tệp này mô tả kết quả benchmark của ADHD khi so sánh với baseline một-phát
trên cùng model.

## Tóm tắt

- Bộ bài toán: 6 bài toán kỹ thuật mở
- Cách chấm: LLM-as-judge độc lập
- Kết quả tổng thể: **ADHD 5W / 1L / 0T**

## Điểm trung bình (0–10)

| Chiều đánh giá | ADHD | Baseline | Δ |
| --- | ---: | ---: | ---: |
| breadth | 9.00 | 4.83 | +4.17 |
| novelty | 7.83 | 2.67 | +5.17 |
| trap_detection | 9.50 | 1.83 | +7.67 |
| actionability | 9.50 | 6.50 | +3.00 |
| builder_usefulness | 7.67 | 6.83 | +0.83 |

## Bài toán sử dụng

- `lru-100ms`
- `llm-hang-cli`
- `rate-limit-leader`
- `fuzzy-bug`
- `monolith-split`
- `naming-feature-flag`

## Quy trình đánh giá

1. Sinh output bằng baseline (một lời gọi LLM).
2. Sinh output bằng ADHD (phân kỳ nhiều khung + chấm + gom cụm + đào sâu).
3. Trộn ngẫu nhiên thứ tự A/B để giảm thiên lệch vị trí.
4. Dùng `bench/judge.ts` chấm theo rubric:
   - `breadth`
   - `novelty`
   - `trap_detection`
   - `actionability`
   - `builder_usefulness`

## Nhận xét ngắn

ADHD đặc biệt mạnh ở:

- Khả năng mở rộng không gian ý tưởng (breadth)
- Khả năng tìm ý tưởng không-hiển-nhiên nhưng khả thi (novelty)
- Khả năng gọi tên bẫy kèm lý do (trap detection)

Baseline vẫn có thể thắng khi bài toán đã khá chuẩn hóa và cần câu trả lời gọn,
rất thực dụng để ship ngay.

## Tái tạo kết quả

```bash
npm run evals
```

Chạy nhanh:

```bash
npm run evals:quick
```

Kết quả chi tiết từng bài và transcript nằm trong `bench/results.json`.
