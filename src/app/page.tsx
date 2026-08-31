"use client";

import { useRouter } from "next/navigation";
import AppButton from "@/components/AppButton";
import FinTinMascot from "@/components/FinTinMascot";

export default function WelcomePage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col bg-white font-[family-name:var(--font-fredoka)]">
      <header className="rounded-b-[28px] bg-[#295EFA] px-6 pb-6 pt-10 text-center">
        <h1 className="text-4xl font-semibold text-white">FinTin</h1>
      </header>

      <main className="flex flex-1 flex-col items-center px-8 pb-10 pt-14">
        <FinTinMascot size={150} />

        <p className="mt-8 text-2xl font-medium text-black">Welcome!</p>

        <div className="mt-auto flex w-full max-w-[300px] flex-col gap-5 pt-16">
          <AppButton onClick={() => router.push("/login")}>Log in</AppButton>
          <p className="text-center text-lg text-black">or</p>
          <AppButton onClick={() => router.push("/signup")}>Sign Up</AppButton>
        </div>
      </main>
    </div>
  );
}
