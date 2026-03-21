# Demo Assets

Thư mục này dùng cho bộ dữ liệu demo seed.

Quy ước:
- `demo-assets/curated/<project-slug>/<batch-name>/`: ảnh public/curated đã chọn lọc để upload thật.
- `demo-assets/generated/<project-slug>/<batch-name>/`: ảnh fallback do script sinh tự động khi chưa có ảnh curated.

Mặc định repo **không** commit ảnh thật để tránh phình dung lượng. Hai thư mục con trên đã được thêm vào `.gitignore`.

Luồng dùng:
1. Thêm ảnh curated vào `demo-assets/curated/...` nếu đã có.
2. Nếu chưa có, chạy `npm run demo:assets` để sinh ảnh fallback cho toàn bộ manifest.
3. Chạy `npm run demo:seed -- --base-url http://localhost:8080 --manager-user Manager1 --manager-pass manager123`.
