# Professional Salesperson Profile Assessment System

ระบบประเมินนักขายมืออาชีพสำหรับนักเรียน โดยหน้า GitHub Pages ทำหน้าที่เป็นเว็บหลักและเชื่อมต่อระบบ Google Apps Script ที่ดูแลแบบประเมิน การคำนวณผล และฐานข้อมูล Google Sheets

## Web App backend

Google Apps Script Web App:

`https://script.google.com/macros/s/AKfycbw1vKFcrAEHBX7CVpYdDxtAkvc1SYB0WHivhOpC7RyIKk56TyhPRbw7nzLlLbGAdMVGQg/exec`

## ไฟล์หลัก

- `index.html` — หน้าเว็บไซต์หลัก
- `styles.css` — รูปแบบ Responsive สำหรับคอมพิวเตอร์ แท็บเล็ต และมือถือ
- `app.js` — การโหลดและรีเฟรช Google Apps Script Web App

## เปิด GitHub Pages

ไปที่ Repository **Settings → Pages** แล้วตั้งค่า:

- Source: **Deploy from a branch**
- Branch: **main**
- Folder: **/(root)**

จากนั้นเว็บไซต์จะอยู่ที่:

`https://theerawa21.github.io/Sales-Professional-Assessment-System/`

## หมายเหตุ

Google Apps Script ต้องอนุญาตให้แสดงใน iframe โดยใช้ `setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)` และ Web App ต้อง Deploy ให้กลุ่มผู้ใช้ที่ต้องการสามารถเข้าถึงได้

แบบประเมินนี้ใช้เพื่อการเรียนรู้และพัฒนาตนเอง ไม่ใช่การวินิจฉัยทางจิตวิทยาหรือทางคลินิก
