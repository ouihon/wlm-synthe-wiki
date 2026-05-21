import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import itemsData from './data/items.json';
import uiText from './i18n/ui.json';
import './styles.css';

const LOCALES = [
  { key: 'zh-Hans', label: '简体' },
  { key: 'zh-Hant', label: '繁體' },
  { key: 'en', label: 'EN' },
];

const PAGE_TABS = [
  {
    key: 'inventory',
    label: { 'zh-Hans': '全部装备', 'zh-Hant': '全部裝備', en: 'All Gear' },
  },
  {
    key: 'common',
    label: { 'zh-Hans': '常用装备', 'zh-Hant': '常用裝備', en: 'Common Gear' },
  },
  {
    key: 'guides',
    label: { 'zh-Hans': '资料鸣谢', 'zh-Hant': '資料鳴謝', en: 'Credits' },
  },
];

const COMMON_CATEGORIES = [
  { key: 'ATK', items: [] },
  { key: 'CON', items: [] },
  { key: 'MATK', items: ['black_bishop_robe'] },
  { key: 'WIS', items: [] },
  { key: 'SPD', items: [] },
];

const GUIDE_LINKS = [
  {
    id: 'black-bishop-robe-gg',
    title: {
      'zh-Hans': '黑主教袍合成公式',
      'zh-Hant': '黑主教袍合成公式',
      en: 'Black Bishop Robe Formula',
    },
    provider: 'GG',
    note: {
      'zh-Hans': '本条目配方资料由 GG 提供，感谢整理与分享。',
      'zh-Hant': '本條目配方資料由 GG 提供，感謝整理與分享。',
      en: 'Formula data for this entry was provided by GG.',
    },
    href: 'https://forum.gamer.com.tw/C.php?bsn=31536&snA=1306',
  },
];

const APP_VERSION = 'v0.0.1';
const TYPE_COLOR_MAP = {
  金: 'gold',
  草: 'grass',
  花: 'flower',
  水: 'water',
  木: 'wood',
  火: 'fire',
  地: 'earth',
  魔玉: 'arcane',
};

function pick(value, locale) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value[locale] ?? value['zh-Hans'] ?? Object.values(value)[0] ?? '';
  }
  return value ?? '';
}

function cx(...names) {
  return names.filter(Boolean).join(' ');
}

function getTypeTone(typeLabel) {
  return TYPE_COLOR_MAP[typeLabel] ?? 'neutral';
}

function TypeTag({ type, locale, compact = false }) {
  const label = pick(type, locale);
  if (!label) return null;
  return (
    <span className={cx('typeTag', `tone-${getTypeTone(label)}`, compact && 'compact')}>
      {label}
    </span>
  );
}

