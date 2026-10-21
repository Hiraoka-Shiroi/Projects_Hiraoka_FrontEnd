const shapes = {
  dashboard: ['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M3 14h7v7H3z', 'M14 14h7v7h-7z'],
  roadmap: ['M5 4v16', 'M5 7h10l4 4-4 4H5'],
  book: ['M12 5v15', 'M12 5C9 3 5 3 3 4v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-2-1-6-1-9 1Z'],
  projects: ['M3 7h18v13H3z', 'M8 7V4h8v3', 'M3 12h18', 'M10 12v3h4v-3'],
  chart: ['M4 3v17h17', 'M8 15v-4', 'M13 15V7', 'M18 15V4'],
  code: ['m8 6-6 6 6 6', 'm16 6 6 6-6 6', 'm14 3-4 18'],
  play: ['m8 4 12 8-12 8Z'],
  bookmark: ['M6 3h12v18l-6-4-6 4Z'],
  download: ['M12 3v12', 'm7 10 5 5 5-5', 'M4 16v5h16v-5'],
  check: ['m5 12 4 4L19 6'],
  arrow: ['M4 12h16', 'm13 5 7 7-7 7'],
  target: ['M12 3a9 9 0 1 0 9 9', 'M12 7a5 5 0 1 0 5 5', 'm12 12 9-9', 'M16 3h5v5'],
  copy: ['M9 9h12v12H9z', 'M15 9V3H3v12h6'],
  search: ['M10.5 3a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15', 'm16 16 5 5'],
} as const;
export type IconName = keyof typeof shapes;
export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{shapes[name].map((path, i) => <path key={i} d={path} />)}</svg>;
}
