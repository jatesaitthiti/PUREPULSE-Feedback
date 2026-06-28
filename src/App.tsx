import { useState } from "react"
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart } from "recharts"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  actionItems,
  actionItems2,
  testers,
  testers2,
  themes,
  themes2,
  type ActionItem,
  type Theme,
  type Tester,
} from "@/data"
import { cn } from "@/lib/utils"

// accent ปรับให้คอนทราสต์พออ่านบนพื้นสว่าง (light theme)
const POSITIVE_COLOR = "#10b981"
const PROBLEM_COLOR = "#ef4444"
const TICK_MUTED = "#71717a"
const GRID_STROKE = "rgba(0,0,0,0.10)"

// radar 2 series: ชอบ/จุดแข็ง vs ปัญหา/จุดอ่อน นับจากจำนวน quote ต่อหมวด
const chartConfig = {
  positives: { label: "ชอบ / จุดแข็ง", color: POSITIVE_COLOR },
  problems: { label: "ปัญหา / จุดอ่อน", color: PROBLEM_COLOR },
} satisfies ChartConfig

const priorityStyles: Record<ActionItem["priority"], string> = {
  p0: "bg-red-500/15 text-red-700",
  p1: "bg-amber-500/15 text-amber-700",
  p2: "bg-emerald-500/15 text-emerald-700",
}

// รวบรวม quote ของแต่ละคนจาก themes (match จากชื่อใน field t — เหมือน logic เดิม)
function feedbackFor(themeList: Theme[], name: string) {
  const out: { theme: string; color: string; type: "pos" | "neg"; q: string }[] = []
  themeList.forEach((theme) => {
    theme.positives.forEach((p) => {
      if (p.t.includes(name)) out.push({ theme: theme.name, color: theme.color, type: "pos", q: p.q })
    })
    theme.problems.forEach((p) => {
      if (p.t.includes(name)) out.push({ theme: theme.name, color: theme.color, type: "neg", q: p.q })
    })
  })
  return out
}

function StatCard({
  num,
  label,
  tone,
  onClick,
}: {
  num: number
  label: string
  tone?: "neg" | "pos"
  onClick?: () => void
}) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "items-center gap-1.5 px-4 py-4 text-center",
        onClick && "cursor-pointer transition-colors hover:bg-accent/40",
      )}
    >
      <div
        className={cn(
          "text-3xl font-bold leading-none text-foreground",
          tone === "neg" && "text-[#ef4444]",
          tone === "pos" && "text-[#10b981]",
        )}
      >
        {num}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </Card>
  )
}

function SplitStatCard({
  label,
  pos,
  neg,
  color,
  selected,
  onClick,
}: {
  label: string
  pos: number
  neg: number
  color: string
  selected?: boolean
  onClick?: () => void
}) {
  return (
    <Card
      onClick={onClick}
      style={selected ? { borderColor: color, boxShadow: `0 0 0 1px ${color}` } : undefined}
      className="cursor-pointer items-center gap-1.5 px-4 py-4 text-center transition-colors hover:bg-accent/40"
    >
      <div className="flex items-baseline justify-center gap-1.5 leading-none">
        <span className="text-3xl font-bold text-[#10b981]">{pos}</span>
        <span className="text-lg text-muted-foreground/60">/</span>
        <span className="text-3xl font-bold text-[#ef4444]">{neg}</span>
      </div>
      <div
        className="text-xs font-medium text-muted-foreground"
        style={selected ? { color } : undefined}
      >
        {label}
      </div>
      <div className="text-[10px] text-muted-foreground/60">บวก / ลบ</div>
    </Card>
  )
}

