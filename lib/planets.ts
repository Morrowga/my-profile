export type SectionId =
  | 'hero' | 'about' | 'work' | 'lab' | 'apps' | 'certs' | 'contact' | 'life';

export interface MenuItem {
  id: SectionId;
  /** Short name shown in the menu */
  label: string;
  /** One short line under the active label */
  hint: string;
  /** Texture map (2:1, wraps around the sphere) */
  texture: string;
  /** Rim glow colour */
  glow: string;
  /** Planet radius multiplier (relative to the stage radius) */
  scale: number;
  /** Axial tilt in degrees */
  tilt: number;
  /** Spin speed in radians/second */
  spin: number;
  /** Self-lit (sun) — ignores lighting */
  emissive?: boolean;
  ring?: string;
  /** Small moon drawn beside the planet */
  moon?: string;
}

export const MENU: MenuItem[] = [
  { id: 'hero',    label: 'Home',    hint: 'Scroll to explore',     texture: '/planets/earth.webp',   glow: '#5aa2ff', scale: 0.92, tilt: 23, spin: 0.07, moon: '/planets/moon.webp' },
  { id: 'about',   label: 'About',   hint: 'Who I am',              texture: '/planets/sun.webp',     glow: '#ff9a1f', scale: 1,    tilt: 7,  spin: 0.05, emissive: true },
  { id: 'work',    label: 'Work',    hint: 'Skills & projects',     texture: '/planets/jupiter.webp', glow: '#e8b98a', scale: 1,    tilt: 3,  spin: 0.06 },
  { id: 'lab',     label: 'Lab',     hint: 'Live system testing',   texture: '/planets/mars.webp',    glow: '#ff7a45', scale: 0.88, tilt: 25, spin: 0.06 },
  { id: 'apps',    label: 'Apps',    hint: 'Mobile showroom',       texture: '/planets/saturn.webp',  glow: '#f1d9a0', scale: 0.72, tilt: 30, spin: 0.06, ring: '/planets/saturn-ring.webp' },
  { id: 'certs',   label: 'Certs',   hint: 'Recommendations',       texture: '/planets/venus.webp',   glow: '#ffd98a', scale: 0.9,  tilt: 3,  spin: 0.04 },
  { id: 'contact', label: 'Contact', hint: 'Say hello',             texture: '/planets/neptune.webp', glow: '#4f7bff', scale: 0.9,  tilt: 28, spin: 0.06 },
  { id: 'life',    label: 'Life',    hint: 'Personality', texture: '/planets/uranus.webp',  glow: '#6ff0ff', scale: 0.9,  tilt: 12, spin: 0.05 },
];
