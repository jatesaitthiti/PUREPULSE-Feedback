# PUREPULSE Feedback Project

## บริบท

โปรเจกต์รวบรวมและสรุป feedback จากผู้ทดสอบเจลพลังงาน PUREPULSE
- เว็บแอป dashboard: doughnut chart 6 หัวข้อ คลิกได้ + รายชื่อ athletes คลิกดู feedback รายคน
- URL: https://jatesaitthiti.github.io/PUREPULSE-Feedback/

## Stack

Vite + React + TypeScript + Tailwind v4 + shadcn/ui (migrate จาก vanilla HTML แล้ว)
- Chart: shadcn chart (Recharts) — doughnut คลิกเลือก theme
- Components: Card, Badge, Chart (`src/components/ui/`)
- Deploy: GitHub Actions (`.github/workflows/deploy.yml`) build → GitHub Pages
  - ⚠️ Pages source ต้องตั้งเป็น **"GitHub Actions"** ใน repo Settings → Pages
- `base: '/PUREPULSE-Feedback/'` ใน `vite.config.ts` (จำเป็นสำหรับ project site)

## ที่อยู่ไฟล์

- **ข้อมูล feedback**: `src/data.ts` — array `themes`, `testers`, `actionItems`
- **UI**: `src/App.tsx` (header, alert banner, stats, chart, detail, action items, athletes)
- **Feedback ดิบ**: `Feedback/` (ในโปรเจกต์ · รูปแชท + .m4a + .mp4 + transcript .txt) — *gitignore ไว้แล้ว ห้าม commit*

## คำสั่งหลัก

- `/update-feedback` — อ่าน feedback ใหม่ + อัปเดต `src/data.ts` + push GitHub
- `npm run dev` — dev server (localhost)
- `npm run build` — build (tsc + vite) → `dist/`
- `git push origin main` — trigger GitHub Actions deploy (~1-2 นาที)

## โครงสร้างข้อมูล (src/data.ts)

6 themes ใน array `themes`:
1. รสชาติ (purple #7c6bbf)
2. เนื้อสัมผัส / Texture (red #d94f4f — ปัญหาหลัก)
3. พลังงาน / Energy (green #2d9d5e — จุดแข็ง)
4. Use case / Timing (yellow #c9952c)
5. GI / ปัญหาทางเดินอาหาร (orange #d97a3e)
6. ความตั้งใจซื้อ (cyan #2a8fa4)

แต่ละ theme มี: `name`, `value` (count), `color`, `desc`, `positives[]`, `problems[]`
แต่ละ quote: `{ t: ชื่อ, q: ข้อความ }` — ใส่ 🆕 ในชื่อ `t` ถ้าเป็นคนใหม่ (logic จับชื่อด้วย `includes`)

## Tab การทดสอบ (`ROUNDS` ใน App.tsx)

- **ครั้งที่ 1 / 2** — `kind: "themes"` ใช้ `<Dashboard>` (radar 6 หมวด + Athletes)
- **ครั้งที่ 3** — `kind: "viscosity"` ใช้ `<ViscosityBoard>` — UI คนละแบบ: โหวตเลือกความหนืด **75% vs 50%** (1 คนเลือกได้ 1 ความหนืด)
  - ข้อมูล: `viscosityOptions` (นิยาม 2 สูตร) + `viscosityVotes` (`{ name, choice: "75"|"50", tag?, reason?, note?, new? }`) + `actionItems3`
  - ชื่อซ้ำใน `viscosityVotes` → UI ขึ้น banner แดงเตือน (กันนับซ้ำ)

เพิ่มรอบใหม่ = ต่อ entry ท้าย array `ROUNDS` (tab/subtitle/badge ขึ้นเอง)

## ข้อควรระวัง

- รูปแชทมีชื่อจริงผู้ทดสอบ — ระวังเรื่อง privacy ก่อน commit
- ถ้าเจอเคส allergy/GI severe → อัปเดต alert banner ใน `App.tsx` ทันที
- ไฟล์เสียงถอดในเครื่อง user (ผ่าน Apple Voice Memo) แล้ว screenshot มา
- ห้าม commit `dist/` / `node_modules/` (gitignore แล้ว)
