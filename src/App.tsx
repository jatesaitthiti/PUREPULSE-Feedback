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
  actionItems3,
  testers,
  testers2,
  themes,
  themes2,
  viscosityOptions,
  viscosityVotes,
  type ActionItem,
  type Theme,
  type Tester,
  type ViscosityId,
  type ViscosityOption,
  type ViscosityVote,
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

// เรียง action items เป็น P0 → P1 → P2 เสมอ (stable — คงลำดับเดิมภายใน priority เดียวกัน)
const priorityOrder: Record<ActionItem["priority"], number> = { p0: 0, p1: 1, p2: 2 }
const sortByPriority = (items: ActionItem[]) =>
  [...items].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

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
function ActionItemsCard({ items }: { items: ActionItem[] }) {
  return (
    <Card className="mt-5 gap-0 p-6">
      <h2 className="mb-2 text-lg font-bold">Action Items</h2>
      {items.length === 0 ? (
        <div className="text-[13px] text-muted-foreground">— ยังไม่มี action item —</div>
      ) : (
        sortByPriority(items).map((item, i) => (
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
        ))
      )}
    </Card>
  )
}

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

      <ActionItemsCard items={actionList} />

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

// ─── การทดสอบครั้งที่ 3 — โหวตเลือกความหนืด (1 คน = 1 ตัวเลือก) ───────────────

// สีประจำความหนืดที่เลือก — fallback เป็นสีเทาถ้าไม่เจอ option
const colorOf = (options: ViscosityOption[], id: ViscosityId) =>
  options.find((o) => o.id === id)?.color ?? "#71717a"

// การ์ดคะแนนของแต่ละความหนืด — คลิกเพื่อโฟกัสคอลัมน์ด้านล่าง
function VoteStatCard({
  option,
  count,
  total,
  selected,
  onClick,
}: {
  option: ViscosityOption
  count: number
  total: number
  selected: boolean
  onClick: () => void
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <Card
      onClick={onClick}
      style={selected ? { borderColor: option.color, boxShadow: `0 0 0 1px ${option.color}` } : undefined}
      className="cursor-pointer items-center gap-1.5 px-4 py-4 text-center transition-colors hover:bg-accent/40"
    >
      <div className="flex items-baseline justify-center gap-1.5 leading-none">
        <span className="text-3xl font-bold" style={{ color: option.color }}>
          {count}
        </span>
        <span className="text-sm font-medium text-muted-foreground">คน</span>
      </div>
      <div className="text-xs font-medium" style={{ color: selected ? option.color : undefined }}>
        {option.label}
      </div>
      <div className="text-[10px] text-muted-foreground/60">
        {total > 0 ? `${pct}% ของผู้ทดสอบ` : "ยังไม่มีผลโหวต"}
      </div>
    </Card>
  )
}

// แถบเปรียบเทียบสัดส่วนแบบ head-to-head
function VoteBar({
  tally,
  total,
}: {
  tally: { option: ViscosityOption; count: number }[]
  total: number
}) {
  if (total === 0) {
    return (
      <div className="flex h-9 items-center justify-center rounded-md border border-dashed border-border bg-muted/40 text-[12px] text-muted-foreground">
        ยังไม่มีผลโหวต — แถบเปรียบเทียบจะขึ้นเมื่อมีคนเลือกแล้ว
      </div>
    )
  }
  return (
    <div className="flex h-9 overflow-hidden rounded-md">
      {tally.map(({ option, count }) => {
        const pct = (count / total) * 100
        if (count === 0) return null
        return (
          <div
            key={option.id}
            className="flex items-center justify-center text-[12px] font-semibold text-white transition-all"
            style={{ width: `${pct}%`, background: option.color }}
            title={`${option.label} — ${count} คน (${Math.round(pct)}%)`}
          >
            {pct >= 12 && `${Math.round(pct)}%`}
          </div>
        )
      })}
    </div>
  )
}