function App() {
  const items = itemsData.items;
  const defaultItemId = itemsData.defaultItemId;
  const [locale, setLocale] = useState(() => localStorage.getItem('alchemy-locale') || 'zh-Hans');
  const [pageTab, setPageTab] = useState('inventory');
  const [commonCategory, setCommonCategory] = useState('MATK');
  const [rootId, setRootId] = useState(defaultItemId);
  const [path, setPath] = useState([defaultItemId]);
  const [query, setQuery] = useState('');
  const [recipeChoice, setRecipeChoice] = useState({});

  const t = useMemo(() => uiText[locale] ?? uiText['zh-Hans'], [locale]);

  useEffect(() => {
    localStorage.setItem('alchemy-locale', locale);
    document.documentElement.lang = locale;
    document.title = t.appTitle;
  }, [locale, t.appTitle]);

  const itemEntries = useMemo(() => {
    return Object.entries(items)
      .map(([id, item]) => ({ id, item }))
      .sort((a, b) => (b.item.level || 0) - (a.item.level || 0));
  }, [items]);

  const filteredItems = useMemo(() => {
    const raw = query.trim().toLowerCase();
    if (!raw) return itemEntries;
    return itemEntries.filter(({ item }) => {
      const haystack = [
        pick(item.name, locale),
        pick(item.name, 'zh-Hans'),
        pick(item.type, locale),
        String(item.level ?? ''),
        item.stats ?? '',
      ].join(' ').toLowerCase();
      return haystack.includes(raw);
    });
  }, [itemEntries, query, locale]);

  const currentId = path[path.length - 1];
  const currentItem = items[currentId] ?? items[defaultItemId];
  const rootItem = items[rootId] ?? items[defaultItemId];

  function selectRoot(id) {
    if (!items[id]) return;
    setRootId(id);
    setPath([id]);
    setQuery('');
  }

  function enterMaterial(id) {
    if (!items[id]) return;
    setPath((old) => [...old, id]);
  }

  function jumpTo(index) {
    setPath((old) => old.slice(0, index + 1));
  }

  function preferredRecipeIndex(itemId) {
    const target = items[itemId];
    const recipes = target?.recipes ?? [];
    if (!recipes.length) return -1;
    const picked = recipeChoice[itemId];
    if (Number.isInteger(picked) && recipes[picked]) return picked;
    const recommended = recipes.findIndex((r) => r.recommended && !r.bad);
    return recommended >= 0 ? recommended : 0;
  }

  function setSelectedRecipe(itemId, index) {
    setRecipeChoice((old) => ({ ...old, [itemId]: index }));
  }

  const selectedRecipeIndex = preferredRecipeIndex(currentId);
  const selectedRecipe = selectedRecipeIndex >= 0 ? currentItem.recipes[selectedRecipeIndex] : null;

  const commonEntries = useMemo(() => {
    const category = COMMON_CATEGORIES.find((entry) => entry.key === commonCategory);
    if (!category) return [];
    return category.items
      .map((id) => ({ id, item: items[id] }))
      .filter((entry) => entry.item);
  }, [commonCategory, items]);

  function openPageTab(nextTab) {
    setPageTab(nextTab);
    if (nextTab === 'common') {
      const matCategory = COMMON_CATEGORIES.find((entry) => entry.key === commonCategory) ?? COMMON_CATEGORIES[0];
      const firstId = matCategory.items[0];
      if (firstId && items[firstId]) {
        setRootId(firstId);
        setPath([firstId]);
      }
    }
  }

  function selectCommonCategory(nextCategory) {
    setCommonCategory(nextCategory);
    const category = COMMON_CATEGORIES.find((entry) => entry.key === nextCategory);
    const firstId = category?.items[0];
    if (firstId && items[firstId]) {
      setRootId(firstId);
      setPath([firstId]);
      setQuery('');
    }
  }

  return (
    <div className="appShell">
      <header className="topbar">
        <button className="brand" onClick={() => selectRoot(defaultItemId)} aria-label={t.appTitle}>
          <span className="brandMark">飘</span>
          <span className="brandText">{t.appTitle}</span>
        </button>
        <div className="topActions" aria-label={t.language}>
          {LOCALES.map((entry) => (
            <button
              key={entry.key}
              className={cx('localeBtn', locale === entry.key && 'active')}
              onClick={() => setLocale(entry.key)}
            >
              {entry.label}
            </button>
          ))}
        </div>
      </header>

      <section className="pageTabs" aria-label="page tabs">
        {PAGE_TABS.map((tab) => (
          <button
            key={tab.key}
            className={cx('pageTab', pageTab === tab.key && 'active')}
            onClick={() => openPageTab(tab.key)}
          >
            {pick(tab.label, locale)}
          </button>
        ))}
      </section>

      {pageTab === 'guides' ? (
        <section className="guidePanel">
          <div className="guidePanelHead">
            <h2>{pick({ 'zh-Hans': '资料鸣谢', 'zh-Hant': '資料鳴謝', en: 'Credits' }, locale)}</h2>
            <span>{GUIDE_LINKS.length}</span>
          </div>
          <div className="guideList">
            {GUIDE_LINKS.map((entry) => (
              <a
                key={entry.id}
                className="guideCard"
                href={entry.href}
                target="_blank"
                rel="noreferrer"
              >
                <span className="guideBadge">{entry.provider}</span>
                <strong>{pick(entry.title, locale)}</strong>
                <p className="guideNote">{pick(entry.note, locale)}</p>
                <span className="guideUrl">{entry.href}</span>
                <span className="guideAction">
                  {pick({ 'zh-Hans': '查看原帖', 'zh-Hant': '查看原帖', en: 'View Source' }, locale)}
                </span>
              </a>
            ))}
          </div>
        </section>
      ) : (
        <div className="layout">
          <aside className="sidebar">
            {pageTab === 'inventory' ? (
              <>
                <section className="searchPanel">
                  <div className="searchLabelRow">
                    <h2>{t.inventory}</h2>
                    <span>{t.recordedPrefix} {itemEntries.length} {t.recordedSuffix}</span>
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
                    filteredItems.map(({ id, item }) => (
                      <button
                        key={id}
                        className={cx('itemRow', id === currentId && 'current', id === rootId && 'root')}
                        onClick={() => selectRoot(id)}
                      >
                        <span className="itemName">{pick(item.name, locale)}</span>
                        <span className="itemMeta itemMetaRow">
                          <span>{item.level ? `${t.levelPrefix}${item.level}` : t.unrecorded}</span>
                          <TypeTag type={item.type} locale={locale} compact />
                        </span>
                      </button>
                    ))
                  )}
                </nav>
              </>
            ) : (
              <>
                <section className="searchPanel">
                  <div className="searchLabelRow">
                    <h2>{pick({ 'zh-Hans': '常用装备', 'zh-Hant': '常用裝備', en: 'Common Gear' }, locale)}</h2>
                    <span>{COMMON_CATEGORIES.length}</span>
                  </div>
                  <div className="categoryList">
                    {COMMON_CATEGORIES.map((entry) => (
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
                        className={cx('itemRow', id === currentId && 'current', id === rootId && 'root')}
                        onClick={() => selectRoot(id)}
                      >
                        <span className="itemName">{pick(item.name, locale)}</span>
                        <span className="itemMeta itemMetaRow">
                          <span>{item.level ? `${t.levelPrefix}${item.level}` : t.unrecorded}</span>
                          <TypeTag type={item.type} locale={locale} compact />
                        </span>
                      </button>
                    ))
                  )}
                </nav>
              </>
            )}
          </aside>

          <ItemDetailView
            path={path}
            items={items}
            locale={locale}
            t={t}
            pick={pick}
            jumpTo={jumpTo}
            rootItem={rootItem}
            currentItem={currentItem}
            currentId={currentId}
            selectedRecipe={selectedRecipe}
            selectedRecipeIndex={selectedRecipeIndex}
            setSelectedRecipe={setSelectedRecipe}
            enterMaterial={enterMaterial}
          />
        </div>
      )}

      <footer className="siteFooter">
        <strong>Pepper Cold</strong>
        <span>Version {APP_VERSION}</span>
        <span>Copyright © 2026-{new Date().getFullYear()} Pepper Cold. All rights reserved.</span>
      </footer>
    </div>
  );
}

