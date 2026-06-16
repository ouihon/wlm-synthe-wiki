import React from 'react';
import ItemDetailView from '../components/ItemDetailView.jsx';
import TypeTag from '../components/TypeTag.jsx';
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
              <button
                key={id}
                className={cx('itemRow', getHandbookMissingWarning(item) && 'warning', id === currentId && 'current', id === rootId && 'root')}
                onClick={() => selectRoot(id)}
              >
                <span className="itemName">{pick(item.name, locale)}</span>
                <span className="itemMeta itemMetaRow">
                  <span>{item.level ? `${pick({ 'zh-Hans': 'Lv.', 'zh-Hant': 'Lv.', en: 'Lv.' }, locale)}${item.level}` : pick({ 'zh-Hans': '未记录', 'zh-Hant': '未記錄', en: 'Unrecorded' }, locale)}</span>
                  <TypeTag type={item.type} locale={locale} compact />
                </span>
              </button>
            ))
          )}
        </nav>
      </aside>

      <ItemDetailView {...detailProps} />
    </div>
  );
}
