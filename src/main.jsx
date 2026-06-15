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
    key: 'sheet',
    label: { 'zh-Hans': '试算表', 'zh-Hant': '試算表', en: 'Calculator' },
  },
  {
    key: 'guides',
    label: { 'zh-Hans': '资料鸣谢', 'zh-Hant': '資料鳴謝', en: 'Credits' },
  },
];

const COMMON_CATEGORIES = [
  {
    key: 'ATK',
    items: ['gudia_1da7c8c985', 'gudia_f3acdbeeaa', 'gudia_bfb766cd13', 'gudia_acd8e0a607', 'gudia_57ab719408', 'gudia_79ee2fca6b'],
  },
  { key: 'CON', items: [] },
  { key: 'MATK', items: ['black_bishop_robe', 'gudia_b2ea578080', 'gudia_95b634156d', 'gudia_f583f226fc', 'gudia_cc0f8f730e'] },
  { key: 'WIS', items: [] },
  {
    key: 'SPD',
    items: ['gudia_b91b18ee78', 'gudia_370c597283', 'gudia_42f2a7107b', 'gudia_8f82e6b47e', 'gudia_c8f81c5b16', 'gudia_989941bc54'],
  },
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
  {
    id: 'gu-dia-source',
    title: {
      'zh-Hans': 'Gu Dia 资料来源',
      'zh-Hant': 'Gu Dia 資料來源',
      en: 'Gu Dia Source',
    },
    provider: 'Gu Dia',
    note: {
      'zh-Hans': '部分装备资料来源于 Gu Dia。',
      'zh-Hant': '部分裝備資料來源於 Gu Dia。',
      en: 'Some item data comes from Gu Dia.',
    },
    href: 'https://www.facebook.com/groups/1759640994357521/user/61567112734121',
  },
];

const APP_VERSION = 'v0.0.4';
const BRAND_ICON_SRC = `${import.meta.env.BASE_URL}favicon.ico`;
const RECIPE_CHOICE_STORAGE_KEY = 'alchemy-recipe-choice';
const TYPE_ORDER = [
  '钢',
  '铁',
  '铜',
  '钛',
  '赤铁',
  '铅',
  '锡',
  '金',
  '银',
  '白银',
  '铝',
  '兽骨',
  '岩石',
  '皮',
  '花',
  '草',
  '叶',
  '兽毛',
  '羽毛',
  '木',
  '魔玉',
  '水晶',
  '结晶',
  '钻石',
  '宝',
  '玉',
  '尼龙',
  '壳',
  '硅',
  '果',
  '肉',
  '泌',
];
const TYPE_THEME_MAP = {
  钢: makeTypeTheme('#1f2a3b', '#8a97a8', '#e8edf3', '#c9d2de'),
  铁: makeTypeTheme('#3a4049', '#a7afb8', '#edf0f3', '#cbd2d9'),
  铜: makeTypeTheme('#7b4a1f', '#dfb08a', '#fff0e4', '#f0d4bf'),
  钛: makeTypeTheme('#36506e', '#b6c7db', '#edf4fb', '#d5e2ef'),
  赤铁: makeTypeTheme('#7a3028', '#db9d93', '#fff0ef', '#f1d0cb'),
  铅: makeTypeTheme('#4a5563', '#b3bcc8', '#eef2f7', '#d5dde6'),
  锡: makeTypeTheme('#627082', '#c7d0db', '#f4f7fb', '#dbe3ec'),
  金: makeTypeTheme('#8b5b00', '#f0c566', '#fff6d8', '#f3deaa'),
  银: makeTypeTheme('#5d6773', '#d4d8de', '#f7f9fc', '#e1e7ee'),
  白银: makeTypeTheme('#74808d', '#eef2f5', '#fbfcfe', '#e3e8ee'),
  铝: makeTypeTheme('#58768e', '#d2e4f1', '#f4fbff', '#deebf6'),
  兽骨: makeTypeTheme('#7b735f', '#e0d7c1', '#fbf8f0', '#e8dec8'),
  岩石: makeTypeTheme('#5e646d', '#c8cfd8', '#f3f5f8', '#d8e0e8'),
  皮: makeTypeTheme('#8e6449', '#e4b48e', '#fff4ec', '#efd2bd'),
  花: makeTypeTheme('#b12b4f', '#f0a0b7', '#fff1f5', '#f3d4df'),
  草: makeTypeTheme('#2f7b35', '#9fd19f', '#edf9ee', '#d1ecd2'),
  叶: makeTypeTheme('#5b8a2a', '#c1e08f', '#f3fbeb', '#ddebbe'),
  兽毛: makeTypeTheme('#8a5d3b', '#e0b08c', '#fff4eb', '#efd6c5'),
  羽毛: makeTypeTheme('#4d7ca8', '#c5dcf1', '#f2f9ff', '#d8e8f4'),
  木: makeTypeTheme('#6e4f31', '#d8b28f', '#fbf4ec', '#e9d5c3'),
  魔玉: makeTypeTheme('#6a1fa2', '#d9b2ff', '#f8f1ff', '#e5d3f7'),
  水晶: makeTypeTheme('#008a9f', '#9fe5ef', '#eefcff', '#cbeef2'),
  结晶: makeTypeTheme('#0f8f7e', '#8fe1d7', '#effdfb', '#cbeee7'),
  钻石: makeTypeTheme('#1e78d1', '#b7dcff', '#eff8ff', '#d6e8f8'),
  宝: makeTypeTheme('#6d3bb8', '#d0b4ff', '#f8f2ff', '#e4d6f6'),
  玉: makeTypeTheme('#0c8d63', '#a8e2c7', '#effbf5', '#d0ecdf'),
  尼龙: makeTypeTheme('#2d6c9a', '#a9d2ef', '#eff8ff', '#d1e5f3'),
  壳: makeTypeTheme('#b06b82', '#f0bfd0', '#fff4f8', '#edd5de'),
  硅: makeTypeTheme('#4e7f8a', '#b8e0e6', '#f0fbfc', '#d7eaee'),
  果: makeTypeTheme('#d26f1f', '#ffd1a0', '#fff6ec', '#f6ddc3'),
  肉: makeTypeTheme('#c15f67', '#f0b7ba', '#fff3f4', '#f0d2d3'),
  泌: makeTypeTheme('#7c9a34', '#d5ea9d', '#f5fce8', '#dfecc2'),
  __default: makeTypeTheme('#455164', '#ced7e2', '#f6f9fc', '#dbe3ed'),
};

