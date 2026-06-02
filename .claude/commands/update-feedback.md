---
description: อ่าน feedback ใหม่จาก ~/Downloads/Feedback + อัปเดต src/data.ts + push GitHub
argument-hint: "[optional: เพิ่ม note อะไรเฉพาะรอบนี้]"
---

# Update PUREPULSE Feedback Summary

## บริบท

ไฟล์ feedback ดิบ (รูปแชท + เสียง) เก็บที่ `~/Downloads/Feedback/`
- รูปแชท: `*.jpg` หรือ `*.png` — ผู้ทดสอบรีวิวเจล PUREPULSE
- เสียง: `*.m4a` — ผู้ทดสอบพูดรีวิว
- Screenshot ถอดเสียง: `Screenshot*.png` — กรณีถอดเสียงเองมาแล้ว

**Stack:** Vite + React + TypeScript + Tailwind + shadcn/ui (เปลี่ยนจาก vanilla HTML แล้ว)
- ข้อมูลทั้งหมดอยู่ใน `src/data.ts` — array `themes`, `testers`, `actionItems`
- UI อยู่ใน `src/App.tsx` (alert banner + stats cards อยู่ในนี้)
- 6 หัวข้อ: รสชาติ · เนื้อสัมผัส · พลังงาน · Use case/Timing · GI · ความตั้งใจซื้อ

## งานที่ต้องทำ

1. **ตรวจไฟล์ใหม่** — เทียบกับที่ระบุใน `src/data.ts` ปัจจุบัน หาว่ามีรูป/เสียงไหนที่ยังไม่ได้สรุป
2. **อ่าน + สรุป** — ใช้ Read tool อ่านรูปทีละไฟล์, ถ้าเป็น .m4a บอก user ให้ถอดเสียงมาให้ (sandbox ถอดไม่ได้)
3. **อัปเดต `src/data.ts`**:
   - เพิ่ม tester ใหม่ใน array `testers` (ใส่ `new: true` + `tag` ถ้ามี)
   - เพิ่ม quote ในแต่ละ theme (`positives` / `problems`) — ใส่ 🆕 ในชื่อ field `t` ตามแบบเดิม
   - ถ้ามีประเด็นใหม่ในหัวข้อใด อัปเดต `desc` + `value` (count) ของ theme นั้น
   - ถ้ามี action ใหม่ เพิ่มใน array `actionItems` (`priority: "p0"|"p1"|"p2"`, `isNew: true`)
4. **อัปเดต `src/App.tsx`** ถ้าจำเป็น:
   - subtitle ใน `<header>`: "N ผู้ทดสอบ · M รูป + เสียง"
   - 4 `<StatCard>` ให้ตรงกับยอดใหม่
   - ถ้า severity เปลี่ยน อัปเดต alert banner (div ที่มี "⚠️ GI Alert")
5. **Verify** — `npm run build` ต้องผ่าน (ดูว่า tsc ไม่ error) แล้ว `npm run dev` เปิดดูใน browser
6. **Commit + push**:
   ```bash
   git add -A
   git commit -m "feat: update feedback summary ($(date +%Y-%m-%d))"
   git push origin main
   ```
   GitHub Actions (`.github/workflows/deploy.yml`) จะ build + deploy ให้อัตโนมัติ
7. **รายงาน** — บอก user ว่า:
   - เพิ่ม tester อะไรไปบ้าง
   - มีประเด็นใหม่อะไรไหม
   - URL ที่จะอัปเดตใน ~1-2 นาที (หลัง Actions เสร็จ): https://jatesaitthiti.github.io/PUREPULSE-Feedback/

## ⚠️ ข้อควรระวัง

- **ห้าม commit รูปต้นฉบับ** จาก `~/Downloads/Feedback/` — ถูก `.gitignore` ไว้แล้ว ถ้า user เพิ่งวางมาที่นี่ ให้ย้ายไปที่อื่น
- ถ้าเจอชื่อจริงในรูป → ตัดสินใจร่วมกับ user ว่าจะใช้ชื่อจริงหรือ anonymize
- ถ้าเจอเคสที่อ่อนไหว (เช่น GI side effect, allergy) → flag เป็น Alert banner
- **ห้าม commit `dist/` หรือ `node_modules/`** — gitignore ไว้แล้ว (deploy ผ่าน Actions)

## Optional argument

$ARGUMENTS ถ้า user ใส่มา ให้ใช้เป็นบริบทเพิ่มเติม (เช่น "เน้นเคสใหม่ที่ปวดท้อง")
