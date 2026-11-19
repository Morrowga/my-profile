import type { CSSProperties } from 'react';

/** Frosted glass: dark tint + blur so text stays readable over the bright moving clouds. */
export const FROST: CSSProperties = {
  background: 'rgba(8, 8, 14, 0.62)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
};
