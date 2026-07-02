# BÁO CÁO ĐỒ ÁN III
## XÂY DỰNG NỀN TẢNG THƯƠNG MẠI ĐIỆN TỬ ĐA NHÀ BÁN

---

> **Hướng dẫn sử dụng tài liệu này:**
> File này là mục lục tổng hợp. Nội dung chi tiết nằm trong các file riêng trong thư mục `report/`.
> Khi xuất sang Word/PDF, ghép nội dung theo thứ tự dưới đây.

---

## Cấu trúc báo cáo (~30 trang A4)

| Chương | File | Ước tính trang |
|--------|------|----------------|
| Trang bìa | *(tự soạn theo mẫu trường)* | 1 |
| Nhận xét GVHD | *(tự soạn)* | 1 |
| Mục lục | *(tự tạo từ headings)* | 1 |
| **Chương 1: Giới thiệu** | `chuong1_gioi_thieu.md` | ~4–5 |
| **Chương 2: Cơ sở lý thuyết** | `chuong2_co_so_ly_thuyet.md` | ~6–7 |
| **Chương 3: Phân tích & Thiết kế** | `chuong3_phan_tich_thiet_ke.md` | ~7–8 |
| **Chương 4: Cài đặt & Triển khai** | `chuong4_cai_dat.md` | ~7–8 |
| **Chương 5: Kết quả & Đánh giá** | `chuong5_ket_qua.md` | ~4–5 |
| Tài liệu tham khảo + Phụ lục | `tai_lieu_tham_khao.md` | ~2–3 |
| **Tổng cộng** | | **~33–38 trang** |

---

## Checklist hoàn thiện báo cáo

### Phần cần tự bổ sung:

- [ ] **Trang bìa**: Tên trường, Khoa, Tên đề tài, Họ tên SV, MSSV, GVHD, Năm học
- [ ] **Nhận xét của GVHD** (trang ký tên)
- [ ] **Lời cam đoan** (không đạo văn)
- [ ] **Lời cảm ơn** (tùy chọn)
- [ ] **Danh mục hình ảnh**: Liệt kê các hình trong báo cáo kèm số trang
- [ ] **Danh mục bảng**: Liệt kê các bảng kèm số trang
- [ ] **Chèn ảnh chụp màn hình** vào Chương 5 (mục 5.2) — ảnh demo giao diện
- [ ] **Điền tên thật** vào các chỗ placeholder (tên sinh viên, tên trường, v.v.)
- [ ] **Đánh số trang** (từ trang 1 sau mục lục)
- [ ] **Định dạng Word/LaTeX** theo mẫu của trường (font, cỡ chữ, lề)

### Chỉnh sửa nội dung:

- [ ] Kiểm tra thông tin VPS/domain nếu đã thay đổi
- [ ] Bổ sung kết quả kiểm thử cụ thể (nếu có test cases)
- [ ] Thêm URL GitHub repository (nếu public)
- [ ] Chỉnh phần "Phương pháp thực hiện" cho đúng timeline thực tế của bạn

---

## Hướng dẫn ghép file sang Word

**Cách 1 — Dùng Pandoc (khuyến nghị):**
```bash
# Cài pandoc
sudo apt install pandoc

# Ghép tất cả file thành 1 file Word
pandoc \
  chuong1_gioi_thieu.md \
  chuong2_co_so_ly_thuyet.md \
  chuong3_phan_tich_thiet_ke.md \
  chuong4_cai_dat.md \
  chuong5_ket_qua.md \
  tai_lieu_tham_khao.md \
  -o bao_cao_do_an.docx \
  --reference-doc=template.docx  # Nếu có template Word
```

**Cách 2 — Copy thủ công:**
- Mở từng file .md
- Copy nội dung vào Word theo thứ tự
- Áp dụng Heading styles của Word để tạo mục lục tự động

---

## Ghi chú quan trọng khi viết báo cáo

1. **Phần hình ảnh (Chương 5.2)**: Cần chụp màn hình thực tế và chèn vào — đây là phần minh chứng trực quan nhất cho hội đồng

2. **Thuật ngữ**: Giữ nguyên các thuật ngữ tiếng Anh chuyên ngành (RabbitMQ, JWT, WebSocket, ORM...) không dịch sang tiếng Việt khi không cần thiết

3. **Code snippets**: Các đoạn code trong báo cáo là minh họa đã được rút gọn — chỉ giữ phần quan trọng nhất. Không cần in toàn bộ code

4. **Trích dẫn**: Mỗi khi đề cập công nghệ/khái niệm từ tài liệu tham khảo, thêm [số_tài_liệu] ở cuối câu

5. **Độ dài**: Mỗi chương ~6–8 trang. Nếu cần dài hơn, bổ sung vào Chương 4 phần test cases và kết quả kiểm thử chi tiết
