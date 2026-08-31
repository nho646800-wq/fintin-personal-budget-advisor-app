"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import AppButton from "@/components/AppButton";
import AuthHeader from "@/components/AuthHeader";
import FinTinMascot from "@/components/FinTinMascot";
import { createClient } from "@/lib/supabase/client";

type FieldErrors = {
  email?: string;
  password?: string;
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate() {
    const nextErrors: FieldErrors = {};

    if (!email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!isValidEmail(email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!password) {
      nextErrors.password = "Password is required.";
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
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setFieldErrors({ password: error.message });
      setIsSubmitting(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-white font-[family-name:var(--font-fredoka)]">
      <AuthHeader showBack />

      <form
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col items-center px-6 pb-8 pt-10"
        noValidate
      >
        <FinTinMascot size={140} />

        <p className="mt-6 max-w-[280px] text-center text-xl leading-snug text-black">
          Let&apos;s sign you back into
          <br />
          your budget journey first...
        </p>

        <div className="mt-10 w-full max-w-[320px] space-y-6">
          <div>
            <label htmlFor="email" className="mb-2 block text-base text-[#8A8A8A]">
              Email:
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-[18px] bg-[#E8E8E8] px-4 py-3 text-base text-black outline-none"
            />
            {fieldErrors.email && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-base text-[#8A8A8A]">
              Password:
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-[18px] bg-[#E8E8E8] px-4 py-3 text-base text-black outline-none"
            />
            {fieldErrors.password && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
            )}
          </div>
        </div>

        <div className="mt-auto flex w-full max-w-[320px] flex-col gap-6 pt-10">
          <div className="flex items-start justify-center gap-2 text-xs leading-snug text-[#333333]">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#333333] text-[10px]">
              ?
            </span>
            <p className="min-w-0 break-words">
              Forgot any credentials? Contact{" "}
              <a
                href="mailto:nguyenhoang2850728@gmail.com"
                className="text-[#295EFA] underline"
              >
                nguyenhoang2850728@gmail.com
              </a>
            </p>
          </div>

          <div className="flex justify-end">
            <div className="w-[120px]">
              <AppButton type="submit" disabled={isSubmitting}>
                Log in
              </AppButton>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
