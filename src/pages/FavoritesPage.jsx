import React from 'react';
import ItemDetailView from '../components/ItemDetailView.jsx';
import ItemListRow from '../components/ItemListRow.jsx';
import { pick } from '../lib/ui.js';

export default function FavoritesPage({
  locale,
  favoriteEntries,
  currentId,
  rootId,
  selectRoot,
  getHandbookMissingWarning,
  detailProps,
  toggleFavoriteItem,
}) {
  return (
    <div className="layout">
      <aside className="sidebar">
        <section className="searchPanel">
          <div className="searchLabelRow">
            <h2>{pick({ 'zh-Hans': '我的收藏', 'zh-Hant': '我的收藏', en: 'Favorites' }, locale)}</h2>
            <span>{favoriteEntries.length}</span>
          </div>
        </section>

        <nav className="itemList" aria-label="favorite gear">
          {favoriteEntries.length === 0 ? (
            <div className="emptyList">
              {pick({ 'zh-Hans': '还没有收藏装备。', 'zh-Hant': '還沒有收藏裝備。', en: 'No favorites yet.' }, locale)}
            </div>
          ) : (
            favoriteEntries.map(({ id, item }) => (
              <ItemListRow
                key={id}
                id={id}
                item={item}
                locale={locale}
                levelLabel={pick({ 'zh-Hans': 'Lv.', 'zh-Hant': 'Lv.', en: 'Lv.' }, locale)}
                unrecordedLabel={pick({ 'zh-Hans': '未记录', 'zh-Hant': '未記錄', en: 'Unrecorded' }, locale)}
                currentId={currentId}
                rootId={rootId}
                onSelect={selectRoot}
                warning={getHandbookMissingWarning(item)}
                showFavoriteAction
                isFavorite
                onToggleFavorite={toggleFavoriteItem}
              />
            ))
          )}
        </nav>
      </aside>

      <ItemDetailView {...detailProps} />
    </div>
  );
}
