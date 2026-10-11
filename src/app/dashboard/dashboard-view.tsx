"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Cell,
  Pie,
  PieChart,
  type PieLabelRenderProps,
} from "recharts";
import AuthHeader from "@/components/AuthHeader";
import FinTinMascot from "@/components/FinTinMascot";
import { formatCurrencyDisplay } from "@/lib/currency";
import type { DashboardData } from "@/lib/dashboard";

const SLICE_COLORS = {
  Needs: "#002490",
  Wants: "#1F75FF",
  Savings: "#00B3FF",
} as const;

const FEATURES = [
  {
    href: "/onboarding/plan",
    label: "View Initial Plan",
    icon: LightbulbIcon,
  },
  {
    href: "/expense-history",
    label: "Expense History",
    icon: ListIcon,
  },
  {
    href: "/log-expense",
    label: "Log Expense",
    icon: MinusIcon,
  },
  {
    href: "/income",
    label: "Income",
    icon: PlusIcon,
  },
  {
    href: "/savings-goal",
    label: "Savings Goal",
    icon: PiggyBankIcon,
  },
  {
    href: "/report",
    label: "Generate Advice Report",
    icon: ChartIcon,
  },
] as const;

/**
 * Outline cloud used as page chrome. Same drawing as the initial-plan
 * screen — not the FinTin mascot.
 */
function DecorativeCloud({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 40" className={className} aria-hidden="true">
      <path
        d="M16 30c-6 0-11-4.5-11-10c0-5 4-9 9-9.5C15.5 5 20 2 26 2c6.5 0 12 4.5 13 10.5c5 .5 9 4.5 9 9.5c0 5.5-5 10-11 10H16Z"
        fill="white"
        stroke="black"
        strokeWidth="2.5"
      />
    </svg>
  );
}

function renderSliceLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: PieLabelRenderProps) {
  if (
    cx == null ||
    cy == null ||
    midAngle == null ||
    innerRadius == null ||
    outerRadius == null ||
    percent == null
  ) {
    return null;
  }

  const centerX = Number(cx);
  const centerY = Number(cy);
  const inner = Number(innerRadius);
  const outer = Number(outerRadius);
  if ([centerX, centerY, inner, outer].some((value) => Number.isNaN(value))) {
    return null;
  }

  const radius = inner + (outer - inner) * 0.62;
  const radian = (-midAngle * Math.PI) / 180;

  return (
    <text
      x={centerX + Math.cos(radian) * radius}
      y={centerY + Math.sin(radian) * radius}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={14}
      fontWeight={600}
    >
      {`${Math.round(percent * 100)}%`}
    </text>
  );
}

