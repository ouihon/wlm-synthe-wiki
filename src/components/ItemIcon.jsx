import React from 'react';
import { cx, pick } from '../lib/ui.js';

const iconModules = import.meta.glob('../data/icons/*', {
  eager: true,
  query: '?url',
  import: 'default',
});

const iconSrcByFileName = Object.fromEntries(
  Object.entries(iconModules).map(([path, src]) => [path.split('/').pop(), src]),
);

export function getItemIconSrc(item) {
  if (!item?.icon) return '';
  return iconSrcByFileName[item.icon] ?? '';
}

export default function ItemIcon({ item, locale, className, decorative = false, placeholder = false }) {
  const src = getItemIconSrc(item);
  if (!src && !placeholder) return null;

  const name = pick(item.name, locale);

  return (
    <span
      className={cx('itemIconFrame', !src && 'missing', className)}
      aria-hidden={decorative || !src || undefined}
      title={!src && !decorative ? name : undefined}
    >
      {src ? (
        <img
          className="itemIconImage"
          src={src}
          alt={decorative ? '' : name}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <span className="itemIconFallback" aria-hidden="true">?</span>
      )}
    </span>
  );
}
