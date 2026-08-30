# Quản trị Elégant Florist bằng Supabase

## 1. Tạo database và quyền truy cập

1. Tạo project tại Supabase (hoặc dùng project hiện có).
2. Mở SQL Editor, chạy toàn bộ `supabase/schema.sql` **một lần** trên project mới. Script tạo `products`, `admin_users`, bucket `flower-images` và RLS.
3. Trong Authentication → Users, tạo tài khoản email/password của chủ shop. Không cần mở đăng ký công khai.
4. Copy UUID tài khoản, chạy riêng:

```sql
insert into public.admin_users(user_id) values ('UUID-CUA-TAI-KHOAN');
```

Chỉ tài khoản nằm trong bảng này được ghi sản phẩm và tải ảnh. Người đã đăng nhập bình thường vẫn không có quyền admin. Không cho người dùng tự ghi vào `admin_users`.

## 2. Kết nối ứng dụng

Copy `.env.example` thành `.env.local`. Điền Project URL và **publishable key** trong Supabase Project Settings → API Keys:

```env
VITE_SUPABASE_URL=https://PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Không sử dụng service-role/secret key. Hai giá trị VITE được đưa vào frontend, quyền truy cập thực sự được kiểm soát bởi RLS.
Khởi động lại `npm run dev` sau khi đổi env.
Trên Vercel: thêm hai biến tương tự vào Environment Variables và redeploy. Các route `/admin` và `/flowers/:slug` dùng cấu hình SPA hiện có.

## 3. Thêm sản phẩm

### Danh mục sản phẩm

**Nhiều danh mục:** với database đang có, chạy thêm `supabase/product-categories.sql` một lần. Script thêm `products.categories` (mảng text) và giữ lại danh mục cũ. Sau đó bấm **Kiểm tra lại nhiều danh mục** trong admin. Form cho tick nhiều checkbox; Garden lọc theo bất kỳ danh mục nào đã chọn. Cột `category` cũ tiếp tục lưu lựa chọn đầu tiên để tương thích. Không chạy lại toàn bộ schema.sql trên database đã có.

Sau khi chạy `schema.sql`, chạy thêm `supabase/categories.sql` trong SQL Editor (dùng được cả với project đang có dữ liệu). File này tạo bảng danh mục có RLS, chuyển các tên danh mục đang dùng sang bảng mới, và không sửa sản phẩm cũ. Có thể chạy lại an toàn.
Trong admin → **Danh mục sản phẩm**, nhập tên rồi bấm **Tạo danh mục**. Danh mục mới tự được thêm vào các lựa chọn trong form sản phẩm. Ô **Danh mục** là nhóm checkbox chọn nhiều, không cần gõ lại tên. Có thể bật/tắt lựa chọn bằng các thẻ trong phần quản lý. Tạo danh mục không tự thay đổi sản phẩm đang sửa: cần bấm **Lưu sản phẩm**.
Nếu chưa chạy migration, admin vẫn cho chọn danh mục hiện có từ sản phẩm, nhưng khóa tạo danh mục mới và hiển thị SQL thiết lập. Sau khi chạy SQL, bấm **Tải lại danh mục**.

Mở `/admin`, đăng nhập, chọn **Sản phẩm mới**. Nhập tên, slug ổn định, danh mục, giá VND, xuất xứ, mô tả, tag và thông tin chăm sóc.
Chọn tối đa 12 ảnh JPG/PNG/WebP, mỗi ảnh ≤10MB. Nên dùng ảnh 900×1200 hoặc tỷ lệ 3:4, dung lượng 200–500KB để tải nhanh.
Ảnh đầu tiên là ảnh bìa; dùng mũi tên để đổi thứ tự. Ảnh giữ nguyên bản upload; khung website hiển thị 3:4.
Chọn **Xuất bản** để hiện trong Garden; **Hiển thị trong Discover** để đưa vào bộ thẻ. Nếu không có sản phẩm nào được chọn cho Discover, bộ thẻ dùng tất cả sản phẩm xuất bản.
Bỏ Xuất bản để lưu nháp/ẩn mà không xóa dữ liệu. Slug phải duy nhất, chỉ chữ không dấu, số và dấu gạch ngang.
Mỗi detail chỉ lấy `images` của chính sản phẩm, không trộn ảnh hoa khác.

## 4. Dữ liệu mẫu và lưu ý

- Chưa cấu hình env: website vẫn dùng 18 sản phẩm mẫu local, `/admin` chỉ hiển thị hướng dẫn kết nối, không giả vờ lưu.
- Đã cấu hình env: chỉ đọc sản phẩm xuất bản từ Supabase; database rỗng sẽ hiển thị trạng thái đang cập nhật, không tự trộn ảnh mẫu.
- Trong admin có nút **Nhập 18 sản phẩm mẫu cũ** để tải bộ ảnh cũ lên Storage và xuất bản dữ liệu demo. Nút này bỏ qua slug đã có, không ghi đè sản phẩm đã sửa; có thể chạy lại nếu nhập dở. Tên/giá/xuất xứ vẫn là nội dung mẫu, cần kiểm tra trước khi kinh doanh thật. Mỗi mẫu có một ảnh đúng sản phẩm; không trộn ảnh sản phẩm khác.
- Website tải lại dữ liệu khi mở trang hoặc quay lại tab. Không cần push Git cho mỗi sản phẩm mới.
- Bucket ảnh công khai phù hợp cho ảnh sản phẩm: ai có URL đều xem được, kể cả ảnh bản nháp. Không tải hình riêng tư. Xóa ảnh khỏi form chỉ bỏ liên kết khi lưu; file cũ giữ trong Storage để tránh xóa nhầm ảnh đang dùng. Có thể dọn thủ công sau.
- Chưa có trang đặt hàng/thanh toán, realtime subscription, hay hệ thống tồn kho. Nút giỏ hàng hiện là giao diện mẫu.

## 5. Checklist kiểm tra sau khi kết nối

- Admin tạo/lưu bản nháp nhiều ảnh, đổi ảnh bìa, xuất bản rồi mở Garden/Discover/detail bằng cửa sổ ẩn danh.
- Bản nháp không đọc được bằng publishable key với phiên anon. Người dùng non-admin không thể insert/update/delete sản phẩm hoặc upload ảnh.
- Refresh `/flowers/slug` không lỗi 404; các ảnh và thứ tự trùng dữ liệu sản phẩm.
- Kiểm tra sai mật khẩu, slug trùng, file không hợp lệ, lỗi mạng. Form không thông báo lưu thành công khi API lỗi.

Tài liệu chính thức: https://supabase.com/docs/guides/storage/security/access-control và https://supabase.com/docs/guides/auth/quickstarts/react
