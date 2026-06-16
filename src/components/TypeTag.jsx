import React from 'react';
import { cx, getTypeTheme, pick } from '../lib/ui.js';

export default function TypeTag({ type, locale, compact = false }) {
  const label = pick(type, locale);
  if (!label) return null;
  const theme = getTypeTheme(label);

  return (
    <span
      className={cx('typeTag', compact && 'compact')}
      style={{
        '--tag-text': theme.text,
        '--tag-border': theme.border,
        '--tag-bg-start': theme.start,
        '--tag-bg-end': theme.end,
        '--tag-shadow': theme.shadow,
      }}
    >
      {label}
    </span>
  );
}
