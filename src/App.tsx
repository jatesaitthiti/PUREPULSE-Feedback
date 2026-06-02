import { useState } from "react"
import { Cell, Pie, PieChart } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { actionItems, testers, themes, type ActionItem } from "@/data"
import { cn } from "@/lib/utils"

const PROBLEM_COLOR = "#d94f4f"

const chartConfig = Object.fromEntries(
  themes.map((t) => [t.name, { label: t.name, color: t.color }]),
) satisfies ChartConfig

const pieData = themes.map((t) => ({ name: t.name, value: t.value, fill: t.color }))

const priorityStyles: Record<ActionItem["priority"], string> = {
  p0: "bg-red-100 text-red-700",
  p1: "bg-amber-100 text-amber-700",
  p2: "bg-emerald-100 text-emerald-700",
}

// รวบรวม quote ของแต่ละคนจาก themes (match จากชื่อใน field t — เหมือน logic เดิม)
function feedbackFor(name: string) {
  const out: { theme: string; color: string; type: "pos" | "neg"; q: string }[] = []
  themes.forEach((theme) => {
    theme.positives.forEach((p) => {
      if (p.t.includes(name)) out.push({ theme: theme.name, color: theme.color, type: "pos", q: p.q })
    })
    theme.problems.forEach((p) => {
      if (p.t.includes(name)) out.push({ theme: theme.name, color: theme.color, type: "neg", q: p.q })
    })
  })
  return out
}

function StatCard({ num, label, tone }: { num: number; label: string; tone?: "neg" | "pos" }) {
  return (
    <Card className="items-center gap-1.5 px-4 py-4 text-center">
      <div
        className={cn(
          "text-3xl font-bold leading-none",
          tone === "neg" && "text-[#d94f4f]",
          tone === "pos" && "text-[#2d9d5e]",
        )}
      >
        {num}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </Card>
  )
}

function Quote({ tester, text, color }: { tester: string; text: string; color: string }) {
  return (
    <div
      className="mb-1.5 rounded border-l-[3px] bg-[#f7f7f9] px-3 py-[7px] text-[13px] leading-relaxed text-[#3a3a4a]"
      style={{ borderLeftColor: color }}
    >
      <span className="mr-1.5 font-semibold text-[#1a1a2e]">{tester}:</span>
      {text}
    </div>
  )
}

function SectionTitle({
  tone,
  count,
  children,
}: {
  tone: "pos" | "neg"
  count: number
  children: React.ReactNode
}) {
  const color = tone === "pos" ? "#2d9d5e" : "#d94f4f"
  return (
    <div
      className="sticky top-0 z-[1] mt-4 mb-2 flex items-center gap-2 bg-card py-1 text-[11px] font-semibold tracking-wider uppercase first:mt-0"
      style={{ color }}
    >
      <span className="inline-block h-[7px] w-[7px] rounded-full" style={{ background: color }} />
      {children}
      <span className="ml-auto text-[11px] font-medium tracking-normal text-[#b0b0ba] normal-case">
        {count}
      </span>
    </div>
  )
}

function DetailPanel({ index }: { index: number }) {
  const t = themes[index]
  return (
    <Card className="flex max-h-[482px] flex-col gap-0 overflow-hidden p-6">
      <h2 className="mb-1 text-[19px] font-bold" style={{ color: t.color }}>
        {t.name}
      </h2>
      <div className="mb-3.5 text-[13px] leading-normal text-muted-foreground">{t.desc}</div>
      <div className="-mx-2 min-h-0 flex-1 overflow-y-auto px-2">
        <SectionTitle tone="pos" count={t.positives.length}>
          สิ่งที่ชอบ / จุดแข็ง
        </SectionTitle>
        {t.positives.length ? (
          t.positives.map((p, i) => <Quote key={i} tester={p.t} text={p.q} color={t.color} />)
        ) : (
          <div className="text-[13px] text-[#b0b0ba]">— ไม่มี —</div>
        )}
        <SectionTitle tone="neg" count={t.problems.length}>
          ปัญหา / ข้อกังวล
        </SectionTitle>
        {t.problems.length ? (
          t.problems.map((p, i) => <Quote key={i} tester={p.t} text={p.q} color={PROBLEM_COLOR} />)
        ) : (
          <div className="text-[13px] text-[#b0b0ba]">— ไม่มี —</div>
        )}
      </div>
    </Card>
  )
}