function ItemDetailView({
  path,
  items,
  locale,
  t,
  pick,
  jumpTo,
  rootItem,
  currentItem,
  currentId,
  selectedRecipe,
  selectedRecipeIndex,
  setSelectedRecipe,
  enterMaterial,
}) {
  return (
    <main className="content">
      <section className="crumbCard" aria-label={t.path}>
        {path.map((id, index) => {
          const crumbItem = items[id];
          if (!crumbItem) return null;
          return (
            <React.Fragment key={`${id}-${index}`}>
              {index > 0 && <span className="crumbArrow">/</span>}
              <button
                className={cx('crumb', index === path.length - 1 && 'active')}
                onClick={() => jumpTo(index)}
              >
                {index === 0 && <span className="rootDot">●</span>}
                {pick(crumbItem.name, locale)}
              </button>
            </React.Fragment>
          );
        })}
      </section>

      <article className="recipeCard">
        <section className="itemHero">
          <div>
            <div className="eyebrow">{pick(rootItem.name, locale) === pick(currentItem.name, locale) ? t.root : t.current}</div>
            <h1>{pick(currentItem.name, locale)}</h1>
          </div>
          <div className="statLine">
            {currentItem.level ? <span className="chip level">{t.levelPrefix}{currentItem.level}</span> : null}
            {pick(currentItem.type, locale) ? (
              <span className="chip typeChip">
                <span className="chipLabel">{t.type}：</span>
                <TypeTag type={currentItem.type} locale={locale} />
              </span>
            ) : null}
            {currentItem.stats ? <span className="chip stat">{currentItem.stats}</span> : null}
          </div>
        </section>

        {selectedRecipe ? (
          <RecipeBlock
            item={currentItem}
            itemId={currentId}
            recipe={selectedRecipe}
            recipeIndex={selectedRecipeIndex}
            items={items}
            locale={locale}
            t={t}
            pick={pick}
            setSelectedRecipe={setSelectedRecipe}
            enterMaterial={enterMaterial}
          />
        ) : (
          <div className="noRecipeBox">
            <strong>{t.noRecipe}</strong>
          </div>
        )}
      </article>
    </main>
  );
}