function Quote({ tester, text, color }: { tester: string; text: string; color: string }) {
  return (
    <div
      className="mb-1.5 rounded border-l-[3px] bg-muted px-3 py-[7px] text-[13px] leading-relaxed text-foreground/80"
      style={{ borderLeftColor: color }}
    >
      <span className="mr-1.5 font-semibold text-foreground">{tester}:</span>
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
  const color = tone === "pos" ? POSITIVE_COLOR : PROBLEM_COLOR
  return (
    <div
      className="sticky top-0 z-[1] mt-4 mb-2 flex items-center gap-2 bg-card py-1 text-[11px] font-semibold tracking-wider uppercase first:mt-0"
      style={{ color }}
    >
      <span className="inline-block h-[7px] w-[7px] rounded-full" style={{ background: color }} />
      {children}
      <span className="ml-auto text-[11px] font-medium tracking-normal text-muted-foreground normal-case">
        {count}
      </span>
    </div>
  )
}

// label รอบ radar — คลิกเลือก theme + ไฮไลต์ตัวที่เลือกด้วยสีของ theme นั้น
// (props จาก recharts render prop เป็น any — รับ selected/onSelect/drivers เพิ่มเอง)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AngleTick(props: any) {
  const { x, y, textAnchor, index, payload } = props
  const selected = props.selected as number
  const onSelect = props.onSelect as (i: number) => void
  const drivers = props.drivers as Theme[]
  const isSel = index === selected
  // ชื่อหมวดยาว (มีวงเล็บอังกฤษ) → แยกเป็น 2 บรรทัด ไทย / (English) กันล้นแกน radar
  const [thai, ...rest] = String(payload.value).split(" (")
  const eng = rest.length ? `(${rest.join(" (")}` : null
  return (
    <text
      x={x}
      y={y}
      textAnchor={textAnchor}
      dominantBaseline="central"
      onClick={() => onSelect(index)}
      className="cursor-pointer select-none"
      fill={isSel ? drivers[index].color : TICK_MUTED}
      fontSize={12}
      fontWeight={isSel ? 700 : 500}
    >
      {eng ? (
        <>
          <tspan x={x} dy="-0.35em">
            {thai}
          </tspan>
          <tspan x={x} dy="1.15em">
            {eng}
          </tspan>
        </>
      ) : (
        payload.value
      )}
    </text>
  )
}

function DetailPanel({ drivers, index }: { drivers: Theme[]; index: number }) {
  const t = drivers[index]
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
          <div className="text-[13px] text-muted-foreground">— ไม่มี —</div>
        )}
        <SectionTitle tone="neg" count={t.problems.length}>
          ปัญหา / ข้อกังวล
        </SectionTitle>
        {t.problems.length ? (
          t.problems.map((p, i) => <Quote key={i} tester={p.t} text={p.q} color={PROBLEM_COLOR} />)
        ) : (
          <div className="text-[13px] text-muted-foreground">— ไม่มี —</div>
        )}
      </div>
    </Card>
  )
}