// คอลัมน์รายชื่อคนที่เลือกความหนืดนั้น + เหตุผล
function VoteColumn({
  option,
  votes,
  total,
  selected,
  onSelect,
}: {
  option: ViscosityOption
  votes: ViscosityVote[]
  total: number
  selected: boolean
  onSelect: () => void
}) {
  const pct = total > 0 ? Math.round((votes.length / total) * 100) : 0
  return (
    <Card
      onClick={onSelect}
      style={{
        borderTop: `3px solid ${option.color}`,
        ...(selected ? { boxShadow: `0 0 0 1px ${option.color}` } : {}),
      }}
      className="cursor-pointer gap-0 p-6 transition-colors"
    >
      <div className="mb-1 flex items-baseline gap-2">
        <span
          className="inline-block h-[9px] w-[9px] shrink-0 rounded-full"
          style={{ background: option.color }}
        />
        <h2 className="text-lg font-bold">{option.label}</h2>
        <span className="ml-auto text-[13px] font-semibold" style={{ color: option.color }}>
          {votes.length} คน{total > 0 && ` · ${pct}%`}
        </span>
      </div>
      <div className="mb-3.5 text-[13px] leading-normal text-muted-foreground">{option.desc}</div>

      {votes.length === 0 ? (
        <div className="rounded border border-dashed border-border px-3 py-4 text-center text-[13px] text-muted-foreground">
          — ยังไม่มีคนเลือกสูตรนี้ —
        </div>
      ) : (
        votes.map((v) => (
          <div
            key={v.name}
            className="mb-1.5 rounded border-l-[3px] bg-muted px-3 py-2 text-[13px] leading-normal text-foreground/85"
            style={{ borderLeftColor: option.color }}
          >
            <div className="flex items-baseline gap-1.5">
              <span className="font-semibold text-foreground">
                {v.name}
                {v.new && " 🆕"}
              </span>
              {v.tag && <span className="text-[11px] text-muted-foreground">{v.tag}</span>}
            </div>
            {v.reason && <div className="mt-0.5">{v.reason}</div>}
            {v.note && <div className="mt-1 text-[12px] text-muted-foreground">{v.note}</div>}
          </div>
        ))
      )}
    </Card>
  )
}

