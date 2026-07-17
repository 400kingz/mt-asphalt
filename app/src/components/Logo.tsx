/* MT Asphalt mark — golden mountain road, derived from the flyer logo. */
export function LogoMark({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="14" fill="#0f0f11" stroke="#34343a" />
      <path d="M6 50 L24 18 L33 34 L40 24 L58 50 Z" fill="#8a97a0" />
      <path d="M24 18 L33 34 L28 42 L18 30 Z" fill="#f6f4ef" opacity="0.92" />
      <path d="M40 24 L58 50 L44 50 L36 36 Z" fill="#b8c1c6" />
      <path
        d="M14 52 C24 46 26 40 30 40 C36 40 36 30 44 27 L50 24"
        stroke="#f2b705"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M14 52 C24 46 26 40 30 40 C36 40 36 30 44 27 L50 24"
        stroke="#17130a"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeDasharray="2 4"
      />
    </svg>
  );
}

export function Wordmark({
  size = 40,
  showTagline = false,
  className = "",
}: {
  size?: number;
  showTagline?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <div className="leading-none">
        <div
          className="display text-cream"
          style={{ fontSize: size * 0.58, letterSpacing: "0.02em" }}
        >
          MT<span className="text-highway"> Asphalt</span>
        </div>
        {showTagline && (
          <div
            className="data text-steel mt-1"
            style={{ fontSize: Math.max(8, size * 0.2), letterSpacing: "0.18em" }}
          >
            PAVING &amp; MAINTENANCE
          </div>
        )}
      </div>
    </div>
  );
}
