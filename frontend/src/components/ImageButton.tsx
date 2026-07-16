export function ImageButton({
  src,
  alt,
  onClick,
}: {
  src: string;
  alt: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-36 w-auto shrink-0 overflow-hidden rounded-2xl transition-transform hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-300"
    >
      <img src={src} alt={alt} className="h-full w-auto object-contain" />
    </button>
  );
}
