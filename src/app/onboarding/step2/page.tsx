"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppButton from "@/components/AppButton";
import AuthHeader from "@/components/AuthHeader";
import FinTinMascot from "@/components/FinTinMascot";
import {
  FormRow,
  HelpNote,
  IncomeEntry,
  MoneyInput,
  redirectIfOnboardingComplete,
  inputClassName,
} from "@/lib/onboarding";
import { parseCurrencyValue } from "@/lib/currency";
import { createClient } from "@/lib/supabase/client";

function createEmptyEntry(): IncomeEntry {
  return { source: "", amount: "", timing: "" };
}

export default function OnboardingStep2Page() {
  const router = useRouter();
  const [entries, setEntries] = useState<IncomeEntry[]>([createEmptyEntry()]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    redirectIfOnboardingComplete(supabase, router).finally(() =>
      setIsChecking(false)
    );
  }, [router]);

  function updateEntry(
    index: number,
    field: keyof IncomeEntry,
    value: string
  ) {
    setEntries((current) =>
      current.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry
      )
    );
  }

  function addEntry() {
    setEntries((current) => [...current, createEmptyEntry()]);
  }

  function validate() {
    const nextErrors: Record<string, string> = {};

    entries.forEach((entry, index) => {
      const label = `Income Entry ${index + 1}`;

      if (!entry.source.trim()) {
        nextErrors[`source-${index}`] = `Source is required for ${label}.`;
      }

      if (!entry.amount.trim()) {
        nextErrors[`amount-${index}`] = `Amount is required for ${label}.`;
      } else {
        const parsedAmount = parseCurrencyValue(entry.amount);
        if (parsedAmount === null || parsedAmount < 0) {
          nextErrors[`amount-${index}`] = `Enter a valid amount for ${label}.`;
        }
      }

      if (!entry.timing.trim()) {
        nextErrors[`timing-${index}`] = `Timing is required for ${label}.`;
      }
    });

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setFormError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setFormError("You must be logged in to continue.");
      setIsSubmitting(false);
      return;
    }

    const payload = entries.map((entry) => ({
      source: entry.source.trim(),
      amount: parseCurrencyValue(entry.amount) ?? 0,
      timing: entry.timing.trim(),
    }));

    const { error } = await supabase
      .from("users")
      .update({ onboarding_income_json: payload })
      .eq("id", user.id);

    if (error) {
      setFormError(error.message);
      setIsSubmitting(false);
      return;
    }

    router.push("/onboarding/step3");
  }

  if (isChecking) {
    return <div className="min-h-screen bg-white" />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-white font-[family-name:var(--font-fredoka)]">
      <AuthHeader showBack backHref="/onboarding/step1" />

      <form
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col items-center px-6 pb-8 pt-8"
        noValidate
      >
        <FinTinMascot size={110} />

        <div className="mt-6 max-w-[320px] space-y-4 text-center text-base leading-snug text-black">
          <p>
            Now, recall and enter your money inflows - estimated amount, timing
            (once a month, bi-weekly, etc.), and source.
          </p>
          <p>Note that you can create as much entries as you want.</p>
        </div>

        <div className="mt-8 w-full max-w-[320px] space-y-8">
          {entries.map((entry, index) => (
            <div key={index} className="space-y-4">
              <h2 className="text-lg font-semibold text-black">
                Income Entry {index + 1}:
              </h2>

              <div className="space-y-3">
                <FormRow label="Source:">
                  <div>
                    <input
                      id={`source-${index}`}
                      type="text"
                      value={entry.source}
                      onChange={(event) =>
                        updateEntry(index, "source", event.target.value)
                      }
                      className={inputClassName}
                    />
                    {fieldErrors[`source-${index}`] && (
                      <p className="mt-1 text-sm text-red-600">
                        {fieldErrors[`source-${index}`]}
                      </p>
                    )}
                  </div>
                </FormRow>

                <FormRow label="Amount:">
                  <div>
                    <MoneyInput
                      id={`amount-${index}`}
                      value={entry.amount}
                      onChange={(value) => updateEntry(index, "amount", value)}
                    />
                    {fieldErrors[`amount-${index}`] && (
                      <p className="mt-1 text-sm text-red-600">
                        {fieldErrors[`amount-${index}`]}
                      </p>
                    )}
                  </div>
                </FormRow>

                <FormRow label="Timing:">
                  <div>
                    <input
                      id={`timing-${index}`}
                      type="text"
                      value={entry.timing}
                      onChange={(event) =>
                        updateEntry(index, "timing", event.target.value)
                      }
                      className={inputClassName}
                    />
                    {fieldErrors[`timing-${index}`] && (
                      <p className="mt-1 text-sm text-red-600">
                        {fieldErrors[`timing-${index}`]}
                      </p>
                    )}
                  </div>
                </FormRow>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addEntry}
            className="flex items-center gap-2 rounded-full bg-[#295EFA] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[#295EFA]">
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M4.25 0h1.5v10h-1.5V0ZM0 4.25h10v1.5H0v-1.5Z"
                  fill="currentColor"
                />
              </svg>
            </span>
            Add an entry
          </button>

          {formError && <p className="text-sm text-red-600">{formError}</p>}
        </div>

        <div className="mt-6 w-full max-w-[320px]">
          <HelpNote>
            All these entries will not be saved for review anywhere after this
            onboarding process. They are only referenced for generating your
            initial overarching budgeting plan.
          </HelpNote>
        </div>

        <div className="mt-auto flex w-full max-w-[320px] justify-end pt-10">
          <div className="w-[130px]">
            <AppButton type="submit" disabled={isSubmitting}>
              Continue
            </AppButton>
          </div>
        </div>
      </form>
    </div>
  );
}
