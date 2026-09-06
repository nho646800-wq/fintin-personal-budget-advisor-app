"use client";

import { useRouter } from "next/navigation";
import AppButton from "@/components/AppButton";
import AuthHeader from "@/components/AuthHeader";
import FinTinMascot from "@/components/FinTinMascot";
import LoadingSpinner from "@/components/LoadingSpinner";
import { HelpNote } from "@/lib/onboarding";
import { useGeneratePlan } from "@/hooks/useGeneratePlan";

function formatDateMMDDYYYY(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${mm}/${dd}/${date.getFullYear()}`;
}

/**
 * A small plain outline cloud used only as page chrome around the plan
 * card — this is NOT the FinTin mascot and must never be confused with it.
 * The real mascot is always rendered via <FinTinMascot />; this is purely
 * decorative background dressing matching the wireframe's corner clouds.
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

/**
 * Renders the Gemini response text as returned. The only transformation
 * applied is turning the `**Heading**` markers from Prompt 1's REQUIRED
 * OUTPUT contract into bold headings — every other character, line break,
 * and section is left exactly as the model produced it.
 */
function PlanContent({ content }: { content: string }) {
  const segments = content.split(/(\*\*[^*]+\*\*)/g);

  return (
    <div className="whitespace-pre-wrap text-sm leading-relaxed text-white">
      {segments.map((segment, index) =>
        segment.startsWith("**") && segment.endsWith("**") ? (
          <strong key={index} className="mt-1 block text-lg font-bold">
            {segment.slice(2, -2)}
          </strong>
        ) : (
          <span key={index}>{segment}</span>
        )
      )}
    </div>
  );
}

export default function OnboardingPlanPage() {
  const router = useRouter();
  const plan = useGeneratePlan();

  return (
    <div className="flex min-h-screen flex-col bg-white font-[family-name:var(--font-fredoka)]">
      <AuthHeader />

      <div className="flex flex-1 flex-col items-center px-6 pb-8 pt-8">
        <FinTinMascot size={110} />

        {plan.status === "loading" && (
          <div className="mt-6 flex max-w-[280px] flex-col items-center gap-4 text-center">
            <LoadingSpinner size={44} label="Generating your plan" />
            <p className="text-base leading-snug text-black">
              Hang tight — I&apos;m putting together your personalized
              budgeting plan...
            </p>
          </div>
        )}

        {plan.status === "error" && (
          <div className="mt-6 max-w-[320px] space-y-3 text-center">
            <p className="text-base leading-snug text-red-600">
              {plan.message}
            </p>
            <button
              type="button"
              onClick={() => void plan.retry()}
              className="text-sm font-semibold text-[#295EFA] underline"
            >
              Try again
            </button>
          </div>
        )}

        {plan.status === "success" && (
          <>
            <div className="mt-6 max-w-[320px] space-y-4 text-center text-base leading-snug text-black">
              <p>
                Done! I have articulated your information into a
                personalized overarching budgeting strategy.
              </p>
              <p>
                Below is your plan, built from the information you entered
                during onboarding.
              </p>
            </div>

            <div className="relative mt-8 w-full max-w-[320px]">
              <DecorativeCloud className="absolute -left-4 -top-4 z-10 h-10 w-16" />
              <DecorativeCloud className="absolute -bottom-4 -right-3 z-10 h-9 w-14" />

              <div className="max-h-[420px] overflow-y-auto rounded-[28px] border-[3px] border-black bg-[#295EFA] px-5 py-6">
                <h2 className="text-2xl font-bold text-white">
                  Initial Budgeting Plan
                </h2>
                <p className="mt-1 text-sm text-white/80">
                  Date: {formatDateMMDDYYYY(plan.generatedAt)}
                </p>
                <hr className="my-4 border-white/40" />
                <PlanContent content={plan.content} />
              </div>
            </div>

            <div className="mt-6 w-full max-w-[320px]">
              <HelpNote>
                This plan is permanently saved and can be revisited anytime
                from your Dashboard. Keep in mind that it will not change,
                or be changed — it is your fixed reference point for the
                journey ahead.
              </HelpNote>
            </div>

            <div className="mt-auto w-full max-w-[320px] pt-10">
              <AppButton onClick={() => router.push("/dashboard")}>
                Continue to Dashboard
              </AppButton>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
