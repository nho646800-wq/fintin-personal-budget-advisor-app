"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppButton from "@/components/AppButton";
import AuthHeader from "@/components/AuthHeader";
import FinTinMascot from "@/components/FinTinMascot";
import {
  HelpNote,
  MoneyInput,
  redirectIfOnboardingComplete,
} from "@/lib/onboarding";
import { parseCurrencyValue } from "@/lib/currency";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingStep1Page() {
  const router = useRouter();
  const [openingBalance, setOpeningBalance] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    redirectIfOnboardingComplete(supabase, router).finally(() =>
      setIsChecking(false)
    );
  }, [router]);

  function handleOpeningBalanceChange(value: string) {
    setOpeningBalance(value);
    if (fieldError && parseCurrencyValue(value) !== null) {
      setFieldError("");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!openingBalance.trim()) {
      setFieldError("Total Money on Hand is required.");
      return;
    }

    const parsed = parseCurrencyValue(openingBalance);
    if (parsed === null || parsed < 0) {
      setFieldError("Enter a valid amount for Total Money on Hand.");
      return;
    }

    setIsSubmitting(true);
    setFieldError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setFieldError("You must be logged in to continue.");
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase
      .from("users")
      .update({ opening_balance: parsed })
      .eq("id", user.id);

    if (error) {
      setFieldError(error.message);
      setIsSubmitting(false);
      return;
    }

    router.push("/onboarding/step2");
  }

  if (isChecking) {
    return <div className="min-h-screen bg-white" />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-white font-[family-name:var(--font-fredoka)]">
      <AuthHeader />

      <form
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col items-center px-6 pb-8 pt-8"
        noValidate
      >
        <FinTinMascot size={120} />

        <div className="mt-6 max-w-[320px] space-y-4 text-center text-base leading-snug text-black">
          <p>
            Before you start, we need 3 things from you to get you onboarded.
            The entire process should takes less than 2 minutes!
          </p>
          <p>
            First, estimate how much money you currently have on hand - add up
            your checking account balance and any cash. Do not include credits -
            which is the money you owe, not own.
          </p>
        </div>

        <div className="mt-8 w-full max-w-[320px]">
          <label
            htmlFor="openingBalance"
            className="mb-2 block text-center text-base text-[#8A8A8A]"
          >
            Total Money On Hand:
          </label>
          <MoneyInput
            id="openingBalance"
            value={openingBalance}
            onChange={handleOpeningBalanceChange}
          />
          {fieldError && (
            <p className="mt-1 text-sm text-red-600">{fieldError}</p>
          )}
        </div>

        <div className="mt-6 w-full max-w-[320px]">
          <HelpNote>
            This becomes your live balance in Fintin. Every expense you log
            subtracts from it, every income you add increases it, and your
            savings progress is measured against it at all times.
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