function makeTypeTheme(text, border, start, end, shadow = 'rgba(22, 32, 49, 0.10)') {
  return { text, border, start, end, shadow };
}

function pick(value, locale) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value[locale] ?? value['zh-Hans'] ?? Object.values(value)[0] ?? '';
  }
  return value ?? '';
}

function cx(...names) {
  return names.filter(Boolean).join(' ');
}

function getTypeTheme(typeLabel) {
  return TYPE_THEME_MAP[typeLabel] ?? TYPE_THEME_MAP.__default;
}

function TypeTag({ type, locale, compact = false }) {
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

function getHandbookMissingWarning(item) {
  const strings = [];
  if (!item) return false;
  if (typeof item.note === 'string') strings.push(item.note);
  if (typeof item.note === 'object' && item.note) {
    strings.push(...Object.values(item.note).filter((value) => typeof value === 'string'));
  }
  if (Array.isArray(item.notes)) {
    for (const note of item.notes) {
      if (typeof note === 'string') {
        strings.push(note);
      } else if (note && typeof note === 'object') {
        strings.push(...Object.values(note).filter((value) => typeof value === 'string'));
      }
    }
  }
  if (Array.isArray(item.flags) && item.flags.includes('missing_in_handbook')) {
    return true;
  }
  return strings.some((text) => text.includes('手飘无此装') || text.includes('手飄無此裝'));
}

function getCanonicalType(value) {
  return pick(value, 'zh-Hans').trim();
}

function getMaterialType(material, items) {
  if (!material) return null;
  if (material.itemId) {
    const linked = items[material.itemId];
    const linkedType = getCanonicalType(linked?.type);
    return linkedType && linkedType !== '未知' ? linkedType : null;
  }
  const materialType = getCanonicalType(material.type);
  return materialType && materialType !== '未知' ? materialType : null;
}

function getRecipeTypeChain(recipe, items) {
  const materials = recipe?.materials ?? [];
  if (!materials.length) return null;
  const chain = [];
  for (const material of materials) {
    const type = getMaterialType(material, items);
    if (!type) return null;
    chain.push(type);
  }
  return chain;
}

function normalizeTypeChain(chain) {
  if (!Array.isArray(chain) || !chain.length) return [];

  const normalized = [chain[0]];
  const seen = new Set();

  for (const type of chain.slice(1)) {
    if (!type || seen.has(type)) continue;
    seen.add(type);
    normalized.push(type);
  }

  return normalized;
}

function getTypeMatchRank(recipeChain, queryChain) {
  const normalizedRecipe = normalizeTypeChain(recipeChain);
  const normalizedQuery = normalizeTypeChain(queryChain);

  if (!normalizedRecipe.length || !normalizedQuery.length) return null;
  if (normalizedRecipe[0] !== normalizedQuery[0]) return null;

  const recipeSubs = new Set(normalizedRecipe.slice(1));
  const querySubs = normalizedQuery.slice(1);

  for (const type of querySubs) {
    if (!recipeSubs.has(type)) return null;
  }

  return recipeSubs.size === querySubs.length ? 0 : 1;
}

function matchTypeChain(recipeChain, queryChain) {
  return getTypeMatchRank(recipeChain, queryChain) !== null;
}

function getRecipeMaterialNames(recipe, items, locale) {
  return (recipe?.materials ?? []).map((material) => {
    const linked = material.itemId ? items[material.itemId] : null;
    return pick(material.name, locale) || (linked ? pick(linked.name, locale) : '') || pick(material.name, 'zh-Hans') || '?';
  });
}

function buildRecipeDisplay(recipe, items, locale) {
  const title = pick(recipe.title, locale) || pick(recipe.title, 'zh-Hans') || '未命名配方';
  const materials = getRecipeMaterialNames(recipe, items, locale).join(' + ');
  const meta = [
    pick(recipe.source, locale),
    pick(recipe.book, locale) && pick(recipe.book, locale) !== '无' && pick(recipe.book, locale) !== '無' ? pick(recipe.book, locale) : '',
    pick(recipe.rank, locale),
    recipe.recommended ? pick({ 'zh-Hans': '推荐', 'zh-Hant': '推薦', en: 'Recommended' }, locale) : '',
  ].filter(Boolean).join(' / ');
  return `${title}：${materials}${meta ? `（${meta}）` : ''}`;
}

function getTypeOptions(items) {
  const existing = new Set();
  for (const item of Object.values(items)) {
    const type = getCanonicalType(item.type);
    if (type && type !== '未知') existing.add(type);
  }
  const ordered = TYPE_ORDER.filter((type) => existing.has(type));
  const extras = [...existing].filter((type) => !TYPE_ORDER.includes(type)).sort((a, b) => a.localeCompare(b, 'zh-Hans'));
  return [...ordered, ...extras];
}

function queryAlchemySheet({ items, minLevel, maxLevel, queryChain, locale }) {
  const normalizedQueryChain = normalizeTypeChain(queryChain);
  if (!normalizedQueryChain.length) return [];
  const rowsByItem = new Map();

  for (const [itemId, item] of Object.entries(items)) {
    const level = Number(item.level ?? 0);
    if (!Number.isFinite(level) || level < minLevel || level > maxLevel) continue;

    const matchingRecipes = [];
    const recipes = item.recipes ?? [];
    recipes.forEach((recipe, originalIndex) => {
      if (recipe.bad === true) return;
      const recipeChain = getRecipeTypeChain(recipe, items);
      const normalizedRecipeChain = normalizeTypeChain(recipeChain);
      const matchRank = getTypeMatchRank(normalizedRecipeChain, normalizedQueryChain);
      if (matchRank === null) return;
      matchingRecipes.push({ recipe, originalIndex, recipeChain, normalizedRecipeChain, matchRank });
    });

    if (!matchingRecipes.length) continue;

    matchingRecipes.sort((a, b) => {
      if (a.matchRank !== b.matchRank) return a.matchRank - b.matchRank;
      if (a.recipe.recommended !== b.recipe.recommended) return a.recipe.recommended ? -1 : 1;
      return a.originalIndex - b.originalIndex;
    });

    rowsByItem.set(itemId, {
      itemId,
      level,
      name: pick(item.name, locale) || pick(item.name, 'zh-Hans'),
      stats: item.stats ?? '',
      chain: matchingRecipes[0]?.normalizedRecipeChain ?? [],
      matchRank: matchingRecipes[0]?.matchRank ?? 1,
      recipes: matchingRecipes.map(({ recipe }) => buildRecipeDisplay(recipe, items, locale)),
    });
  }

  return [...rowsByItem.values()].sort((a, b) => {
    if (a.matchRank !== b.matchRank) return a.matchRank - b.matchRank;
    if (a.level !== b.level) return b.level - a.level;
    return a.name.localeCompare(b.name, locale === 'en' ? 'en' : 'zh-Hans');
  });
}

function App() {
  const items = itemsData.items;
  const defaultItemId = itemsData.defaultItemId;
  const [locale, setLocale] = useState(() => localStorage.getItem('alchemy-locale') || 'zh-Hans');
  const [pageTab, setPageTab] = useState('inventory');
  const [commonCategory, setCommonCategory] = useState('MATK');
  const [typeFilter, setTypeFilter] = useState('all');
  const [rootId, setRootId] = useState(defaultItemId);
  const [path, setPath] = useState([defaultItemId]);
  const [query, setQuery] = useState('');
  const [recipeChoice, setRecipeChoice] = useState(() => {
    try {
      const raw = localStorage.getItem(RECIPE_CHOICE_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  });

  const t = useMemo(() => uiText[locale] ?? uiText['zh-Hans'], [locale]);

  useEffect(() => {
    localStorage.setItem('alchemy-locale', locale);
    document.documentElement.lang = locale;
    document.title = t.appTitle;
  }, [locale, t.appTitle]);

  useEffect(() => {
    localStorage.setItem(RECIPE_CHOICE_STORAGE_KEY, JSON.stringify(recipeChoice));
  }, [recipeChoice]);

  const itemEntries = useMemo(() => {
    return Object.entries(items)
      .map(([id, item]) => ({ id, item }))
      .sort((a, b) => (b.item.level || 0) - (a.item.level || 0));
  }, [items]);

  const filteredItems = useMemo(() => {
    const raw = query.trim().toLowerCase();
    return itemEntries.filter(({ item }) => {
      if (typeFilter !== 'all' && pick(item.type, 'zh-Hans') !== typeFilter) return false;
      const haystack = [
        pick(item.name, locale),
        pick(item.name, 'zh-Hans'),
        pick(item.type, locale),
        String(item.level ?? ''),
        item.stats ?? '',
      ].join(' ').toLowerCase();
      return !raw || haystack.includes(raw);
    });
  }, [itemEntries, query, locale, typeFilter]);

  const currentId = path[path.length - 1];
  const currentItem = items[currentId] ?? items[defaultItemId];
  const rootItem = items[rootId] ?? items[defaultItemId];
  const currentWarning = getHandbookMissingWarning(currentItem);
  const allTypeTheme = getTypeTheme('__default');

  function selectRoot(id) {
    if (!items[id]) return;
    setRootId(id);
    setPath([id]);
    setQuery('');
  }

  function openItemFromSheet(id) {
    if (!items[id]) return;
    setPageTab('inventory');
    selectRoot(id);
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
          <span className="brandMark">
            <img src={BRAND_ICON_SRC} alt="" />
          </span>
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

      {pageTab === 'inventory' ? (
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
            {TYPE_ORDER.map((type) => {
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
      ) : null}

      {pageTab === 'sheet' ? (
        <AlchemySheet items={items} locale={locale} onOpenItem={openItemFromSheet} />
      ) : pageTab === 'guides' ? (
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
                    filteredItems.map(({ id, item }) => (
                      <button
                        key={id}
                        className={cx('itemRow', getHandbookMissingWarning(item) && 'warning', id === currentId && 'current', id === rootId && 'root')}
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
                        className={cx('itemRow', getHandbookMissingWarning(item) && 'warning', id === currentId && 'current', id === rootId && 'root')}
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
            currentWarning={currentWarning}
            handbookMissingLabel={pick({ 'zh-Hans': '手飘无此装', 'zh-Hant': '手飄無此裝', en: 'Not listed in Wonderland M' }, locale)}
            handbookMissingHint={pick({
              'zh-Hans': '飘流幻境M不存在此装备，请留意来源。',
              'zh-Hant': '飄流幻境M不存在此裝備，請留意來源。',
              en: 'Wonderland M does not list this gear. Please check the source.',
            }, locale)}
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


function AlchemySheet({ items, locale, onOpenItem }) {
  const text = {
    title: pick({ 'zh-Hans': '试算表', 'zh-Hant': '試算表', en: 'Alchemy Calculator' }, locale),
    subtitle: pick({
      'zh-Hans': '按等级和物属查询配方，支持模糊匹配，例如 花+草 可查到 花草金。',
      'zh-Hant': '按等級和物屬查詢配方，支援模糊匹配，例如 花+草 可查到 花草金。',
      en: 'Search recipes by level and type with fuzzy matching, e.g. Flower + Grass can find Flower-Grass-Metal.',
    }, locale),
    minLevel: pick({ 'zh-Hans': '最低等级', 'zh-Hant': '最低等級', en: 'Min Lv.' }, locale),
    maxLevel: pick({ 'zh-Hans': '最高等级', 'zh-Hant': '最高等級', en: 'Max Lv.' }, locale),
    mainType: pick({ 'zh-Hans': '主属', 'zh-Hant': '主屬', en: 'Main type' }, locale),
    subType: pick({ 'zh-Hans': '副属', 'zh-Hant': '副屬', en: 'Sub type' }, locale),
    query: pick({ 'zh-Hans': '查询', 'zh-Hant': '查詢', en: 'Search' }, locale),
    reset: pick({ 'zh-Hans': '重置', 'zh-Hant': '重置', en: 'Reset' }, locale),
    selectType: pick({ 'zh-Hans': '请选择', 'zh-Hant': '請選擇', en: 'Select' }, locale),
    result: pick({ 'zh-Hans': '查询结果', 'zh-Hant': '查詢結果', en: 'Results' }, locale),
    emptyBefore: pick({ 'zh-Hans': '选择主属后点击查询。', 'zh-Hant': '選擇主屬後點擊查詢。', en: 'Choose a main type, then search.' }, locale),
    emptyResult: pick({ 'zh-Hans': '没有符合条件的配方。', 'zh-Hant': '沒有符合條件的配方。', en: 'No matching recipes.' }, locale),
    exactChain: pick({ 'zh-Hans': '匹配物属', 'zh-Hant': '匹配物屬', en: 'Matched types' }, locale),
    legalRef: pick({ 'zh-Hans': '参考合法', 'zh-Hant': '參考合法', en: 'Valid references' }, locale),
    level: pick({ 'zh-Hans': '等级', 'zh-Hant': '等級', en: 'Level' }, locale),
    itemName: pick({ 'zh-Hans': '物品名称', 'zh-Hant': '物品名稱', en: 'Item' }, locale),
    stats: pick({ 'zh-Hans': '数值', 'zh-Hant': '數值', en: 'Stats' }, locale),
  };

  const typeOptions = useMemo(() => getTypeOptions(items), [items]);
  const [minLevel, setMinLevel] = useState('1');
  const [maxLevel, setMaxLevel] = useState('90');
  const [mainType, setMainType] = useState('');
  const [subTypes, setSubTypes] = useState(['', '', '', '']);
  const [activeParams, setActiveParams] = useState(null);

  const queryChain = useMemo(() => {
    return [mainType, ...subTypes.filter(Boolean)].filter(Boolean);
  }, [mainType, subTypes]);

  const activeRows = useMemo(() => {
    if (!activeParams?.queryChain?.length) return [];
    return queryAlchemySheet({
      items,
      minLevel: activeParams.minLevel,
      maxLevel: activeParams.maxLevel,
      queryChain: activeParams.queryChain,
      locale,
    });
  }, [activeParams, items, locale]);

  function updateSubType(index, value) {
    setSubTypes((old) => old.map((entry, i) => (i === index ? value : entry)));
  }

  function runQuery(event) {
    event?.preventDefault();
    const min = Math.max(1, Number.parseInt(minLevel, 10) || 1);
    const max = Math.max(min, Number.parseInt(maxLevel, 10) || 90);
    const chain = [mainType, ...subTypes.filter(Boolean)].filter(Boolean);
    setMinLevel(String(min));
    setMaxLevel(String(max));
    setActiveParams({ minLevel: min, maxLevel: max, queryChain: chain });
  }

  function resetForm() {
    setMinLevel('1');
    setMaxLevel('90');
    setMainType('');
    setSubTypes(['', '', '', '']);
    setActiveParams(null);
  }

  const shownChain = activeParams?.queryChain?.length ? activeParams.queryChain : queryChain;

  return (
    <section className="sheetPanel">
      <div className="sheetHero">
        <div>
          <div className="eyebrow">ALCHEMY SHEET</div>
          <h2>{text.title}</h2>
          <p>{text.subtitle}</p>
        </div>
        <div className="sheetChainPreview" aria-label={text.exactChain}>
          <span>{text.exactChain}</span>
          <strong>{shownChain.length ? shownChain.join(' + ') : '—'}</strong>
        </div>
      </div>

      <form className="sheetForm" onSubmit={runQuery}>
        <label className="sheetField small">
          <span>{text.minLevel}</span>
          <input
            type="number"
            min="1"
            max="999"
            value={minLevel}
            onChange={(event) => setMinLevel(event.target.value)}
          />
        </label>
        <label className="sheetField small">
          <span>{text.maxLevel}</span>
          <input
            type="number"
            min="1"
            max="999"
            value={maxLevel}
            onChange={(event) => setMaxLevel(event.target.value)}
          />
        </label>
        <label className="sheetField">
          <span>{text.mainType}</span>
          <select value={mainType} onChange={(event) => setMainType(event.target.value)} required>
            <option value="">{text.selectType}</option>
            {typeOptions.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </label>
        {subTypes.map((value, index) => (
          <label className="sheetField" key={index}>
            <span>{text.subType}{index + 1}</span>
            <select value={value} onChange={(event) => updateSubType(index, event.target.value)}>
              <option value="">—</option>
              {typeOptions.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
        ))}
        <div className="sheetActions">
          <button className="primaryAction" type="submit" disabled={!mainType}>{text.query}</button>
          <button className="secondaryAction" type="button" onClick={resetForm}>{text.reset}</button>
        </div>
      </form>

      <div className="sheetResultHead">
        <div>
          <h3>{text.result}</h3>
          <span>
            {activeParams?.queryChain?.length ? `${activeRows.length} ${pick({ 'zh-Hans': '个物品', 'zh-Hant': '個物品', en: 'items' }, locale)}` : text.emptyBefore}
          </span>
        </div>
      </div>

      {!activeParams?.queryChain?.length ? (
        <div className="sheetEmpty">{text.emptyBefore}</div>
      ) : activeRows.length === 0 ? (
        <div className="sheetEmpty">{text.emptyResult}</div>
      ) : (
        <div className="sheetTableWrap">
          <table className="sheetTable">
            <thead>
              <tr>
                <th>{text.level}</th>
                <th>{text.itemName}</th>
                <th>{text.stats}</th>
                <th>{text.mainType}</th>
                {[0, 1, 2, 3].map((index) => <th key={index}>{text.subType}{index + 1}</th>)}
                <th>{text.legalRef}</th>
              </tr>
            </thead>
            <tbody>
              {activeRows.map((row) => (
                <tr key={row.itemId}>
                  <td className="levelCell">{row.level}</td>
                  <td>
                    <button className="sheetItemLink" type="button" onClick={() => onOpenItem(row.itemId)}>
                      {row.name}
                    </button>
                  </td>
                  <td className="statsCell">{row.stats || '—'}</td>
                  {[0, 1, 2, 3, 4].map((index) => (
                    <td key={index} className="typeCell">
                      {row.chain[index] ? <TypeTag type={row.chain[index]} locale={locale} compact /> : <span className="mutedDash">—</span>}
                    </td>
                  ))}
                  <td className="recipeRefCell">
                    {row.recipes.map((line, index) => (
                      <div key={index}>{line}</div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
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
  currentWarning,
  handbookMissingLabel,
  handbookMissingHint,
}) {
  return (
    <main className={cx('content', currentWarning && 'warning')}>
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
          <div className="heroMeta">
            {currentItem.level ? <div className="heroMetaLine">{t.levelPrefix}{currentItem.level}</div> : null}
            {pick(currentItem.type, locale) ? (
              <div className="heroMetaLine">
                <span className="heroMetaLabel">{t.type}：</span>
                <span>{pick(currentItem.type, locale)}</span>
              </div>
            ) : null}
            {currentItem.stats ? <div className="heroMetaLine">{currentItem.stats}</div> : null}
          </div>
        </section>

        {currentWarning ? (
          <div className="warningBanner" role="note" aria-label={handbookMissingLabel}>
            <strong>{handbookMissingLabel}</strong>
            <span>{handbookMissingHint}</span>
          </div>
        ) : null}

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
          <div className="switchHeadTitle">
            <span>{t.recipes}</span>
            <small>{recipes.length} {t.recipeCount}</small>
          </div>
        </div>
        <div className="recipeTabs">
          {recipes.map((entry, index) => (
            <button
              key={index}
              className={cx('recipeTab', index === recipeIndex && 'active', entry.bad && 'danger')}
              onClick={() => setSelectedRecipe(itemId, index)}
            >
              <div className="recipeTabTop">
                <span className="recipeTabTitle">{pick(entry.title, locale)}</span>
                {entry.source ? (
                  <span className="recipeTabSource">
                    {t.recipeSourcePrefix}
                    {pick(entry.source, locale)}
                  </span>
                ) : null}
              </div>
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
