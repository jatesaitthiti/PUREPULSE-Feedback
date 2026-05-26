---
description: อ่าน feedback ใหม่จาก ~/Downloads/Feedback + อัปเดต index.html + push GitHub
argument-hint: "[optional: เพิ่ม note อะไรเฉพาะรอบนี้]"
---

# Update PUREPULSE Feedback Summary

## บริบท

ไฟล์ feedback ดิบ (รูปแชท + เสียง) เก็บที่ `~/Downloads/Feedback/`
- รูปแชท: `*.jpg` หรือ `*.png` — ผู้ทดสอบรีวิวเจล PUREPULSE
- เสียง: `*.m4a` — ผู้ทดสอบพูดรีวิว
- Screenshot ถอดเสียง: `Screenshot*.png` — กรณีถอดเสียงเองมาแล้ว

หน้าเว็บสรุปอยู่ที่ `./index.html` — pie chart 7 หัวข้อ คลิกได้
- รสชาติ · เนื้อสัมผัส · พลังงาน · Use case/Timing · GI · ความตั้งใจซื้อ

## งานที่ต้องทำ

1. **ตรวจไฟล์ใหม่** — เทียบกับที่ระบุใน `index.html` ปัจจุบัน หาว่ามีรูป/เสียงไหนที่ยังไม่ได้สรุป
2. **อ่าน + สรุป** — ใช้ Read tool อ่านรูปทีละไฟล์, ถ้าเป็น .m4a บอก user ให้ถอดเสียงมาให้ (sandbox ถอดไม่ได้)
3. **อัปเดต `index.html`**:
   - เพิ่ม tester ใหม่ในแต่ละหัวข้อพร้อม quote (ใช้ 🆕 badge)
   - อัปเดต `<header>` subtitle: "N ผู้ทดสอบ · M รูป + เสียง"
   - อัปเดต `.stats` ทุกตัวให้ตรงกับยอดใหม่
   - ถ้ามีประเด็นใหม่ในหัวข้อใด อัปเดต `.desc` ของ theme นั้น
   - ถ้า severity เปลี่ยน อัปเดต `.alert-banner` ด้านบน
   - ถ้ามี action ใหม่ เพิ่ม `<div class="action-item">` พร้อม badge P0/P1/P2 และ NEW
4. **Verify** — เปิด `index.html` ดูใน browser preview (หรือใช้ Bash `python3 -m http.server` แล้วเปิดดู)
5. **Commit + push**:
   ```bash
   git add index.html Peerawit-transcript.md  # ไฟล์อื่นๆ ที่อัปเดต
   git commit -m "feat: update feedback summary ($(date +%Y-%m-%d))"
   git push origin main
   ```
6. **รายงาน** — บอก user ว่า:
   - เพิ่ม tester อะไรไปบ้าง
   - มีประเด็นใหม่อะไรไหม
   - URL ที่จะอัปเดตใน ~2 นาที: https://jatesaitthiti.github.io/PUREPULSE-Feedback/

## ⚠️ ข้อควรระวัง

- **ห้าม commit รูปต้นฉบับ** จาก `~/Downloads/Feedback/` — ถูก `.gitignore` ไว้แล้ว ถ้า user เพิ่งวางมาที่นี่ ให้ย้ายไปที่อื่น
- ถ้าเจอชื่อจริงในรูป → ตัดสินใจร่วมกับ user ว่าจะใช้ชื่อจริงหรือ anonymize
- ถ้าเจอเคสที่อ่อนไหว (เช่น GI side effect, allergy) → flag เป็น Alert banner

## Optional argument

$ARGUMENTS ถ้า user ใส่มา ให้ใช้เป็นบริบทเพิ่มเติม (เช่น "เน้นเคสใหม่ที่ปวดท้อง")
