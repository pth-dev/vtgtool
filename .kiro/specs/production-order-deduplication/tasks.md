# Implementation Plan: Production Order Deduplication

## Overview

Triển khai chức năng tự động loại bỏ Production Order trùng lặp khi upload file dashboard. Hệ thống sẽ giữ lại bản ghi có Reporting day mới nhất cho mỗi Production Order No.

## Tasks

- [x] 1. Database Migration - Thêm cột production_order_no
  - [x] 1.1 Tạo migration file để thêm cột `production_order_no` vào bảng `dashboard_data`
    - Thêm cột `production_order_no` kiểu String(100), nullable=True
    - Tạo index trên cột mới để tối ưu query
    - _Requirements: 1.1, 1.2_
  - [x] 1.2 Cập nhật model DashboardData trong `models.py`
    - Thêm field `production_order_no = Column(String(100), index=True)`
    - _Requirements: 1.1_

- [x] 2. Implement DeduplicationService
  - [x] 2.1 Tạo file `packages/backend/app/services/deduplication.py`
    - Định nghĩa dataclass `DeduplicationResult`
    - Tạo class `DeduplicationService` với các static methods
    - _Requirements: 1.1, 2.1_
  - [x] 2.2 Implement method `deduplicate_dataframe()`
    - Sort DataFrame by Reporting day descending
    - Drop duplicates on Production Order No., keep first (latest)
    - Return tuple (deduplicated_df, DeduplicationResult)
    - Log chi tiết các duplicates được loại bỏ
    - _Requirements: 1.3, 2.1, 2.2, 2.3_
  - [x] 2.3 Write property test cho `deduplicate_dataframe`
    - **Property 1: Latest Date Retention**
    - **Validates: Requirements 1.3, 2.1**
  - [x] 2.4 Write property test cho Idempotence
    - **Property 5: Idempotence**
    - **Validates: Requirements 2.1, 2.4**
  - [x] 2.5 Implement method `deduplicate_against_existing()`
    - Query để tìm Production Orders trùng lặp across all sources
    - Delete records có reporting_day cũ hơn
    - Return DeduplicationResult với statistics
    - _Requirements: 3.2, 2.1_

- [x] 3. Checkpoint - Verify DeduplicationService
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Integrate với Upload Flow
  - [x] 4.1 Cập nhật column_mapping trong `datasources.py`
    - Thêm mapping `'Production Order No.': 'production_order_no'`
    - _Requirements: 1.1_
  - [x] 4.2 Cập nhật `process_upload_task()` để gọi deduplication
    - Import DeduplicationService
    - Gọi `deduplicate_dataframe()` sau normalize
    - Gọi `deduplicate_against_existing()` sau insert
    - Log kết quả deduplication
    - _Requirements: 3.1, 3.2, 3.4_
  - [x] 4.3 Write unit test cho upload flow với duplicate data
    - Test upload file có duplicates
    - Verify chỉ records mới nhất được lưu
    - _Requirements: 3.1, 3.2_

- [x] 5. Update Dashboard Queries (nếu cần)
  - [x] 5.1 Review và update các dashboard queries nếu cần sử dụng production_order_no
    - Kiểm tra drilldown endpoint
    - Kiểm tra các chart queries
    - _Requirements: 2.4_

- [-] 6. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.
  - Run migration trên development database
  - Test end-to-end với file upload thực tế

## Notes

- Tasks marked with `*` are optional và có thể skip để có MVP nhanh hơn
- Cần chạy migration trước khi test integration
- Property tests sử dụng `hypothesis` library - cần install nếu chưa có
- Sau khi hoàn thành, cần clear cache dashboard để data mới được hiển thị

