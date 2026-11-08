NOCTURNE PLAYER — BẢN PWA ĐÃ RÀ SOÁT

TÍNH NĂNG
- Nhập nhiều tệp audio/video từ bộ chọn tệp của iPhone.
- Nhận diện phần mở rộng phổ biến kể cả khi iOS không cung cấp MIME type.
- Lưu tệp trong IndexedDB trên thiết bị; không tải nhạc lên máy chủ.
- Phát / tạm dừng / tua / chỉnh âm lượng / bài trước / bài tiếp.
- Tự chuyển bài khi kết thúc; phát ngẫu nhiên và lặp danh sách.
- Điều khiển Media Session khi trình duyệt và iOS hỗ trợ.
- Vỏ ứng dụng được cache để mở lại offline sau lần tải đầu.

CÁCH CÀI
1. Đưa toàn bộ thư mục lên địa chỉ HTTPS (ví dụ GitHub Pages hoặc hosting tĩnh).
2. Mở địa chỉ bằng Safari trên iPhone.
3. Chạm Chia sẻ > Thêm vào màn hình chính > Thêm.

GIỚI HẠN
- Đây là PWA, không phải IPA/App Store app.
- iOS kiểm soát phát nền của web app. Nhạc audio thông thường có thể tiếp tục phát khi khóa màn hình, nhưng không thể bảo đảm mọi phiên bản/cài đặt iOS.
- Video ẩn dùng để phát tiếng có thể bị iOS dừng khi ứng dụng xuống nền. Muốn phát nền video ổn định, cần chuyển video thành audio trước hoặc dùng bản iOS native.
- Trình duyệt có thể xóa dữ liệu website khi thiếu dung lượng; giữ bản gốc trong Files.
- Chưa thể kiểm thử trực tiếp trên iPhone thật trong môi trường build này.

KIỂM TRA KỸ THUẬT
- Kiểm tra cú pháp JavaScript bằng Node.js.
- Kiểm tra JSON manifest và tài nguyên được tham chiếu.
- Rà soát luồng nhập tệp, chuyển bài, xóa bài và lỗi lưu trữ.
