"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import AppButton from "@/components/AppButton";
import AuthHeader from "@/components/AuthHeader";
import FinTinMascot from "@/components/FinTinMascot";
import { createClient } from "@/lib/supabase/client";

type FieldErrors = {
  email?: string;
  city?: string;
  state?: string;
  password?: string;
  confirmPassword?: string;
  form?: string;
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate() {
    const nextErrors: FieldErrors = {};

    if (!email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!isValidEmail(email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!city.trim()) {
      nextErrors.city = "City is required.";
    }

    if (!state.trim()) {
      nextErrors.state = "State is required.";
    }

    if (!password) {
      nextErrors.password = "Password is required.";
    } else if (password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters.";
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Confirm your password.";
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
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
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (error) {
      setFieldErrors({ form: error.message });
      setIsSubmitting(false);
      return;
    }

    if (!data.user) {
      setFieldErrors({ form: "Unable to create account. Please try again." });
      setIsSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from("users").insert({
      id: data.user.id,
      city: city.trim(),
      state: state.trim(),
    });

    if (insertError) {
      setFieldErrors({ form: insertError.message });
      setIsSubmitting(false);
      return;
    }

    router.push("/onboarding/step1");
  }

  return (
    <div className="flex min-h-screen flex-col bg-white font-[family-name:var(--font-fredoka)]">
      <AuthHeader showBack />

      <form
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col items-center px-6 pb-8 pt-10"
        noValidate
      >
        <FinTinMascot size={130} />

        <p className="mt-6 max-w-[300px] text-center text-xl leading-snug text-black">
          Let&apos;s get you set up for a new budget journey!
        </p>

        <div className="mt-8 w-full max-w-[320px] space-y-5">
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
            <label htmlFor="city" className="mb-2 block text-base text-[#8A8A8A]">
              City:
            </label>
            <input
              id="city"
              type="text"
              autoComplete="address-level2"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className="w-full rounded-[18px] bg-[#E8E8E8] px-4 py-3 text-base text-black outline-none"
            />
            {fieldErrors.city && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.city}</p>
            )}
          </div>

          <div>
            <label htmlFor="state" className="mb-2 block text-base text-[#8A8A8A]">
              State:
            </label>
            <input
              id="state"
              type="text"
              autoComplete="address-level1"
              value={state}
              onChange={(event) => setState(event.target.value)}
              className="w-full rounded-[18px] bg-[#E8E8E8] px-4 py-3 text-base text-black outline-none"
            />
            {fieldErrors.state && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.state}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-base text-[#8A8A8A]">
              Password:
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-[18px] bg-[#E8E8E8] px-4 py-3 text-base text-black outline-none"
            />
            {fieldErrors.password && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-base text-[#8A8A8A]"
            >
              Confirm Password:
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-[18px] bg-[#E8E8E8] px-4 py-3 text-base text-black outline-none"
            />
            {fieldErrors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          {fieldErrors.form && (
            <p className="text-sm text-red-600">{fieldErrors.form}</p>
          )}
        </div>

        <div className="mt-8 flex w-full max-w-[320px] justify-end">
          <div className="w-[130px]">
            <AppButton type="submit" disabled={isSubmitting}>
              Sign Up
            </AppButton>
          </div>
        </div>
      </form>
    </div>
  );
}
