"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppButton from "@/components/AppButton";
import AuthHeader from "@/components/AuthHeader";
import FinTinMascot from "@/components/FinTinMascot";
import {
  FormRow,
  GOAL_PURPOSE_OPTIONS,
  HelpNote,
  MoneyInput,
  redirectIfOnboardingComplete,
  inputClassName,
} from "@/lib/onboarding";
import { parseCurrencyValue } from "@/lib/currency";
import { createClient } from "@/lib/supabase/client";

type FieldErrors = {
  purpose?: string;
  customPurpose?: string;
  amount?: string;
  deadline?: string;
  form?: string;
};

export default function OnboardingStep3Page() {
  const router = useRouter();
  const [purpose, setPurpose] = useState("");
  const [customPurpose, setCustomPurpose] = useState("");
  const [amount, setAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    redirectIfOnboardingComplete(supabase, router).finally(() =>
      setIsChecking(false)
    );
  }, [router]);

  function validate() {
    const nextErrors: FieldErrors = {};

    if (!purpose) {
      nextErrors.purpose = "Purpose is required.";
    } else if (purpose === "Custom" && !customPurpose.trim()) {
      nextErrors.customPurpose = "Custom purpose is required.";
    }

    if (!amount.trim()) {
      nextErrors.amount = "Amount is required.";
    } else {
      const parsedAmount = parseCurrencyValue(amount);
      if (parsedAmount === null || parsedAmount <= 0) {
        nextErrors.amount = "Enter a valid target amount.";
      }
    }

    if (!deadline.trim()) {
      nextErrors.deadline = "Deadline is required.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setFieldErrors({});

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setFieldErrors({ form: "You must be logged in to continue." });
      setIsSubmitting(false);
      return;
    }

    const goalPurpose =
      purpose === "Custom" ? customPurpose.trim() : purpose;

    const parsedAmount = parseCurrencyValue(amount);
    if (parsedAmount === null) {
      setFieldErrors({ amount: "Enter a valid target amount." });
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase
      .from("users")
      .update({
        goal_purpose: goalPurpose,
        goal_target_amount: parsedAmount,
        goal_deadline: deadline,
      })
      .eq("id", user.id);

    if (error) {
      setFieldErrors({ form: error.message });
      setIsSubmitting(false);
      return;
    }

    router.push("/onboarding/plan");
  }

  if (isChecking) {
    return <div className="min-h-screen bg-white" />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-white font-[family-name:var(--font-fredoka)]">
      <AuthHeader showBack backHref="/onboarding/step2" />

      <form
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col items-center px-6 pb-8 pt-8"
        noValidate
      >
        <FinTinMascot size={110} />

        <div className="mt-6 max-w-[320px] space-y-4 text-center text-base leading-snug text-black">
          <p>Lastly, let&apos;s have a clearer of picture of why you are here.</p>
          <p>
            Fill in your savings goal fields, this will become your permanent
            savings objective to which you will work towards
          </p>
        </div>

        <div className="mt-8 w-full max-w-[320px] space-y-4">
          <h2 className="text-lg font-semibold text-black">Savings Goal:</h2>

          <FormRow label="Purpose:">
            <div>
              <div className="relative">
                <select
                  id="purpose"
                  value={purpose}
                  onChange={(event) => setPurpose(event.target.value)}
                  className={`${inputClassName} appearance-none pr-10`}
                >
                  <option value="">Select purpose</option>
                  {GOAL_PURPOSE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#8A8A8A]">
                  ▼
                </span>
              </div>
              {fieldErrors.purpose && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.purpose}</p>
              )}
              {purpose === "Custom" && (
                <div className="mt-3">
                  <input
                    id="customPurpose"
                    type="text"
                    value={customPurpose}
                    onChange={(event) => setCustomPurpose(event.target.value)}
                    placeholder="Enter custom purpose"
                    className={inputClassName}
                  />
                  {fieldErrors.customPurpose && (
                    <p className="mt-1 text-sm text-red-600">
                      {fieldErrors.customPurpose}
                    </p>
                  )}
                </div>
              )}
            </div>
          </FormRow>

          <FormRow label="Amount:">
            <div>
              <MoneyInput
                id="goalAmount"
                value={amount}
                onChange={setAmount}
              />
              {fieldErrors.amount && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.amount}</p>
              )}
            </div>
          </FormRow>

          <FormRow label="Deadline:">
            <div>
              <input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(event) => setDeadline(event.target.value)}
                className={inputClassName}
              />
              {fieldErrors.deadline && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.deadline}</p>
              )}
            </div>
          </FormRow>

          {fieldErrors.form && (
            <p className="text-sm text-red-600">{fieldErrors.form}</p>
          )}
        </div>

        <div className="mt-6 w-full max-w-[320px]">
          <HelpNote>
            This will become your permanent savings goal in FinTin. You
            can&apos;t edit any information of this later. The previous Total
            Money on Hand is the progress towards the targeted Amount and the
            deadline will be used to calculated the remaining days for hitting
            the goal from the current date.
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