function RecipeBlock({ item, itemId, recipe, recipeIndex, items, locale, t, pick, setSelectedRecipe, enterMaterial }) {
  const recipes = item.recipes ?? [];

  return (
    <>
      <section className="recipeSwitch">
        <div className="switchHead">
          <span>{t.recipes}</span>
          <small>{recipes.length} {t.recipeCount}</small>
        </div>
        <div className="recipeTabs">
          {recipes.map((entry, index) => (
            <button
              key={index}
              className={cx('recipeTab', index === recipeIndex && 'active', entry.bad && 'danger')}
              onClick={() => setSelectedRecipe(itemId, index)}
            >
              <span>{pick(entry.title, locale)}</span>
              <small>
                {pick(entry.rank, locale)}
                {entry.recommended ? ` · ${t.recommended}` : ''}
                {entry.bad ? ` · ${t.notRecommended}` : ''}
              </small>
            </button>
          ))}
        </div>
      </section>

      <section className="formulaPanel">
        <div className="sectionTitle">{t.formula}</div>
        <div className="formulaLine">
          <strong>{pick(item.name, locale)}</strong>
          <span className="equal">=</span>
          {recipe.materials.map((material, index) => {
            const linked = material.itemId && items[material.itemId];
            const label = pick(material.name, locale) || (linked ? pick(linked.name, locale) : '');
            return (
              <React.Fragment key={`${label}-${index}`}>
                {index > 0 && <span className="plus">+</span>}
                {linked ? (
                  <button className="formulaMaterial" onClick={() => enterMaterial(material.itemId)}>
                    {label}
                  </button>
                ) : (
                  <span className="formulaMaterial plain">{label}</span>
                )}
              </React.Fragment>
            );
          })}
          {pick(recipe.book, locale) && pick(recipe.book, locale) !== pick({ 'zh-Hans': '无', 'zh-Hant': '無', en: '无' }, locale) ? (
            <>
              <span className="plus">+</span>
              <span className="bookTag">{pick(recipe.book, locale)}</span>
            </>
          ) : null}
        </div>
        <div className="recipeMetaLine">
          <span>{t.rank}：{pick(recipe.rank, locale)}</span>
          {entryBool(recipe.recommended) && <span>{t.recommended}</span>}
          {entryBool(recipe.bad) && <span className="badText">{t.notRecommended}</span>}
        </div>
      </section>

      <section className="materialSection">
        <div className="sectionTitle">{t.materials}</div>
        <div className="materialGrid">
          {recipe.materials.map((material, index) => {
            const linked = material.itemId && items[material.itemId];
            const label = pick(material.name, locale) || (linked ? pick(linked.name, locale) : '');
            return (
              <button
                key={`${label}-${index}`}
                className={cx('materialCard', !linked && 'disabled')}
                onClick={() => linked && enterMaterial(material.itemId)}
                disabled={!linked}
              >
                <span className="materialIndex">{String(index + 1).padStart(2, '0')}</span>
                <span className="materialName">{label}</span>
                <span className="materialMeta materialMetaRow">
                  {linked ? (
                    <>
                      <span>{linked.level ? `${t.levelPrefix}${linked.level}` : t.unrecorded}</span>
                      <TypeTag type={linked.type} locale={locale} compact />
                    </>
                  ) : (
                    t.unrecorded
                  )}
                </span>
                <span className="materialAction">{linked ? t.openMaterial : t.unrecorded}</span>
              </button>
            );
          })}
        </div>
      </section>
    </>
  );
}

function entryBool(value) {
  return value === true;
}

createRoot(document.getElementById('root')).render(<App />);
