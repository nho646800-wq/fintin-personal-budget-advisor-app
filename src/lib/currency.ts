/** Strip commas and keep only a valid in-progress currency string. */
export function sanitizeCurrencyRaw(input: string): string {
  const noCommas = input.replace(/,/g, "");
  let result = "";
  let hasDot = false;
  let decimalCount = 0;

  for (const char of noCommas) {
    if (char >= "0" && char <= "9") {
      if (hasDot) {
        if (decimalCount < 2) {
          result += char;
          decimalCount++;
        }
      } else {
        result += char;
      }
    } else if (char === "." && !hasDot) {
      hasDot = true;
      result += ".";
    }
  }

  if (result.startsWith(".")) {
    result = `0${result}`;
  }

  if (result.includes(".")) {
    const [intPart, decPart] = result.split(".");
    const normalizedInt = intPart.replace(/^0+(?=\d)/, "") || "0";
    if (decPart === undefined) {
      return `${normalizedInt}.`;
    }
    return `${normalizedInt}.${decPart}`;
  }

  return result.replace(/^0+(?=\d)/, "");
}

export function formatCurrencyLive(raw: string): string {
  if (!raw) return "";

  const [intPart = "", decPart] = raw.split(".");
  const normalizedInt = (intPart || "0").replace(/^0+(?=\d)/, "") || "0";
  const formattedInt = normalizedInt.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  if (!raw.includes(".")) {
    return `${formattedInt}.00`;
  }

  const paddedDec =
    decPart === undefined || decPart === ""
      ? "00"
      : decPart.length === 1
        ? `${decPart}0`
        : decPart.slice(0, 2);

  return `${formattedInt}.${paddedDec}`;
}

export function formatCurrencyBlur(raw: string): string {
  if (!raw || raw === ".") return "";
  if (parseCurrencyValue(raw) === null) return "";
  return formatCurrencyLive(raw);
}

export function parseCurrencyValue(raw: string): number | null {
  if (!raw || raw === ".") return null;

  const num = Number.parseFloat(raw);
  return Number.isNaN(num) ? null : num;
}

export function countRawCharsBefore(display: string, cursor: number): number {
  let count = 0;
  for (let i = 0; i < cursor && i < display.length; i++) {
    if (/[\d.]/.test(display[i])) {
      count++;
    }
  }
  return count;
}

export function normalizeCurrencyRaw(raw: string): string {
  if (!raw) return "";
  if (!raw.includes(".")) return raw;

  const [intPart, decPart = ""] = raw.split(".");
  if (decPart === "" || decPart === "00") {
    return intPart || "0";
  }

  return `${intPart}.${decPart}`;
}

export function getCurrencyCursor(
  formatted: string,
  raw: string,
  rawCharsBefore: number
): number {
  const dotIndex = formatted.indexOf(".");

  if (!raw.includes(".") && dotIndex !== -1) {
    return dotIndex;
  }

  return cursorAfterFormat(formatted, rawCharsBefore);
}

export function cursorAfterFormat(
  newDisplay: string,
  rawCharsBefore: number
): number {
  if (rawCharsBefore <= 0) return 0;

  let count = 0;
  for (let i = 0; i < newDisplay.length; i++) {
    if (/[\d.]/.test(newDisplay[i])) {
      count++;
      if (count >= rawCharsBefore) {
        return i + 1;
      }
    }
  }

  return newDisplay.length;
}
