# Demo Data Toolkit

Bộ công cụ này giúp dựng nhanh dữ liệu demo cho hệ thống theo hướng:
- 10 project đa domain
- labels toàn cục dùng lại được
- label rules + error types theo từng project
- datasets/batches nhiều trạng thái
- assignment mẫu cho annotator/reviewer

Các artifact chính:
- `demo/demo-seed.manifest.json`: nguồn sự thật của toàn bộ cấu hình demo
- `scripts/demo/generate-demo-assets.mjs`: sinh ảnh fallback khi chưa có ảnh curated
- `scripts/demo/seed-demo-data.mjs`: seed project, labels, rules, error types, datasets, assignments qua HTTP API
- `demo/DEMO_PLAYBOOK.md`: map dùng demo theo role và flow
