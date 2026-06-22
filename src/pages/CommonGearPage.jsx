import React from 'react';
import ItemDetailView from '../components/ItemDetailView.jsx';
import ItemListRow from '../components/ItemListRow.jsx';
import { cx, pick } from '../lib/ui.js';

export default function CommonGearPage({
  locale,
  commonCategories,
  commonCategory,
  selectCommonCategory,
  commonEntries,
  currentId,
  rootId,
  selectRoot,
  getHandbookMissingWarning,
  detailProps,
  favoriteItemIdSet,
  toggleFavoriteItem,
}) {
  return (
    <div className="layout">
      <aside className="sidebar">
        <section className="searchPanel">
          <div className="searchLabelRow">
            <h2>{pick({ 'zh-Hans': '常用装备', 'zh-Hant': '常用裝備', en: 'Common Gear' }, locale)}</h2>
            <span>{commonCategories.length}</span>
          </div>
          <div className="categoryList">
            {commonCategories.map((entry) => (
              <button
                key={entry.key}
                className={cx('categoryBtn', commonCategory === entry.key && 'active')}
                onClick={() => selectCommonCategory(entry.key)}
              >
                <span>{entry.key}</span>
                <small>{entry.items.length}</small>
              </button>
            ))}
          </div>
        </section>

        <nav className="itemList" aria-label="common gear">
          {commonEntries.length === 0 ? (
            <div className="emptyList">
              {pick({ 'zh-Hans': '这个分类暂时还没有装备。', 'zh-Hant': '這個分類暫時還沒有裝備。', en: 'No gear in this category yet.' }, locale)}
            </div>
          ) : (
            commonEntries.map(({ id, item }) => (
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
                isFavorite={favoriteItemIdSet?.has(id)}
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
