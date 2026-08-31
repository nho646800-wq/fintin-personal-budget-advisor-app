import type { ReactNode } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export type IncomeEntry = {
  source: string;
  amount: string;
  timing: string;
};

export type IncomeEntryRecord = {
  source: string;
  amount: number;
  timing: string;
};

export const GOAL_PURPOSE_OPTIONS = [
  "Emergency fund",
  "New car",
  "Trip / vacation",
  "New laptop",
  "Custom",
] as const;

export const inputClassName =
  "w-full rounded-[18px] bg-[#E8E8E8] px-4 py-3 text-base text-black outline-none";

export async function redirectIfOnboardingComplete(
  supabase: SupabaseClient,
  router: AppRouterInstance
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data } = await supabase
    .from("users")
    .select("opening_balance, onboarding_income_json, goal_purpose")
    .eq("id", user.id)
    .single();

  const incomeJson = data?.onboarding_income_json;
  const hasIncome = Array.isArray(incomeJson) && incomeJson.length > 0;

  if (data?.opening_balance != null && hasIncome && data?.goal_purpose) {
    router.replace("/dashboard");
  }
}

export function HelpNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-xs font-semibold leading-snug text-[#333333]">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#333333] text-[10px]">
        ?
      </span>
      <p className="min-w-0">{children}</p>
    </div>
  );
}

export function FormRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-base text-[#8A8A8A]">{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export { default as MoneyInput } from "@/components/CurrencyInput";
