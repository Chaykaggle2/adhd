# Lên ý tưởng phân kỳ (source skill)

Đây là đặc tả skill gốc mà `connect-dots` hiện thực hóa thành engine tree-of-thought
có thể chạy được. Tài liệu này được giữ lại để tham chiếu và làm mô tả chuẩn
về vòng lặp phân kỳ/hội tụ mà engine triển khai.

---

Skill này mở rộng tìm kiếm trước khi thu hẹp. Chế độ thất bại mặc định khi tạo ý tưởng là hội tụ quá sớm: bám vào câu trả lời hợp lý đầu tiên rồi mài giũa nó. Điều đó tạo ra đầu ra ổn nhưng dễ quên. Mục tiêu ở đây là tạo một tập ứng viên thật sự rộng và khác thường trước, rồi mới hội tụ bằng phán đoán. Độ rộng thì rẻ; bỏ lỡ ý tưởng thì đắt.

Lưu ý về bản chất của skill này: nó không thay đổi cách model lập luận ở tầng thấp. Nó thay đổi chiến lược — chú ý dồn vào đâu, phân kỳ chạy bao lâu trước khi hội tụ, và thế nào là "đủ" ý tưởng. Hãy coi nó là một chế độ chủ đích, không phải cá tính.

## Vòng lặp cốt lõi

Chạy hai pha tách biệt. Giữ chúng riêng nhau. Trộn lẫn là thứ giết chất lượng ý tưởng, vì nhà phê bình bóp nghẹt bộ tạo.

**Pha 1 — Phân kỳ** (tạo sinh, không phán xét). Tạo nhanh một tập ứng viên lớn. Tạm dừng đánh giá hoàn toàn. Ý tưởng dở, hiển nhiên và phi lý đều được chào đón vì chúng gieo mầm cho ý tưởng tốt hơn. Nhắm vào số lượng và đa dạng, không phải chất lượng ngay lập tức. Đừng dừng ở 3 ý tưởng đầu — chúng gần như luôn là các ý tưởng hiển nhiên mà ai cũng nghĩ ra. Hãy vượt qua vùng hiển nhiên để vào vùng "khó chịu" nơi ý tưởng thú vị xuất hiện.

**Pha 2 — Hội tụ** (chọn lọc bằng phán đoán). Giờ đưa nhà phê bình quay lại. Gom cụm ứng viên, loại những cái đã chết, và làm lộ vài cái đáng theo đuổi. Trung thực với các đánh đổi. Đây là nơi phán đoán của người xây hệ thống phát huy: cái nào thật sự ship được, cái nào không-hiển-nhiên nhưng khả thi nhất, cái nào là bẫy.

Việc tách pha quan trọng vì hai chế độ dùng tư thế trái ngược nhau. Phân kỳ thưởng cho "đúng, và...". Hội tụ thưởng cho "không, vì...". Làm cùng lúc thì bạn không có được cái nào.

## Kỹ thuật ép độ rộng

Đừng liên tưởng tự do ngẫu nhiên — nó sẽ trôi về vùng quen thuộc. Hãy dùng prompt có cấu trúc để đẩy chú ý vào các góc mà nó không tự đi tới. Mỗi phiên chỉ chọn vài kỹ thuật; đừng cày hết tất cả.

- **Đa dạng khung nhìn.** Hỏi lại câu hỏi từ các vị trí quan sát khác biệt mạnh: một người làm phần cứng sẽ giải bài toán phần mềm này thế nào? Cơ quan quản lý? Một đứa trẻ 10 tuổi? Đối thủ muốn làm nó thất bại?
- **Cấy ghép liên ngành.** Lấy cơ chế từ một lĩnh vực xa và ép áp nó. Sinh học, logistics, thiết kế game, hệ miễn dịch, đàn kiến, thị trường hợp đồng tương lai, speedrunning.
- **Đảo ngược.** Hỏi câu ngược lại. Thay vì "làm sao giữ người dùng ở lại", hãy hỏi "làm sao đuổi sạch người dùng" — rồi phủ định các đáp án.
- **Đẩy tới cực hạn.** Ngân sách $0 / vô hạn. 1 giờ / 10 năm. Cực hạn phá neo ở vùng trung dung hợp lý.
- **Bỏ giả định chịu tải.** Nêu thứ ai cũng coi là cố định và hỏi nếu nó biến mất thì điều gì thành khả thi.
- **Kết hợp hai ứng viên không liên quan.** Lấy ý tưởng #3 và #11 trong danh sách rồi hỏi dạng lai của chúng sẽ ra sao.

## Dạng đầu ra

- **Tóm tắt ngắn.** Một hoặc hai dòng xác nhận bài toán, gồm cả reframe nếu có.
- **Tập rộng.** Danh sách ứng viên đủ nhiều, nhóm thành các cụm thô theo góc nhìn nền tảng.
- **Hội tụ.** 2–4 phương án hứa hẹn nhất, kèm lý do. Nêu rõ phương án không-hiển-nhiên thú vị nhất. Gắn cờ bẫy.
- **Một khiêu khích.** Một ý tưởng wildcard hoặc câu hỏi mở.

## Mẫu phản tác dụng

- Hội tụ trá hình thành phân kỳ (10 biến thể nhỏ của một ý tưởng).
- Dị vì dị, không có hội tụ.
- Tường văn xuôi đồng trọng số che mất ý tưởng hay.
- Từ chối chốt phương án. Sau khi phân kỳ, phải đưa ra lập trường.
