interface Props {
  /** 0–1 */
  ratio: number;
  size?: number;
  /** Show the percentage inside the ring. */
  label?: boolean;
}

/** The Today card's thin ring — the one place accent is used generously. */
export function ProgressRing({ ratio, size = 52, label = true }: Props) {
  const stroke = 3;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, ratio));
  const offset = circumference * (1 - clamped);
  const pct = Math.round(clamped * 100);

  return (
    <svg width={size} height={size} role="img" aria-label={`${pct}%`}>
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
      {label && (
        <text
          x="50%" y="50%"
          textAnchor="middle" dominantBaseline="central"
          className="ring__pct"
        >
          {pct}%
        </text>
      )}
    </svg>
  );
}
