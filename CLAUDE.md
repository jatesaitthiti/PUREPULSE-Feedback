# PUREPULSE Feedback Project

## บริบท

โปรเจกต์รวบรวมและสรุป feedback จากผู้ทดสอบเจลพลังงาน PUREPULSE
- หน้าเว็บสรุป: `index.html` — pie chart 7 หัวข้อ คลิกได้ deploy บน GitHub Pages
- URL: https://jatesaitthiti.github.io/PUREPULSE-Feedback/

## ที่อยู่ไฟล์

- **Feedback ดิบ**: `~/Downloads/Feedback/` (รูปแชท + .m4a) — *ไม่ commit*
- **Repo นี้**: `index.html`, `Peerawit-transcript.md`

## คำสั่งหลัก

- `/update-feedback` — อ่าน feedback ใหม่ + อัปเดต index.html + push GitHub
- `git push origin main` — trigger GitHub Pages rebuild (~1-2 นาที)

## โครงสร้าง index.html

7 themes ใน array `themes`:
1. รสชาติ (purple)
2. เนื้อสัมผัส / Texture (red — ปัญหาหลัก)
3. พลังงาน / Energy (green — จุดแข็ง)
4. Use case / Timing (yellow)
5. GI / ปัญหาทางเดินอาหาร (orange — มี 1 เคส)
6. ความตั้งใจซื้อ (cyan)

แต่ละ theme มี: `name`, `value` (count), `color`, `desc`, `positives[]`, `problems[]`

## ข้อควรระวัง

- รูปแชทมีชื่อจริงผู้ทดสอบ — ระวังเรื่อง privacy ก่อน commit
- ถ้าเจอเคส allergy/GI severe → อัปเดต alert banner ทันที
- ไฟล์เสียงถอดในเครื่อง user (ผ่าน Apple Voice Memo) แล้ว screenshot มา
