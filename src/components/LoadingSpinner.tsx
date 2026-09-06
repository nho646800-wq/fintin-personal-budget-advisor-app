"use client";

export interface LoadingSpinnerProps {
  /** Outer diameter in pixels. Defaults to 40. */
  size?: number;
  className?: string;
  /** Accessible label announced to screen readers. */
  label?: string;
}

/**
 * Circular loading indicator used during route transitions and while
 * waiting on Gemini. Track is light grey; the rotating arc matches the
 * FinTin banner blue (#295EFA).
 */
export default function LoadingSpinner({
  size = 40,
  className,
  label = "Loading",
}: LoadingSpinnerProps) {
  const strokeWidth = Math.max(3, Math.round(size * 0.1));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Show ~25% of the ring as the active blue arc.
  const arcLength = circumference * 0.25;

  return (
    <div
      className={className}
      role="status"
      aria-live="polite"
      aria-label={label}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="loading-spinner-svg"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#D1D5DB"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#295EFA"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference - arcLength}`}
          className="loading-spinner-arc"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
}
