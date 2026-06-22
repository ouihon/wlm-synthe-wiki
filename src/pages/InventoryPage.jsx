import React from 'react';
import ItemDetailView from '../components/ItemDetailView.jsx';
import ItemListRow from '../components/ItemListRow.jsx';
import { cx } from '../lib/ui.js';

export default function InventoryPage({
  t,
  locale,
  typeFilter,
  setTypeFilter,
  allTypeTheme,
  typeOrder,
  getTypeTheme,
  filteredItems,
  query,
  setQuery,
  currentId,
  rootId,
  selectRoot,
  getHandbookMissingWarning,
  detailProps,
  favoriteItemIdSet,
  toggleFavoriteItem,
  onSearchResultClick,
}) {
  return (
    <>
      <section className="inventoryFilterPanel" aria-label={t.typeFilter}>
        <div className="inventoryFilterHead">
          <h2>{t.typeFilter}</h2>
          <span>{typeFilter === 'all' ? t.allTypes : typeFilter}</span>
        </div>
        <div className="typeFilterBar">
          <button
            className={cx('typeFilterBtn', typeFilter === 'all' && 'active')}
            onClick={() => setTypeFilter('all')}
            style={{
              '--tag-text': allTypeTheme.text,
              '--tag-border': allTypeTheme.border,
              '--tag-bg-start': allTypeTheme.start,
              '--tag-bg-end': allTypeTheme.end,
              '--tag-shadow': allTypeTheme.shadow,
            }}
          >
            {t.allTypes}
          </button>
          {typeOrder.map((type) => {
            const theme = getTypeTheme(type);
            return (
              <button
                key={type}
                className={cx('typeFilterBtn', typeFilter === type && 'active')}
                onClick={() => setTypeFilter(type)}
                style={{
                  '--tag-text': theme.text,
                  '--tag-border': theme.border,
                  '--tag-bg-start': theme.start,
                  '--tag-bg-end': theme.end,
                  '--tag-shadow': theme.shadow,
                }}
              >
                {type}
              </button>
            );
          })}
        </div>
      </section>

      <div className="layout">
        <aside className="sidebar">
          <section className="searchPanel">
            <div className="searchLabelRow">
              <h2>{t.inventory}</h2>
              <span>{t.recordedPrefix} {filteredItems.length} {t.recordedSuffix}</span>
            </div>
            <div className="searchBox">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t.searchPlaceholder}
                spellCheck="false"
              />
            </div>
          </section>

          <nav className="itemList" aria-label={t.allItems}>
            {filteredItems.length === 0 ? (
              <div className="emptyList">{t.emptySearch}</div>
            ) : (
              filteredItems.map(({ id, item }, index) => (
                <ItemListRow
                  key={id}
                  id={id}
                  item={item}
                  locale={locale}
                  levelLabel={t.levelPrefix}
                  unrecordedLabel={t.unrecorded}
                  currentId={currentId}
                  rootId={rootId}
                  onSelect={() => {
                    onSearchResultClick?.({ id, item, position: index + 1 });
                    selectRoot(id);
                  }}
                  warning={getHandbookMissingWarning(item)}
                  showFavoriteAction
                  isFavorite={favoriteItemIdSet?.has(id)}
                  onToggleFavorite={toggleFavoriteItem}
                />
              ))
            )}
          </nav>
        </aside>

        <ItemDetailView {...detailProps} />
      </div>
    </>
  );
}
