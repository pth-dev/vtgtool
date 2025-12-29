# Requirements Document

## Introduction

Chức năng chuẩn hóa dữ liệu dashboard bằng cách loại bỏ các Production Order trùng lặp theo tuần. Khi cùng một Production Order No xuất hiện ở nhiều Reporting day khác nhau, hệ thống sẽ chỉ giữ lại bản ghi có Reporting day mới nhất và loại bỏ các bản ghi cũ hơn.

**Ví dụ:**
- Ngày 25/11: có đơn RR11541B, RR11541E
- Ngày 30/11: vẫn là 2 đơn RR11541B, RR11541E
- → Loại bỏ bản ghi ngày 25/11, chỉ giữ bản ghi ngày 30/11

## Glossary

- **Production_Order_No**: Mã số đơn hàng sản xuất (ví dụ: RR11541B, RR11541E)
- **Reporting_Day**: Ngày báo cáo của bản ghi dữ liệu
- **Deduplication_Service**: Service xử lý loại bỏ các bản ghi trùng lặp
- **Dashboard_Data**: Bảng dữ liệu dashboard chứa thông tin đơn hàng
- **Data_Processor**: Module xử lý và chuẩn hóa dữ liệu từ file upload

## Requirements

### Requirement 1: Xác định Production Order trùng lặp

**User Story:** As a data analyst, I want the system to identify duplicate Production Orders across different reporting days, so that I can have clean and accurate data for analysis.

#### Acceptance Criteria

1. WHEN data is imported, THE Deduplication_Service SHALL identify Production Orders that appear on multiple Reporting days
2. WHEN comparing Production Orders, THE Deduplication_Service SHALL use exact string matching on Production_Order_No field
3. WHEN a Production Order appears on multiple dates, THE Deduplication_Service SHALL mark all except the latest Reporting_Day as duplicates

### Requirement 2: Loại bỏ bản ghi trùng lặp

**User Story:** As a data analyst, I want duplicate records to be automatically removed keeping only the latest, so that dashboard metrics are not inflated by counting the same order multiple times.

#### Acceptance Criteria

1. WHEN duplicates are identified, THE Deduplication_Service SHALL retain only the record with the most recent Reporting_Day
2. WHEN multiple records have the same Production_Order_No and same Reporting_Day, THE Deduplication_Service SHALL keep only one record
3. WHEN removing duplicates, THE Deduplication_Service SHALL log the number of records removed for audit purposes
4. THE Deduplication_Service SHALL NOT modify or remove records with unique Production_Order_No values

### Requirement 3: Tích hợp vào quy trình import

**User Story:** As a system administrator, I want deduplication to happen automatically during data import, so that the dashboard always shows clean data without manual intervention.

#### Acceptance Criteria

1. WHEN a new dashboard file is uploaded, THE Data_Processor SHALL apply deduplication after parsing the file
2. WHEN deduplication is applied, THE Data_Processor SHALL first process the new file data, then deduplicate against existing data in the database
3. IF deduplication fails, THEN THE Data_Processor SHALL rollback the entire import and report the error
4. WHEN deduplication completes successfully, THE Data_Processor SHALL update the row_count to reflect the actual number of records stored

### Requirement 4: Xử lý dữ liệu hiện có

**User Story:** As a data analyst, I want to clean up existing duplicate data in the database, so that historical data is also accurate.

#### Acceptance Criteria

1. THE Deduplication_Service SHALL provide an API endpoint to trigger deduplication on existing data
2. WHEN triggered manually, THE Deduplication_Service SHALL process all records in Dashboard_Data table
3. WHEN processing existing data, THE Deduplication_Service SHALL return a summary including total records before, duplicates removed, and records remaining
4. WHILE deduplication is running on existing data, THE Dashboard_Data SHALL remain queryable (non-blocking operation)

### Requirement 5: Báo cáo và logging

**User Story:** As a system administrator, I want to see reports of deduplication activities, so that I can monitor data quality and troubleshoot issues.

#### Acceptance Criteria

1. WHEN deduplication runs, THE Deduplication_Service SHALL log start time, end time, and duration
2. WHEN duplicates are found, THE Deduplication_Service SHALL log the Production_Order_No values and their duplicate Reporting_Days
3. WHEN deduplication completes, THE Deduplication_Service SHALL return statistics including: original_count, duplicates_removed, final_count
4. IF no duplicates are found, THEN THE Deduplication_Service SHALL log "No duplicates found" and return zero for duplicates_removed