export default function App() {
  const [selected, setSelected] = useState(1) // เริ่มที่ Texture เหมือนเดิม
  const [selectedTester, setSelectedTester] = useState<number | null>(null)

  const tester = selectedTester !== null ? testers[selectedTester] : null
  const testerItems = tester ? feedbackFor(tester.name) : []

  return (
    <div className="mx-auto min-h-screen max-w-[1100px] px-6 py-12 text-[#1a1a2e]">
      <header className="mb-9">
        <h1 className="mb-1.5 text-[26px] font-bold tracking-tight">
          PUREPULSE Energy Gel — Feedback Summary
        </h1>
        <div className="text-sm text-muted-foreground">
          21 ผู้ทดสอบ · แชท 38 รูป + เสียง/วิดีโอ · คลิกที่กราฟเพื่อดูรายละเอียดและปัญหา
        </div>
      </header>

      <div className="mb-6 rounded-[10px] border border-[#f0c8a0] bg-white px-[18px] py-3.5 text-sm leading-relaxed text-[#7a5c30]">
        ⚠️ <strong>GI Alert — K.Mai:</strong> ปวดท้องมวน/คลื่นไส้/อ้วก หลังวิ่ง 8 km (กินเจลก่อนวิ่ง
        &lt;10 นาที) — ปกติกิน Amino vital ไม่เป็น ไม่ใช่อาการแพ้ คาดว่า timing + ย่อยยาก → รอทดลองรอบ
        2 กินก่อน 20 นาที
      </div>

      <div className="mb-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard num={21} label="ผู้ทดสอบ" />
        <StatCard num={3} label="ถามว่าขายเมื่อไหร่" />
        <StatCard num={14} label="พูดถึง texture หนืด" tone="neg" />
        <StatCard num={15} label="พลังงานเสถียร" tone="pos" />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Card className="p-6">
          <ChartContainer config={chartConfig} className="h-[400px] max-h-[50vh] w-full">
            <PieChart>
              <ChartTooltip
                content={<ChartTooltipContent nameKey="name" formatter={(value) => `${value} คน`} />}
              />
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius="55%"
                paddingAngle={2}
                strokeWidth={3}
                stroke="#fff"
                onClick={(_, index) => setSelected(index)}
                className="cursor-pointer focus:outline-none"
              >
                {pieData.map((entry, i) => (
                  <Cell
                    key={entry.name}
                    fill={entry.fill}
                    opacity={i === selected ? 1 : 0.82}
                    className="cursor-pointer focus:outline-none"
                  />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="mt-3.5 flex flex-wrap justify-center gap-x-4 gap-y-2">
            {themes.map((t, i) => (
              <button
                key={t.name}
                onClick={() => setSelected(i)}
                className={cn(
                  "flex items-center gap-1.5 text-[13px] font-medium transition-opacity",
                  i === selected ? "opacity-100" : "opacity-55 hover:opacity-100",
                )}
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: t.color }}
                />
                {t.name}
              </button>
            ))}
          </div>
        </Card>

        <DetailPanel index={selected} />
      </div>

      <Card className="mt-5 gap-0 p-6">
        <h2 className="mb-2 text-lg font-bold">Action Items</h2>
        {actionItems.map((item, i) => (
          <div
            key={i}
            className="flex items-start gap-2.5 border-b border-[#f0f0f3] py-2.5 text-sm leading-relaxed text-[#3a3a4a] last:border-b-0"
          >
            <Badge
              className={cn(
                "shrink-0 rounded px-2 py-0.5 text-[11px] font-semibold uppercase",
                priorityStyles[item.priority],
              )}
            >
              {item.priority}
            </Badge>
            <span>
              {item.text}
              {item.isNew && (
                <Badge className="ml-1.5 rounded bg-[#e8f0fe] px-2 py-0.5 text-[11px] font-semibold text-[#3565b0]">
                  NEW
                </Badge>
              )}
            </span>
          </div>
        ))}
      </Card>

      <Card className="mt-5 gap-0 p-6">
        <h2 className="mb-1 text-lg font-bold">Athletes</h2>
        <div className="mb-3.5 text-[13px] text-muted-foreground">
          {testers.length} คน · คลิกชื่อเพื่อดู feedback · 🆕 = เพิ่มล่าสุด
        </div>
        <div className="flex flex-wrap gap-2">
          {testers.map((p, i) => {
            const isSel = selectedTester === i
            return (
              <button
                key={p.name}
                onClick={() => setSelectedTester(isSel ? null : i)}
                className={cn(
                  "inline-flex items-baseline gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
                  isSel
                    ? "border-[#1a1a2e] bg-[#1a1a2e] text-white"
                    : p.new
                      ? "border-[#d2e0fb] bg-[#e8f0fe] text-[#2f5aa8] hover:border-[#c4c4d0]"
                      : "border-[#e8e8ee] bg-[#f4f4f7] text-[#2a2a3a] hover:border-[#c4c4d0]",
                )}
              >
                {p.new ? "🆕 " : ""}
                {p.name}
                {p.tag && (
                  <span
                    className={cn(
                      "text-[11px] font-medium",
                      isSel ? "text-[#b8b8c8]" : p.new ? "text-[#6f8fce]" : "text-[#9a9aa8]",
                    )}
                  >
                    {p.tag}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {tester && (
          <div className="mt-[18px] border-t border-[#f0f0f3] pt-[18px]">
            <div className="mb-3 flex items-baseline gap-2 text-base font-bold text-[#1a1a2e]">
              {tester.new ? "🆕 " : ""}
              {tester.name}
              {tester.tag && <span className="text-xs font-medium text-[#9a9aa8]">{tester.tag}</span>}
              <span className="text-xs font-medium text-[#9a9aa8]">
                · {testerItems.length} ความเห็น
              </span>
            </div>
            {testerItems.length ? (
              testerItems.map((it, i) => (
                <div
                  key={i}
                  className="mb-1.5 flex items-start gap-2.5 rounded border-l-[3px] bg-[#f7f7f9] px-3 py-2 text-[13px] leading-normal text-[#3a3a4a]"
                  style={{ borderLeftColor: it.color }}
                >
                  <span
                    className="shrink-0 pt-px text-[11px] font-semibold whitespace-nowrap"
                    style={{ color: it.color }}
                  >
                    {it.theme}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 font-bold",
                      it.type === "pos" ? "text-[#2d9d5e]" : "text-[#d94f4f]",
                    )}
                  >
                    {it.type === "pos" ? "＋" : "－"}
                  </span>
                  <span>{it.q}</span>
                </div>
              ))
            ) : (
              <div className="text-[13px] text-[#b0b0ba]">— ยังไม่มี feedback ที่บันทึก —</div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
