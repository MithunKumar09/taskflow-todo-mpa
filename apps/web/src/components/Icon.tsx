export function Icon({
  name,
  size = 18,
}: {
  name: 'check' | 'plus' | 'search' | 'edit' | 'trash' | 'arrow' | 'close' | 'list' | 'alert';
  size?: number;
}) {
  const paths = {
    check: 'M5 12l4 4L19 6',
    plus: 'M12 5v14M5 12h14',
    search: 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
    edit: 'M16 3l5 5-12 12H4v-5L16 3zM13 6l5 5',
    trash: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7',
    arrow: 'M19 12H5m6-6-6 6 6 6',
    close: 'M6 6l12 12M6 18 18 6',
    list: 'M8 6h12M8 12h12M8 18h12M3 6h.01M3 12h.01M3 18h.01',
    alert: 'M12 8v5M12 17h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
