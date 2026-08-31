"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
} from "react";
import {
  countRawCharsBefore,
  formatCurrencyBlur,
  formatCurrencyLive,
  getCurrencyCursor,
  normalizeCurrencyRaw,
  sanitizeCurrencyRaw,
} from "@/lib/currency";

const currencyInputClassName =
  "w-full rounded-[18px] bg-[#E8E8E8] py-3 pl-10 pr-4 text-base text-black outline-none";

export interface CurrencyInputProps {
  id: string;
  /** Raw numeric string without commas, e.g. "1500.5". */
  value: string;
  onChange: (rawValue: string) => void;
  placeholder?: string;
}

export default function CurrencyInput({
  id,
  value,
  onChange,
  placeholder,
}: CurrencyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isFocusedRef = useRef(false);
  const [display, setDisplay] = useState(() =>
    value ? formatCurrencyLive(value) : ""
  );

  useEffect(() => {
    if (!isFocusedRef.current) {
      setDisplay(value ? formatCurrencyBlur(value) : "");
    }
  }, [value]);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const input = event.target;
      const cursor = input.selectionStart ?? 0;
      const rawCharsBefore = countRawCharsBefore(input.value, cursor);
      const raw = sanitizeCurrencyRaw(input.value);
      const normalized = normalizeCurrencyRaw(raw);
      const formatted = formatCurrencyLive(raw);

      setDisplay(formatted);
      onChange(normalized);

      requestAnimationFrame(() => {
        const nextCursor = getCurrencyCursor(
          formatted,
          raw,
          rawCharsBefore
        );
        inputRef.current?.setSelectionRange(nextCursor, nextCursor);
      });
    },
    [onChange]
  );

  const handleFocus = useCallback(
    (_event: FocusEvent<HTMLInputElement>) => {
      isFocusedRef.current = true;
      setDisplay(value ? formatCurrencyLive(value) : "");
    },
    [value]
  );

  const handleBlur = useCallback(
    (_event: FocusEvent<HTMLInputElement>) => {
      isFocusedRef.current = false;
      setDisplay(value ? formatCurrencyBlur(value) : "");
    },
    [value]
  );

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-semibold text-[#555555]">
        $
      </span>
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={display}
        placeholder={placeholder}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={currencyInputClassName}
      />
    </div>
  );
}
