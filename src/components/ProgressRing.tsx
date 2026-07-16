interface Props {
  /** 0–1 */
  ratio: number;
  size?: number;
}

/** The Today card's thin ring — the one place accent is used generously. */
export function ProgressRing({ ratio, size = 44 }: Props) {
  const stroke = 3;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.max(0, Math.min(1, ratio)));

  return (
    <svg width={size} height={size} aria-hidden="true">
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="var(--accent-soft)" strokeWidth={stroke}
      />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="var(--accent)" strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 400ms ease' }}
      />
    </svg>
  );
}