function ViscosityBoard({
  options,
  votes,
  actionItems: actionList,
}: {
  options: ViscosityOption[]
  votes: ViscosityVote[]
  actionItems: ActionItem[]
}) {
  const [selected, setSelected] = useState<ViscosityId | null>(null)
  const [selectedTester, setSelectedTester] = useState<number | null>(null)

  const total = votes.length
  const tally = options.map((option) => ({
    option,
    count: votes.filter((v) => v.choice === option.id).length,
    voters: votes.filter((v) => v.choice === option.id),
  }))

  // ผลนำ — เสมอถือว่ายังไม่มีผู้ชนะ
  const top = Math.max(0, ...tally.map((t) => t.count))
  const leaders = tally.filter((t) => t.count === top && top > 0)
  const leader = leaders.length === 1 ? leaders[0] : null
  const margin = leader ? leader.count - Math.min(...tally.map((t) => t.count)) : 0

  const tester = selectedTester !== null ? votes[selectedTester] : null

  // กติกา 1 คน = 1 ความหนืด — ถ้าชื่อซ้ำแปลว่าใส่ข้อมูลผิด ต้องเห็นทันที
  const dupes = [...new Set(votes.map((v) => v.name).filter((n, i, a) => a.indexOf(n) !== i))]

  return (
    <>
      {dupes.length > 0 && (
        <div className="mb-5 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-[13px] text-red-700">
          ⚠️ ชื่อซ้ำในผลโหวต ({dupes.join(", ")}) — กติกาคือ 1 คนเลือกได้ 1 ความหนืด
          กรุณาตรวจ <code>viscosityVotes</code> ใน <code>src/data.ts</code>
        </div>
      )}

      <div className="mb-5 grid grid-cols-3 gap-3">
        <StatCard num={total} label="ผู้ทดสอบ (Athletes)" />
        {tally.map(({ option, count }) => (
          <VoteStatCard
            key={option.id}
            option={option}
            count={count}
            total={total}
            selected={selected === option.id}
            onClick={() => setSelected(selected === option.id ? null : option.id)}
          />
        ))}
      </div>

      <Card className="mb-5 gap-0 p-6">
        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold">ผลโหวตความหนืด</h2>
          <span className="text-[13px] text-muted-foreground">
            {total === 0
              ? "ผู้ทดสอบลองทั้ง 2 สูตร แล้วเลือกได้คนละ 1 ความหนืด"
              : leader
                ? `${leader.option.label} นำอยู่ ${margin} เสียง`
                : "คะแนนเสมอกัน"}
          </span>
        </div>
        <div className="mb-3 text-[13px] text-muted-foreground">
          ตัวเลข % เทียบกับความหนืดของ<strong className="font-semibold text-foreground/80">สูตรการทดสอบครั้งที่ 2 = 100%</strong>{" "}
          — ทั้งสองสูตรจึงเหลวกว่ารอบที่แล้ว
        </div>
        <VoteBar tally={tally} total={total} />
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
          {tally.map(({ option, count }) => (
            <div key={option.id} className="flex items-center gap-2 text-[12px] text-muted-foreground">
              <span
                className="inline-block h-[9px] w-[9px] rounded-full"
                style={{ background: option.color }}
              />
              <span className="font-medium text-foreground">{option.label}</span>
              <span>
                {count} คน{total > 0 && ` (${Math.round((count / total) * 100)}%)`}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {tally.map(({ option, voters }) => (
          <VoteColumn
            key={option.id}
            option={option}
            votes={voters}
            total={total}
            selected={selected === option.id}
            onSelect={() => setSelected(selected === option.id ? null : option.id)}
          />
        ))}
      </div>

      <ActionItemsCard items={actionList} />

      <Card id="athletes" className="mt-5 scroll-mt-6 gap-0 p-6">
        <h2 className="mb-1 text-lg font-bold">Athletes</h2>
        <div className="mb-3.5 text-[13px] text-muted-foreground">
          {votes.length} คน · คลิกชื่อเพื่อดูฟีดแบ็กเต็ม · จุดสีบอกความหนืดที่เลือก · 🆕 = เพิ่มล่าสุด
        </div>
        <div className="flex flex-wrap gap-2">
          {votes.map((v, i) => {
            const isSel = selectedTester === i
            const color = colorOf(options, v.choice)
            return (
              <button
                key={v.name}
                onClick={() => setSelectedTester(isSel ? null : i)}
                className={cn(
                  "inline-flex items-baseline gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
                  isSel
                    ? "border-primary bg-primary text-primary-foreground"
                    : v.new
                      ? "border-blue-500/40 bg-blue-500/10 text-blue-700 hover:border-blue-500/60"
                      : "border-border bg-muted text-foreground hover:border-muted-foreground/40",
                )}
              >
                <span
                  className="inline-block h-[7px] w-[7px] shrink-0 self-center rounded-full"
                  style={{ background: color }}
                />
                {v.new ? "🆕 " : ""}
                {v.name}
                <span
                  className={cn(
                    "text-[11px] font-medium",
                    isSel
                      ? "text-primary-foreground/70"
                      : v.new
                        ? "text-blue-700/70"
                        : "text-muted-foreground",
                  )}
                >
                  {v.choice}%
                </span>
              </button>
            )
          })}
        </div>

        {tester && (
          <div className="mt-[18px] border-t border-border pt-[18px]">
            <div className="mb-3 flex flex-wrap items-baseline gap-2 text-base font-bold text-foreground">
              {tester.new ? "🆕 " : ""}
              {tester.name}
              {tester.tag && (
                <span className="text-xs font-medium text-muted-foreground">{tester.tag}</span>
              )}
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
                style={{ background: colorOf(options, tester.choice) }}
              >
                เลือกความหนืด {tester.choice}%
              </span>
            </div>

            {tester.reason && (
              <div
                className="mb-1.5 rounded border-l-[3px] bg-muted px-3 py-2 text-[13px] leading-normal text-foreground/85"
                style={{ borderLeftColor: colorOf(options, tester.choice) }}
              >
                <span className="mr-1.5 text-[11px] font-semibold text-muted-foreground">
                  เหตุผลที่เลือก
                </span>
                {tester.reason}
              </div>
            )}
            {tester.note && (
              <div className="mb-1.5 rounded border-l-[3px] border-l-border bg-muted px-3 py-2 text-[13px] leading-normal text-foreground/85">
                <span className="mr-1.5 text-[11px] font-semibold text-muted-foreground">
                  หมายเหตุ
                </span>
                {tester.note}
              </div>
            )}

            {tester.originalFeedback ? (
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
            ) : (
              <div className="mt-3 text-[13px] text-muted-foreground">
                — ยังไม่มีฟีดแบ็กดิบที่บันทึก —
              </div>
            )}
          </div>
        )}
      </Card>
    </>
  )
}

// รอบการทดสอบทั้งหมด — เพิ่มรอบใหม่โดยต่อ entry ท้าย array (tab จะขึ้นเอง)
const ROUNDS = [
  {
    label: "การทดสอบครั้งที่ 1",
    subtitle: "38 ผู้ทดสอบ · แชท 64 รูป + เสียง/วิดีโอ · คลิกที่กราฟเพื่อดูรายละเอียดและปัญหา",
    kind: "themes" as const,
    themes,
    testers,
    actionItems,
  },
  {
    label: "การทดสอบครั้งที่ 2",
    subtitle: `รอบปรับสูตรใหม่ (ลดความหนืด / ให้ลื่นคอขึ้น) · ${testers2.length} ผู้ทดสอบ · คลิกที่กราฟเพื่อดูรายละเอียด`,
    kind: "themes" as const,
    themes: themes2,
    testers: testers2,
    actionItems: actionItems2,
  },
  {
    label: "การทดสอบครั้งที่ 3",
    subtitle:
      viscosityVotes.length > 0
        ? `เลือกความหนืด 75% / 50% ของสูตรครั้งที่ 2 · ${viscosityVotes.length} ผู้ทดสอบ · 1 คนเลือกได้ 1 ความหนืด`
        : "เลือกความหนืด 75% / 50% ของสูตรครั้งที่ 2 · 1 คนเลือกได้ 1 ความหนืด — ยังไม่มีผลโหวต",
    kind: "viscosity" as const,
    testers: viscosityVotes,
    actionItems: actionItems3,
  },
]

export default function App() {
  const [tab, setTab] = useState(0) // index ใน ROUNDS
  const round = ROUNDS[tab]

  return (
    <div className="mx-auto min-h-screen max-w-[1100px] px-6 py-12">
      <header className="mb-9">
        <h1 className="mb-1.5 text-[26px] font-bold tracking-tight">
          PUREPULSE Energy Gel — Feedback Summary
        </h1>
        <div className="text-sm text-muted-foreground">{round.subtitle}</div>
      </header>

      {/* Tabs — สลับรอบการทดสอบ */}
      <div className="mb-7 flex gap-1 border-b border-border">
        {ROUNDS.map((r, i) => (
          <button
            key={r.label}
            onClick={() => setTab(i)}
            className={cn(
              "relative -mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors",
              tab === i
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {r.label}
            {i > 0 && r.testers.length > 0 && (
              <span className="ml-1.5 rounded-full bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                {r.testers.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* key={tab} — รีเซ็ต state (หมวด/athlete/ตัวเลือกที่เลือก) เมื่อสลับรอบ */}
      {round.kind === "viscosity" ? (
        <ViscosityBoard
          key={tab}
          options={viscosityOptions}
          votes={round.testers}
          actionItems={round.actionItems}
        />
      ) : (
        <Dashboard
          key={tab}
          themes={round.themes}
          testers={round.testers}
          actionItems={round.actionItems}
        />
      )}
    </div>
  )
}
