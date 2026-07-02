import React from 'react';
import ItemIcon from './ItemIcon.jsx';
import TypeTag from './TypeTag.jsx';
import { cx, pick } from '../lib/ui.js';

export default function ItemListRow({
  id,
  item,
  locale,
  levelLabel,
  unrecordedLabel,
  currentId,
  rootId,
  onSelect,
  warning,
  showFavoriteAction = false,
  isFavorite = false,
  onToggleFavorite,
}) {
  const itemName = pick(item.name, locale);
  const favoriteLabel = isFavorite
    ? pick({ 'zh-Hans': '取消收藏', 'zh-Hant': '取消收藏', en: 'Remove favorite' }, locale)
    : pick({ 'zh-Hans': '收藏', 'zh-Hant': '收藏', en: 'Favorite' }, locale);

  return (
    <div
      className={cx(
        'itemRow',
        showFavoriteAction && 'withFavorite',
        warning && 'warning',
        id === currentId && 'current',
        id === rootId && 'root',
      )}
    >
      <button className="itemRowMain" type="button" onClick={() => onSelect(id)}>
        <ItemIcon item={item} locale={locale} className="itemRowIcon" decorative placeholder />
        <span className="itemRowText">
          <span className="itemName">{itemName}</span>
          <span className="itemMeta itemMetaRow">
            <span>{item.level ? `${levelLabel}${item.level}` : unrecordedLabel}</span>
            <TypeTag type={item.type} locale={locale} compact />
          </span>
        </span>
      </button>

      {showFavoriteAction ? (
        <button
          className={cx('favoriteBtn', isFavorite && 'active')}
          type="button"
          onClick={() => onToggleFavorite?.(id)}
          aria-pressed={isFavorite}
          aria-label={`${favoriteLabel}：${itemName}`}
          title={favoriteLabel}
        >
          <span aria-hidden="true">{isFavorite ? '★' : '☆'}</span>
          <span className="favoriteBtnText">{favoriteLabel}</span>
        </button>
      ) : null}
    </div>
  );
}
