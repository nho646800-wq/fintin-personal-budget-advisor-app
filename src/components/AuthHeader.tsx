"use client";

import { useRouter } from "next/navigation";

interface AuthHeaderProps {
  showBack?: boolean;
  backHref?: string;
}

export default function AuthHeader({
  showBack = false,
  backHref = "/",
}: AuthHeaderProps) {
  const router = useRouter();

  return (
    <header className="relative rounded-b-[28px] bg-[#295EFA] px-6 pb-6 pt-10 text-center">
      {showBack && (
        <button
          type="button"
          onClick={() => router.push(backHref)}
          aria-label="Go back"
          className="absolute left-5 top-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
        >
          ← Back
        </button>
      )}
      <h1 className="text-4xl font-semibold text-white">FinTin</h1>
    </header>
  );
}
