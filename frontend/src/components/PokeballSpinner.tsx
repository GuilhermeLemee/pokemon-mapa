export function PokeballSpinner({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className="animate-spin-slow"
      aria-hidden="true"
    >
      <circle cx="20" cy="20" r="18" fill="#f5f5f5" stroke="#1f2937" strokeWidth="2" />
      <path d="M2 20a18 18 0 0 1 36 0z" fill="#ef4444" stroke="#1f2937" strokeWidth="2" />
      <line x1="2" y1="20" x2="38" y2="20" stroke="#1f2937" strokeWidth="2" />
      <circle cx="20" cy="20" r="6" fill="#f5f5f5" stroke="#1f2937" strokeWidth="2" />
      <circle cx="20" cy="20" r="2.4" fill="#f5f5f5" stroke="#1f2937" strokeWidth="1.5" />
    </svg>
  );
}
