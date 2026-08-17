# Professional Salesperson Profile Assessment System

ระบบประเมินนักขายมืออาชีพสำหรับนักเรียน โดยใช้ GitHub Pages เป็นหน้าเว็บหลัก และใช้ Google Apps Script เป็น Backend API เชื่อมกับ Google Sheets

## Frontend

GitHub Pages:

`https://theerawa21.github.io/Sales-Professional-Assessment-System/`

## Backend API

Google Apps Script Web App:

`https://script.google.com/macros/s/AKfycbz3Ai2moAPd5l3fdHiEhni6XnxfKPfMQ8UrQHPWO9T8SHV7SzCpS_n4VZz8oIdQ83hrxQ/exec`

## โครงสร้างไฟล์

- `index.html` — หน้าแบบประเมิน ผลรายบุคคล และหน้าสำหรับครู
- `styles.css` — รูปแบบ Responsive สำหรับคอมพิวเตอร์ แท็บเล็ต และมือถือ
- `app.js` — เชื่อมต่อ Apps Script API, ค้นหานักเรียน, โหลดคำถาม, บันทึกผล และ Dashboard

## API ที่หน้าเว็บเรียกใช้

### GET

- `?action=ping` ตรวจสอบสถานะ API
- `?action=questions` โหลดคำถาม
- `?action=studentSearch&q=...` ค้นหารายชื่อนักเรียน
- `?action=student&id=...` ค้นหานักเรียนจากรหัส

### POST

- `{ action: "submit", studentId, answers }` บันทึกแบบประเมินและรับผลรายบุคคล
- `{ action: "dashboard", pin, className }` โหลด Dashboard สำหรับครู

## Google Sheets

ระบบใช้ชีตหลัก ได้แก่

- `Students` ฐานรายชื่อนักเรียน
- `Questions` คำถาม 30 ข้อ
- `Responses` เก็บคำตอบและผลการประเมิน
- `Profiles` ข้อมูลสำหรับอ้างอิงรูปแบบนักขาย
- `Dashboard` สรุปข้อมูลใน Google Sheet

## หมายเหตุ

Google Apps Script ฝั่ง Backend ใช้เพียง `Code.gs` ไม่ต้องมี `Index.html` ใน Apps Script เพราะหน้าเว็บทั้งหมดอยู่บน GitHub Pages

แบบประเมินนี้ใช้เพื่อการเรียนรู้และพัฒนาตนเอง ไม่ใช่การวินิจฉัยทางจิตวิทยาหรือทางคลินิก