function sharePercent(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

export default function DashboardView({
  moneyOnHand,
  goalTargetAmount,
  daysRemaining,
  savingsPercent,
  needsTotal,
  wantsTotal,
  from,
  to,
}: DashboardData) {
  const router = useRouter();
  const barWidth = Math.min(100, savingsPercent);
  const savingsSlice = Math.max(0, moneyOnHand);
  const chartTotal = needsTotal + wantsTotal + savingsSlice;
  const slices = [
    { name: "Needs" as const, value: needsTotal },
    { name: "Wants" as const, value: wantsTotal },
    { name: "Savings" as const, value: savingsSlice },
  ];
  const chartSlices = slices.filter((slice) => slice.value > 0);

  function updateRange(nextFrom: string, nextTo: string) {
    const params = new URLSearchParams({ from: nextFrom, to: nextTo });
    router.replace(`/dashboard?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-white font-[family-name:var(--font-fredoka)] text-black">
      <AuthHeader />

      <main className="mx-auto flex w-full max-w-[408px] flex-1 flex-col">
        <section className="flex items-center gap-1 px-3 pb-1 pt-5">
          <FinTinMascot size={156} animated={false} className="-my-7 shrink-0" />
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-medium leading-tight">
              Welcome back!
            </h2>
            <p className="mt-2 text-sm leading-snug">
              Keep up the progress
              <br />
              champ! You are closer
              <br />
              than you think you are
            </p>
          </div>
        </section>

        <section className="relative mx-10 mt-7">
          <DecorativeCloud className="absolute -right-3 -top-7 z-10 h-16 w-24" />
          <div className="rounded-[18px] bg-[#03229F] px-4 py-8 text-center text-white">
            <p className="text-xl font-medium leading-tight">
              Total Money on Hand:
            </p>
            <p className="mt-3 text-[2.6rem] font-semibold leading-none tracking-tight">
              {formatCurrencyDisplay(moneyOnHand)}
            </p>
          </div>
        </section>

        <section className="mt-10 px-5">
          <h2 className="text-xl font-semibold">Savings Progress:</h2>
          <div className="mt-3 flex items-center gap-3">
            <div className="relative h-9 min-w-0 flex-1 overflow-hidden rounded-full bg-[#D9D9D9]">
              <div
                className="absolute inset-y-0 left-0 bg-[#5BCEFF]"
                style={{ width: `${barWidth}%` }}
              />
              <span
                className={`absolute inset-y-0 flex items-center justify-center text-sm font-semibold ${
                  barWidth >= 16 ? "text-white" : "text-black"
                }`}
                style={
                  barWidth >= 16
                    ? { width: `${barWidth}%` }
                    : { left: "0.75rem" }
                }
              >
                {savingsPercent}%
              </span>
            </div>
            <span className="shrink-0 text-base">
              {formatCurrencyDisplay(goalTargetAmount)}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="inline-flex items-center gap-2 rounded-full bg-[#03229F] px-3 py-1.5 text-sm text-white">
              <CalendarIcon />
              {daysRemaining} days remaining...
            </p>
            <DecorativeCloud className="h-12 w-20 shrink-0" />
          </div>
        </section>

        <section className="relative mt-8 px-4 pb-6">
          <DecorativeCloud className="absolute left-2 top-0 h-11 w-[4.5rem]" />
          <h2 className="pt-3 text-center text-xl font-semibold">
            Expense Breakdown:
          </h2>

          <div className="mx-auto mt-4 flex max-w-[320px] gap-2">
            <label className="flex min-w-0 flex-1 items-center gap-1 rounded-[18px] bg-[#BCBCBC] px-2.5 py-2 text-[11px]">
              <span className="shrink-0 font-medium">From:</span>
              <input
                type="date"
                name="from"
                value={from}
                aria-label="From"
                onChange={(event) => {
                  if (event.target.value) updateRange(event.target.value, to);
                }}
                className="min-w-0 flex-1 bg-transparent text-[11px] text-black outline-none [color-scheme:light]"
              />
            </label>
            <label className="flex min-w-0 flex-1 items-center gap-1 rounded-[18px] bg-[#BCBCBC] px-2.5 py-2 text-[11px]">
              <span className="shrink-0 font-medium">To:</span>
              <input
                type="date"
                name="to"
                value={to}
                aria-label="To"
                onChange={(event) => {
                  if (event.target.value) updateRange(from, event.target.value);
                }}
                className="min-w-0 flex-1 bg-transparent text-[11px] text-black outline-none [color-scheme:light]"
              />
            </label>
          </div>

          <div className="mt-4 flex items-center justify-center gap-1 pr-2">
            <ul className="space-y-3 text-sm">
              {slices.map((slice) => (
                <li key={slice.name} className="flex items-center gap-2">
                  <span
                    className="h-4 w-4 shrink-0"
                    style={{ backgroundColor: SLICE_COLORS[slice.name] }}
                  />
                  {slice.name}
                </li>
              ))}
            </ul>
            <div
              role="img"
              aria-label={`Expense breakdown: Needs ${sharePercent(needsTotal, chartTotal)} percent, Wants ${sharePercent(wantsTotal, chartTotal)} percent, Savings ${sharePercent(savingsSlice, chartTotal)} percent`}
            >
              {chartSlices.length > 0 ? (
                <PieChart width={210} height={210}>
                  <Pie
                    data={chartSlices}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={96}
                    startAngle={90}
                    endAngle={-270}
                    isAnimationActive={false}
                    stroke="none"
                    label={renderSliceLabel}
                    labelLine={false}
                  >
                    {chartSlices.map((slice) => (
                      <Cell key={slice.name} fill={SLICE_COLORS[slice.name]} />
                    ))}
                  </Pie>
                </PieChart>
              ) : (
                <p className="flex h-[210px] w-[210px] items-center px-4 text-center text-sm leading-snug text-[#333333]">
                  Log an expense to see your breakdown.
                </p>
              )}
            </div>
          </div>

          <DecorativeCloud className="absolute bottom-2 left-2 h-11 w-[4.5rem]" />
        </section>
      </main>

      <div className="mt-auto w-full">
        <section className="w-full rounded-t-[28px] bg-[#2048C0] px-6 pb-5 pt-10">
          <div className="mx-auto grid w-full max-w-[408px] grid-cols-3 justify-items-center gap-x-4 gap-y-5">
            {FEATURES.map((feature) => (
              <Link
                key={feature.href}
                href={feature.href}
                className="flex w-20 flex-col items-center gap-2 text-center"
              >
                <span className="flex h-20 w-20 items-center justify-center rounded-[18px] bg-[#3988FF] text-black shadow-[3px_4px_0_#16348C]">
                  <feature.icon />
                </span>
                <span className="text-[11px] font-medium leading-tight text-white">
                  {feature.label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <nav className="flex h-14 w-full items-center justify-between bg-[#090080] px-8 text-[#757575] sm:px-12">
          <Link href="/profile" aria-label="Profile">
            <ProfileIcon />
          </Link>
          <Link href="/settings" aria-label="Settings">
            <GearIcon />
          </Link>
        </nav>
      </div>
    </div>
  );
}

function LightbulbIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
      <path
        d="M16 6.5a6.2 6.2 0 0 0-3.4 11.4c.5.7.9 1.5 1 2.3h4.8c.1-.8.5-1.6 1-2.3A6.2 6.2 0 0 0 16 6.5Z"
        fill="none"
        stroke="black"
        strokeWidth="2"
      />
      <path
        d="M13.4 22.2h5.2M14.2 24.6h3.6"
        fill="none"
        stroke="black"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M8.2 11.2 6.2 10M8.2 16.5H5.6M23.8 11.2 25.8 10M23.8 16.5h2.6M16 4.2V2.2"
        fill="none"
        stroke="black"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
      <circle cx="9" cy="9" r="1.4" fill="black" />
      <circle cx="9" cy="16" r="1.4" fill="black" />
      <circle cx="9" cy="23" r="1.4" fill="black" />
      <path
        d="M13 9h11M13 16h11M13 23h11"
        fill="none"
        stroke="black"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
      <path
        d="M9 16h14"
        fill="none"
        stroke="black"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
      <path
        d="M16 8v16M8 16h16"
        fill="none"
        stroke="black"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PiggyBankIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden="true">
      <g
        transform="translate(24 0) scale(-1 1)"
        fill="none"
        stroke="black"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2" />
        <path d="M2 9v1c0 1.1.9 2 2 2h1" />
        <path d="M16 11h.01" />
      </g>
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
      <rect
        x="7"
        y="7"
        width="18"
        height="18"
        rx="1.2"
        fill="none"
        stroke="black"
        strokeWidth="2.2"
      />
      <rect x="11" y="16.5" width="2.6" height="5.5" fill="black" />
      <rect x="14.7" y="12" width="2.6" height="10" fill="black" />
      <rect x="18.4" y="14.5" width="2.6" height="7.5" fill="black" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <rect
        x="3.5"
        y="5"
        width="17"
        height="15.5"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M3.5 10h17M8 3.2v3.6M16 3.2v3.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="7.5" r="3.6" />
      <path d="M4.2 20.8c.6-3.8 3.4-5.8 7.8-5.8s7.2 2 7.8 5.8v.7H4.2v-.7Z" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden="true">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M10.1 2.4h3.8l.5 2.1c.6.2 1.2.5 1.7.9l2-.9 1.9 1.9-.9 2c.4.5.7 1.1.9 1.7l2.1.5v3.8l-2.1.5c-.2.6-.5 1.2-.9 1.7l.9 2-1.9 1.9-2-.9c-.5.4-1.1.7-1.7.9l-.5 2.1h-3.8l-.5-2.1a6.8 6.8 0 0 1-1.7-.9l-2 .9-1.9-1.9.9-2a6.8 6.8 0 0 1-.9-1.7l-2.1-.5V10.6l2.1-.5c.2-.6.5-1.2.9-1.7l-.9-2 1.9-1.9 2 .9c.5-.4 1.1-.7 1.7-.9l.5-2.1ZM12 9.1a2.9 2.9 0 1 0 0 5.8 2.9 2.9 0 0 0 0-5.8Z"
      />
    </svg>
  );
}