// Dashboard เต็มของหนึ่งรอบการทดสอบ — รับชุดข้อมูล (themes/testers/actionItems) ของรอบนั้น
function Dashboard({
  themes: themeList,
  testers: testerList,
  actionItems: actionList,
}: {
  themes: Theme[]
  testers: Tester[]
  actionItems: ActionItem[]
}) {
  // แกน radar = เฉพาะ 3 หมวดหลัก (รสชาติ / Texture / พลังงาน) — หมวดอื่นเซ็ต onRadar:false ใน data
  const drivers = themeList.filter((t) => t.onRadar !== false)
  // ค่าบนแกน = จำนวนคนที่พูดถึงเชิงบวก / เชิงลบ ในแต่ละหมวด (ผูกกับ count ตรง ๆ)
  const radarData = drivers.map((t) => ({
    name: t.name,
    positives: t.positives.length,
    problems: t.problems.length,
  }))
  const radarMax = Math.max(1, ...radarData.flatMap((d) => [d.positives, d.problems]))

  const byName = (s: string) => drivers.find((t) => t.name.includes(s))!
  const tasteTheme = byName("รสชาติ")
  const textureTheme = byName("Texture")
  const energyTheme = byName("Energy")
  const tasteIdx = drivers.indexOf(tasteTheme)
  const textureIdx = drivers.indexOf(textureTheme)
  const energyIdx = drivers.indexOf(energyTheme)

  const [selected, setSelected] = useState(textureIdx >= 0 ? textureIdx : 0)
  const [selectedTester, setSelectedTester] = useState<number | null>(null)

  const tester = selectedTester !== null ? testerList[selectedTester] : null
  const testerItems = tester ? feedbackFor(themeList, tester.name) : []

  return (
    <>
      <div className="mb-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          num={testerList.length}
          label="ผู้ทดสอบ (Athletes)"
          onClick={() =>
            document.getElementById("athletes")?.scrollIntoView({ behavior: "smooth" })
          }
        />
        <SplitStatCard
          label={tasteTheme.name}
          pos={tasteTheme.positives.length}
          neg={tasteTheme.problems.length}
          color={tasteTheme.color}
          selected={selected === tasteIdx}
          onClick={() => setSelected(tasteIdx)}
        />
        <SplitStatCard
          label={textureTheme.name}
          pos={textureTheme.positives.length}
          neg={textureTheme.problems.length}
          color={textureTheme.color}
          selected={selected === textureIdx}
          onClick={() => setSelected(textureIdx)}
        />
        <SplitStatCard
          label={energyTheme.name}
          pos={energyTheme.positives.length}
          neg={energyTheme.problems.length}
          color={energyTheme.color}
          selected={selected === energyIdx}
          onClick={() => setSelected(energyIdx)}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Card className="p-6">
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square h-[400px] max-h-[50vh] w-full"
          >
            <RadarChart data={radarData} outerRadius="68%">
              <ChartTooltip
                content={<ChartTooltipContent formatter={(value, name) => (
                  <span className="flex w-full items-center justify-between gap-3">
                    <span className="text-muted-foreground">{chartConfig[name as keyof typeof chartConfig].label}</span>
                    <span className="font-mono font-medium tabular-nums text-foreground">{value} คน</span>
                  </span>
                )} />}
              />
              <PolarGrid stroke={GRID_STROKE} />
              <PolarAngleAxis
                dataKey="name"
                tick={(props) => (
                  <AngleTick {...props} selected={selected} onSelect={setSelected} drivers={drivers} />
                )}
              />
              <PolarRadiusAxis
                domain={[0, radarMax]}
                tickCount={4}
                tick={{ fill: TICK_MUTED, fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <Radar
                dataKey="positives"
                stroke={POSITIVE_COLOR}
                fill={POSITIVE_COLOR}
                fillOpacity={0.18}
                strokeWidth={2}
                dot={{ r: 3, fill: POSITIVE_COLOR, fillOpacity: 1, strokeWidth: 0 }}
                isAnimationActive={false}
              />
              <Radar
                dataKey="problems"
                stroke={PROBLEM_COLOR}
                fill={PROBLEM_COLOR}
                fillOpacity={0.18}
                strokeWidth={2}
                dot={{ r: 3, fill: PROBLEM_COLOR, fillOpacity: 1, strokeWidth: 0 }}
                isAnimationActive={false}
              />
              <ChartLegend content={<ChartLegendContent />} />
            </RadarChart>
          </ChartContainer>
          <div className="mt-1 text-center text-[12px] text-muted-foreground">
            ค่าบนแกน = จำนวนคนที่พูดถึงในหมวดนั้น (เชิงบวก / เชิงลบ) · คลิกชื่อหมวดเพื่อดูรายละเอียด
          </div>
        </Card>

        <DetailPanel drivers={drivers} index={selected} />
      </div>

      <Card className="mt-5 gap-0 p-6">
        <h2 className="mb-2 text-lg font-bold">Action Items</h2>
        {actionList.map((item, i) => (
          <div
            key={i}
            className="flex items-start gap-2.5 border-b border-border py-2.5 text-sm leading-relaxed text-foreground/85 last:border-b-0"
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
                <Badge className="ml-1.5 rounded bg-blue-500/15 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                  NEW
                </Badge>
              )}
            </span>
          </div>
        ))}
      </Card>

      <Card id="athletes" className="mt-5 scroll-mt-6 gap-0 p-6">
        <h2 className="mb-1 text-lg font-bold">Athletes</h2>
        <div className="mb-3.5 text-[13px] text-muted-foreground">
          {testerList.length} คน · คลิกชื่อเพื่อดู feedback · 🆕 = เพิ่มล่าสุด
        </div>
        <div className="flex flex-wrap gap-2">
          {testerList.map((p, i) => {
            const isSel = selectedTester === i
            return (
              <button
                key={p.name}
                onClick={() => setSelectedTester(isSel ? null : i)}
                className={cn(
                  "inline-flex items-baseline gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
                  isSel
                    ? "border-primary bg-primary text-primary-foreground"
                    : p.new
                      ? "border-blue-500/40 bg-blue-500/10 text-blue-700 hover:border-blue-500/60"
                      : "border-border bg-muted text-foreground hover:border-muted-foreground/40",
                )}
              >
                {p.new ? "🆕 " : ""}
                {p.name}
                {p.tag && (
                  <span
                    className={cn(
                      "text-[11px] font-medium",
                      isSel
                        ? "text-primary-foreground/70"
                        : p.new
                          ? "text-blue-700/70"
                          : "text-muted-foreground",
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
          <div className="mt-[18px] border-t border-border pt-[18px]">
            <div className="mb-3 flex items-baseline gap-2 text-base font-bold text-foreground">
              {tester.new ? "🆕 " : ""}
              {tester.name}
              {tester.tag && (
                <span className="text-xs font-medium text-muted-foreground">{tester.tag}</span>
              )}
              <span className="text-xs font-medium text-muted-foreground">
                · {testerItems.length} ความเห็น
              </span>
            </div>
            {testerItems.length ? (
              testerItems.map((it, i) => (
                <div
                  key={i}
                  className="mb-1.5 flex items-start gap-2.5 rounded border-l-[3px] bg-muted px-3 py-2 text-[13px] leading-normal text-foreground/85"
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
                      it.type === "pos" ? "text-[#10b981]" : "text-[#ef4444]",
                    )}
                  >
                    {it.type === "pos" ? "＋" : "－"}
                  </span>
                  <span>{it.q}</span>
                </div>
              ))
            ) : (
              <div className="text-[13px] text-muted-foreground">— ยังไม่มี feedback ที่บันทึก —</div>
            )}

            {tester.originalFeedback && (
              <div className="mt-5">
                <div className="mb-2 flex items-baseline gap-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                  <span className="inline-block h-[7px] w-[7px] rounded-full bg-muted-foreground/60" />
                  Original Feedback
                </div>
                {tester.originalSource && (
                  <div className="mb-2 text-[12px] text-muted-foreground">{tester.originalSource}</div>
                )}
                <div className="rounded border border-border bg-muted/40 px-4 py-3 text-[13px] leading-relaxed whitespace-pre-line text-foreground/80">
                  {tester.originalFeedback}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </>
  )
}

export default function App() {
  const [tab, setTab] = useState(0) // 0 = การทดสอบครั้งที่ 1 · 1 = ครั้งที่ 2 (รอบปรับสูตรใหม่)

  return (
    <div className="mx-auto min-h-screen max-w-[1100px] px-6 py-12">
      <header className="mb-9">
        <h1 className="mb-1.5 text-[26px] font-bold tracking-tight">
          PUREPULSE Energy Gel — Feedback Summary
        </h1>
        <div className="text-sm text-muted-foreground">
          {tab === 0
            ? "38 ผู้ทดสอบ · แชท 64 รูป + เสียง/วิดีโอ · คลิกที่กราฟเพื่อดูรายละเอียดและปัญหา"
            : `รอบปรับสูตรใหม่ (ลดความหนืด / ให้ลื่นคอขึ้น) · ${testers2.length} ผู้ทดสอบ · คลิกที่กราฟเพื่อดูรายละเอียด`}
        </div>
      </header>

      {/* Tabs — สลับรอบการทดสอบ */}
      <div className="mb-7 flex gap-1 border-b border-border">
        {["การทดสอบครั้งที่ 1", "การทดสอบครั้งที่ 2"].map((label, i) => (
          <button
            key={label}
            onClick={() => setTab(i)}
            className={cn(
              "relative -mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors",
              tab === i
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
            {i === 1 && (
              <span className="ml-1.5 rounded-full bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                {testers2.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 0 ? (
        <Dashboard themes={themes} testers={testers} actionItems={actionItems} />
      ) : (
        <Dashboard themes={themes2} testers={testers2} actionItems={actionItems2} />
      )}
    </div>
  )
}
