# Demo Playbook

## Flagship Projects

### 1. `[DEMO] Giao thông đô thị - Camera ngã tư`
- Mục tiêu demo: object detection cơ bản, nhiều vehicle classes
- Dùng để demo manager overview, annotator happy path, reviewer approve

### 2. `[DEMO] Nhà kho - Kiểm kê pallet`
- Mục tiêu demo: detection + logistics rules + warehouse error types
- Dùng để demo luồng rejected/rework/approved

### 3. `[DEMO] An toàn lao động - PPE công trường`
- Mục tiêu demo: safety labels, policy violations, reviewer reasoning
- Dùng để demo reject với error type rõ ràng

## Suggested Workflow Coverage

### Manager Demo
- Mở danh sách 10 project
- Chọn 1 flagship project để xem:
  - Overview
  - Data / batches
  - Label rules
  - Error types
  - Assignments

### Annotator Demo
- 1 assignment `IN_PROGRESS`
- 1 assignment `REJECTED` để xem feedback
- 1 assignment `RE_SUBMITTED` hoặc `SUBMITTED` để xem read-only flow

### Reviewer Demo
- 1 assignment `SUBMITTED` để duyệt happy path
- 1 assignment `RE_SUBMITTED` để duyệt lại
- 1 assignment đã `REJECTED` hoặc `APPROVED` để xem trạng thái cuối

## Seed Expectations
- Seed script tạo đầy đủ project, labels, rules, error types, datasets, assignments.
- Việc “đẩy” assignment sang từng trạng thái nghiệp vụ sâu hơn có thể cần hoàn thiện bằng UI sau seed.
- Với 3 flagship projects, nên polish thủ công qua UI sau seed để chỉnh mô tả, wording rules và batch name.
