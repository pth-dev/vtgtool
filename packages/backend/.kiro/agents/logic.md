cải thiện quy trình :

file có các cột Reporting day, Customer,Production Order No.,Product,Status,Remark,Category,Root cause,Improvement plan,Currrent status,Production No
=> đây là 1 file chứa các đơn hàng có tình trạng đơn lock hold failed trong nhà máy , tôi cần  data visualization nguồn data này với các logic sau :
- tổng đơn băng sum Production No - là 1 kpi card
- ti lệ resume đơn được tính là tổng đơn có Currrent status khác cancelled / tổng đơn hàng
- ti lệ failed đơn được tính bằng 1 - tỉ lệ resume
- Category nào có % cao nhất 
- Khách hàng nào có % cao nhất 
các chart cần có là:
- sự so sánh giữa các khách hàng theo % 
- trend của 3 status trong tháng 
- sự so sánh phần category
- root cause là gì , improment plan là gì 
các slicer để lọc dữ liệu 
phải tương tác được với các chart khi click và 1 cột thì cả dashboard cũng đổi nghiên cứu power bi để xem các chức năng tương tác với chart 
chuột phải vào bảng để có thể hiện các option như hiển thị bảng data đẻ so sánh 
