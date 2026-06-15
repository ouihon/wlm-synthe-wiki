import React, { useEffect, useMemo, useState } from 'react';
import ReactFlow, { Background, Controls, Handle, MiniMap, Position, ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import { createRoot } from 'react-dom/client';
import itemsData from './data/items.json';
import dungeonMaterialCraftingTreeData from './data/dungeon_material_crafting_tree.json';
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
    key: 'dungeonTree',
    label: { 'zh-Hans': '副本材料合成树', 'zh-Hant': '副本材料合成樹', en: 'Dungeon Material Tree' },
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
const DUNGEON_PRODUCT_COLLAPSE_LIMIT = 24;
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
      ) : pageTab === 'dungeonTree' ? (
        <DungeonMaterialCraftingTree data={dungeonMaterialCraftingTreeData} items={items} locale={locale} onOpenItem={openItemFromSheet} />
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



function DungeonMaterialCraftingTree({ data, items, locale, onOpenItem }) {
  const text = {
    title: pick({ 'zh-Hans': '副本材料合成树', 'zh-Hant': '副本材料合成樹', en: 'Dungeon Material Tree' }, locale),
    subtitle: pick({
      'zh-Hans': '选择副本材料，查看它能继续合成的装备与完整合成路径。',
      'zh-Hant': '選擇副本材料，查看它能繼續合成的裝備與完整合成路徑。',
      en: 'Choose a dungeon material to inspect craftable gear and full crafting paths.',
    }, locale),
    materialSearch: pick({ 'zh-Hans': '搜索副本材料', 'zh-Hant': '搜尋副本材料', en: 'Search materials' }, locale),
    productSearch: pick({ 'zh-Hans': '搜索产物名称', 'zh-Hant': '搜尋產物名稱', en: 'Search products' }, locale),
    materials: pick({ 'zh-Hans': '副本材料', 'zh-Hant': '副本材料', en: 'Dungeon Materials' }, locale),
    products: pick({ 'zh-Hans': '可合成产物', 'zh-Hant': '可合成產物', en: 'Craftable Items' }, locale),
    tree: pick({ 'zh-Hans': '合成树', 'zh-Hant': '合成樹', en: 'Crafting Tree' }, locale),
    graphHint: pick({ 'zh-Hans': '滚轮缩放，拖拽移动，点击节点跳转具体配方。', 'zh-Hant': '滾輪縮放，拖拽移動，點擊節點跳轉具體配方。', en: 'Scroll to zoom, drag to pan, click an item node to open its recipe.' }, locale),
    all: pick({ 'zh-Hans': '全部', 'zh-Hant': '全部', en: 'All' }, locale),
    level: pick({ 'zh-Hans': '等级', 'zh-Hant': '等級', en: 'Level' }, locale),
    type: pick({ 'zh-Hans': '物属', 'zh-Hant': '物屬', en: 'Type' }, locale),
    stats: pick({ 'zh-Hans': '数值', 'zh-Hant': '數值', en: 'Stats' }, locale),
    recipe: pick({ 'zh-Hans': '配方', 'zh-Hant': '配方', en: 'Recipe' }, locale),
    relation: pick({ 'zh-Hans': '关系', 'zh-Hant': '關係', en: 'Relation' }, locale),
    source: pick({ 'zh-Hans': '来源', 'zh-Hant': '來源', en: 'Source' }, locale),
    recommended: pick({ 'zh-Hans': '推荐', 'zh-Hant': '推薦', en: 'Recommended' }, locale),
    repeated: pick({ 'zh-Hans': '已出现', 'zh-Hant': '已出現', en: 'Seen' }, locale),
    noMaterials: pick({ 'zh-Hans': '没有符合条件的副本材料。', 'zh-Hant': '沒有符合條件的副本材料。', en: 'No matching dungeon materials.' }, locale),
    noProducts: pick({ 'zh-Hans': '没有符合条件的产物。', 'zh-Hant': '沒有符合條件的產物。', en: 'No matching craftable items.' }, locale),
    noCraftable: pick({ 'zh-Hans': '暂无后续合成结果', 'zh-Hant': '暫無後續合成結果', en: 'No further crafting results.' }, locale),
    noAvailableProducts: pick({ 'zh-Hans': '没有可查看的产物。', 'zh-Hant': '沒有可查看的產物。', en: 'No viewable craftable items.' }, locale),
    missingTree: pick({ 'zh-Hans': '找不到该产物的合成树数据。', 'zh-Hant': '找不到該產物的合成樹資料。', en: 'Crafting tree data was not found for this item.' }, locale),
    missingItem: pick({ 'zh-Hans': '手飘无此装', 'zh-Hant': '手飄無此裝', en: 'Not listed' }, locale),
    showAll: pick({ 'zh-Hans': '展开全部', 'zh-Hant': '展開全部', en: 'Show all' }, locale),
    showLess: pick({ 'zh-Hans': '收起', 'zh-Hant': '收起', en: 'Show less' }, locale),
  };

  const roots = useMemo(() => sortDungeonRoots(data?.roots ?? []), [data]);
  const [materialQuery, setMaterialQuery] = useState('');
  const [selectedMaterialId, setSelectedMaterialId] = useState(() => sortDungeonRoots(data?.roots ?? [])[0]?.materialId ?? '');
  const [productQuery, setProductQuery] = useState('');
  const [productType, setProductType] = useState('all');
  const [selectedProductId, setSelectedProductId] = useState(() => sortDungeonProducts(sortDungeonRoots(data?.roots ?? [])[0]?.allCraftableItemNodes ?? [])[0]?.id ?? '');
  const [selectedTreeNodeId, setSelectedTreeNodeId] = useState(() => sortDungeonProducts(sortDungeonRoots(data?.roots ?? [])[0]?.allCraftableItemNodes ?? [])[0]?.id ?? '');
  const [showAllProducts, setShowAllProducts] = useState(false);

  const selectedRoot = useMemo(() => {
    return roots.find((root) => root.materialId === selectedMaterialId) ?? roots[0] ?? null;
  }, [roots, selectedMaterialId]);

  const filteredRoots = useMemo(() => {
    const raw = materialQuery.trim().toLowerCase();
    if (!raw) return roots;
    return roots.filter((root) => [
      root.materialName,
      root.materialType,
      String(root.materialLevel ?? ''),
      root.materialStats ?? '',
    ].join(' ').toLowerCase().includes(raw));
  }, [roots, materialQuery]);

  const sortedProducts = useMemo(() => {
    return sortDungeonProducts(selectedRoot?.allCraftableItemNodes ?? []);
  }, [selectedRoot]);

  const productTypeOptions = useMemo(() => {
    const seen = new Set();
    const options = [];
    for (const item of sortedProducts) {
      if (!item.type || seen.has(item.type)) continue;
      seen.add(item.type);
      options.push(item.type);
    }
    return options;
  }, [sortedProducts]);

  const filteredProducts = useMemo(() => {
    const raw = productQuery.trim().toLowerCase();
    return sortedProducts.filter((item) => {
      if (productType !== 'all' && item.type !== productType) return false;
      return !raw || String(item.name ?? '').toLowerCase().includes(raw);
    });
  }, [sortedProducts, productQuery, productType]);

  const selectedProduct = useMemo(() => {
    return filteredProducts.find((item) => item.id === selectedProductId && !isDungeonItemDisabled(item.id, items))
      ?? filteredProducts.find((item) => !isDungeonItemDisabled(item.id, items))
      ?? null;
  }, [filteredProducts, selectedProductId, items]);

  const shouldCollapseProducts = filteredProducts.length > DUNGEON_PRODUCT_COLLAPSE_LIMIT;
  const visibleProducts = shouldCollapseProducts && !showAllProducts
    ? filteredProducts.slice(0, DUNGEON_PRODUCT_COLLAPSE_LIMIT)
    : filteredProducts;

  useEffect(() => {
    if (!selectedRoot) return;
    const firstProduct = sortDungeonProducts(selectedRoot.allCraftableItemNodes ?? []).find((item) => !isDungeonItemDisabled(item.id, items)) ?? null;
    setProductQuery('');
    setProductType('all');
    setShowAllProducts(false);
    setSelectedProductId(firstProduct?.id ?? '');
    setSelectedTreeNodeId(firstProduct?.id ?? '');
  }, [selectedRoot?.materialId, items]);

  function selectMaterial(materialId) {
    if (!roots.some((root) => root.materialId === materialId)) return;
    setSelectedMaterialId(materialId);
  }

  function selectProduct(productId) {
    if (isDungeonItemDisabled(productId, items)) return;
    setSelectedProductId(productId);
    setSelectedTreeNodeId(productId);
  }

  useEffect(() => {
    setShowAllProducts(false);
  }, [productQuery, productType]);

  useEffect(() => {
    if (!selectedProduct) return;
    setSelectedProductId(selectedProduct.id);
    setSelectedTreeNodeId(selectedProduct.id);
  }, [selectedProduct?.id]);

  const selectedRootReverseIndex = useMemo(() => buildDungeonReverseIndex(selectedRoot), [selectedRoot]);

  const graph = useMemo(() => {
    if (!selectedRoot || !selectedProduct) return { nodes: [], edges: [] };
    try {
      return buildDungeonGraph({ root: selectedRoot, selectedProduct, selectedRootId: selectedRoot.materialId, items, text });
    } catch (error) {
      console.error('Failed to build dungeon crafting graph', error);
      return { nodes: [], edges: [] };
    }
  }, [selectedRoot, selectedProduct, items, locale]);

  const nodeTypes = useMemo(() => ({
    dungeonItem: DungeonItemGraphNode,
  }), []);
  const edgeTypes = useMemo(() => ({
    dungeonFlow: DungeonFlowEdge,
  }), []);

  const hasProducts = Boolean(sortedProducts.length);
  const selectedProductMissingTree = Boolean(selectedProduct && !(selectedRootReverseIndex.has(selectedProduct.id) || selectedRoot?.nodes?.[selectedProduct.id]));
  const graphKey = `${selectedRoot?.materialId ?? 'none'}-${selectedProduct?.id ?? 'none'}`;

  function handleGraphNodeClick(_, node) {
    if (!node?.data?.itemId || node.data.disabled || !onOpenItem) return;
    onOpenItem(node.data.itemId);
  }

  return (
    <section className="dungeonTreePanel">
      <div className="sheetHero dungeonTreeHero">
        <div>
          <div className="eyebrow">DUNGEON MATERIAL TREE</div>
          <h2>{text.title}</h2>
          <p>{text.subtitle}</p>
        </div>
        <div className="sheetChainPreview" aria-label={text.materials}>
          <span>{text.materials}</span>
          <strong>{roots.length}</strong>
        </div>
      </div>

      <div className="layout dungeonTreeLayout">
        <aside className="sidebar dungeonTreeSidebar">
          <section className="searchPanel">
            <div className="searchLabelRow">
              <h2>{text.materials} {roots.length}</h2>
              <span>{filteredRoots.length}</span>
            </div>
            <div className="searchBox">
              <input
                value={materialQuery}
                onChange={(event) => setMaterialQuery(event.target.value)}
                placeholder={text.materialSearch}
                spellCheck="false"
              />
            </div>
          </section>

          <nav className="itemList dungeonMaterialList" aria-label={text.materials}>
            {filteredRoots.length === 0 ? (
              <div className="emptyList">{text.noMaterials}</div>
            ) : (
              filteredRoots.map((root) => {
                const craftableCount = root.allCraftableItemNodes?.length ?? 0;
                return (
                  <button
                    key={root.materialId}
                    className={cx('itemRow dungeonMaterialRow', craftableCount === 0 && 'disabled', root.materialId === selectedRoot?.materialId && 'current')}
                    onClick={() => craftableCount > 0 && selectMaterial(root.materialId)}
                    disabled={craftableCount === 0}
                  >
                    <span className="dungeonMaterialInfo">
                      <span className="itemName">{root.materialName}</span>
                      <span className="itemMeta itemMetaRow">
                        <span>Lv.{root.materialLevel}</span>
                        <TypeTag type={root.materialType} locale={locale} compact />
                      </span>
                    </span>
                    <span className="itemMeta dungeonMaterialCount">{craftableCount}种</span>
                  </button>
                );
              })
            )}
          </nav>
        </aside>

        <main className="content dungeonTreeContent">
          <section className="dungeonProductsCard">
            <div className="sheetResultHead">
              <div>
                <h3>{text.products}</h3>
                <span>{selectedRoot ? `${selectedRoot.materialName} · ${filteredProducts.length}/${sortedProducts.length}` : '—'}</span>
              </div>
            </div>

            {!hasProducts ? (
              <div className="sheetEmpty">{text.noCraftable}</div>
            ) : (
              <>
                <div className="dungeonProductFilters">
                  <div className="searchBox dungeonProductSearch">
                    <input
                      value={productQuery}
                      onChange={(event) => setProductQuery(event.target.value)}
                      placeholder={text.productSearch}
                      spellCheck="false"
                    />
                  </div>
                  <div className="typeFilterBar dungeonTypeFilterBar" aria-label={text.type}>
                    <button
                      className={cx('typeFilterBtn', productType === 'all' && 'active')}
                      onClick={() => setProductType('all')}
                      style={getTypeFilterStyle('__default')}
                    >
                      {text.all}
                    </button>
                    {productTypeOptions.map((type) => (
                      <button
                        key={type}
                        className={cx('typeFilterBtn', productType === type && 'active')}
                        onClick={() => setProductType(type)}
                        style={getTypeFilterStyle(type)}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="sheetEmpty">{text.noProducts}</div>
                ) : (
                  <div className="dungeonProductGrid">
                    {visibleProducts.map((item) => {
                      const disabled = isDungeonItemDisabled(item.id, items);
                      return (
                        <button
                          key={item.id}
                          className={cx('dungeonProductCard', disabled && 'disabled warning', item.id === selectedProductId && !disabled && 'active')}
                          onClick={() => selectProduct(item.id)}
                          title={buildDungeonNodeTitle(item, text)}
                          disabled={disabled}
                        >
                          <span className="dungeonProductName">{item.name}</span>
                          <span className="itemMeta itemMetaRow">
                            <span>Lv.{item.level}</span>
                            <TypeTag type={item.type} locale={locale} compact />
                            {disabled ? <span className="dungeonMissingTag">{text.missingItem}</span> : null}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {shouldCollapseProducts ? (
                  <button
                    className="dungeonProductToggle"
                    type="button"
                    onClick={() => setShowAllProducts((value) => !value)}
                  >
                    {showAllProducts ? text.showLess : `${text.showAll}（${filteredProducts.length}）`}
                  </button>
                ) : null}
              </>
            )}
          </section>

          <section className="dungeonTreeCard">
            <div className="sheetResultHead">
              <div>
                <h3>{text.tree}</h3>
                <span>{selectedProduct ? selectedProduct.name : '—'}</span>
              </div>
            </div>

            {!selectedProduct ? (
              <div className="sheetEmpty">{hasProducts ? text.noAvailableProducts : text.noCraftable}</div>
            ) : selectedProductMissingTree ? (
              <div className="sheetEmpty">{text.missingTree}</div>
            ) : (
              <div className="dungeonGraphShell">
                <div className="dungeonGraphHint">{text.graphHint}</div>
                {graph.nodes.length === 0 ? (
                  <div className="sheetEmpty dungeonGraphEmpty">{text.missingTree}</div>
                ) : (
                  <ReactFlowProvider key={graphKey}>
                    <ReactFlow
                      key={graphKey}
                      nodes={graph.nodes}
                      edges={graph.edges}
                      nodeTypes={nodeTypes}
                      edgeTypes={edgeTypes}
                      onNodeClick={handleGraphNodeClick}
                      fitView={!graph.preferReadableViewport}
                      defaultViewport={graph.preferReadableViewport ? { x: 80, y: 80, zoom: 0.82 } : undefined}
                      fitViewOptions={{ padding: 0.18 }}
                      minZoom={0.18}
                      maxZoom={1.8}
                      nodesDraggable
                      nodesConnectable={false}
                      elementsSelectable
                    >
                      <Background gap={22} size={1} color="rgba(22, 32, 49, 0.12)" />
                      <MiniMap pannable zoomable nodeStrokeWidth={3} />
                      <Controls showInteractive={false} />
                    </ReactFlow>
                  </ReactFlowProvider>
                )}
              </div>
            )}
          </section>
        </main>
      </div>
    </section>
  );
}

function DungeonFlowEdge({ id, sourceX, sourceY, targetX, targetY, style = {}, data = {}, markerEnd }) {
  const siblingCount = Math.max(1, Number(data.siblingCount ?? 1));
  const siblingIndex = Number(data.siblingIndex ?? 0);
  const spread = siblingIndex - (siblingCount - 1) / 2;
  const distanceY = Math.max(90, Math.abs(targetY - sourceY));
  const curveX = spread * (data.isSummaryEdge ? 58 : 46);
  const sourceLift = Math.min(96, distanceY * 0.38);
  const targetLift = Math.min(96, distanceY * 0.38);
  const c1x = sourceX + curveX;
  const c1y = sourceY + sourceLift;
  const c2x = targetX - curveX;
  const c2y = targetY - targetLift;
  const path = `M ${sourceX},${sourceY} C ${c1x},${c1y} ${c2x},${c2y} ${targetX},${targetY}`;
  const stroke = data.isSummaryEdge ? 'rgba(100, 116, 139, 0.34)' : (style.stroke ?? '#2563eb');
  const strokeWidth = data.recommended ? 3 : (style.strokeWidth ?? 2);
  const dash = data.isSummaryEdge ? '4 7' : '7 5';

  return (
    <path
      id={id}
      className={cx('react-flow__edge-path', 'dungeonFlowEdge', data.isSummaryEdge && 'summary', data.recommended && 'recommended')}
      d={path}
      markerEnd={markerEnd}
      style={{ ...style, stroke, strokeWidth, strokeDasharray: dash, fill: 'none' }}
    />
  );
}


function DungeonItemGraphNode({ data }) {
  return (
    <div
      className={cx('dungeonGraphNode', 'item', data.isSummary && 'summary', data.isRootMaterial && 'rootMaterial', data.isSelectedProduct && 'selectedProduct', data.disabled && 'disabled', data.repeated && 'repeated')}
      style={data.style}
      title={data.title}
    >
      <Handle id="target-left" type="target" position={Position.Top} className="dungeonGraphHandle targetLeft" />
      <Handle id="target-mid" type="target" position={Position.Top} className="dungeonGraphHandle targetMid" />
      <Handle id="target-right" type="target" position={Position.Top} className="dungeonGraphHandle targetRight" />
      {data.isSummary ? (
        <div className="dungeonGraphSummaryLines">
          {data.summaryLines.map((line, index) => <span key={`${line}-${index}`}>{line}</span>)}
        </div>
      ) : (
        <>
          <div className="dungeonGraphNodeName">{data.name}</div>
          <div className="dungeonGraphNodeMeta">
            {data.level ? <span>Lv.{data.level}</span> : null}
            {data.type ? <span>{data.type}</span> : null}
            {data.disabled ? <span className="dungeonMissingTag">{data.missingLabel}</span> : null}
            {data.repeated ? <span className="dungeonSeenTag">{data.repeatedLabel}</span> : null}
          </div>
        </>
      )}
      <Handle id="source-left" type="source" position={Position.Bottom} className="dungeonGraphHandle sourceLeft" />
      <Handle id="source-mid" type="source" position={Position.Bottom} className="dungeonGraphHandle sourceMid" />
      <Handle id="source-right" type="source" position={Position.Bottom} className="dungeonGraphHandle sourceRight" />
    </div>
  );
}


function isDungeonItemDisabled(itemId, items) {
  return getHandbookMissingWarning(items?.[itemId]);
}


function buildDungeonGraph({ root, selectedProduct, selectedRootId, items, text }) {
  const nodesById = root.nodes ?? {};
  const reverseIndex = buildDungeonReverseIndex(root);
  const nameIndex = buildDungeonNameIndex(root, items);
  const graphNodes = [];
  const graphEdges = [];
  const layerCounts = new Map();
  const nodeByGraphId = new Map();
  const maxDepth = 7;
  const reachMemo = new Map();

  function addNode(node, position = null) {
    const layer = node.data.layer ?? 0;
    const index = layerCounts.get(layer) ?? 0;
    layerCounts.set(layer, index + 1);
    const graphNode = {
      ...node,
      position: position ?? { x: index * 270, y: layer * 170 },
    };
    graphNodes.push(graphNode);
    nodeByGraphId.set(graphNode.id, graphNode);
  }

  function addEdge(edge) {
    graphEdges.push({
      animated: edge.animated ?? true,
      type: 'dungeonFlow',
      style: edge.style ?? { stroke: 'rgba(37, 99, 235, 0.38)', strokeWidth: 2, strokeDasharray: '7 5' },
      labelStyle: { fill: '#657287', fontWeight: 800, fontSize: 11 },
      labelBgStyle: { fill: 'rgba(255, 255, 255, 0.86)' },
      ...edge,
    });
  }

  function visitItem(item, depth, path, parentNodeId = null, parentGroup = null, edge = null, pathKey = 'root', siblingIndex = 0, siblingCount = 1) {
    const itemId = item.id;
    const node = normalizeDungeonNode(nodesById[itemId] ?? item, itemId, edge);
    const repeated = itemId ? path.has(itemId) : false;
    const graphNodeId = `item-${pathKey}-${hashString(itemId || node.name || pathKey)}`;
    const disabled = itemId ? isDungeonItemDisabled(itemId, items) : false;

    const parentNode = parentNodeId ? nodeByGraphId.get(parentNodeId) : null;
    const position = parentNode
      ? getDungeonChildPosition(parentNode.position, depth, siblingIndex, siblingCount)
      : { x: 0, y: depth * 170 };

    addNode(makeDungeonItemGraphNode({
      id: graphNodeId,
      node,
      layer: depth,
      isSelectedProduct: depth === 0,
      isRootMaterial: itemId === selectedRootId,
      disabled,
      repeated,
      text,
    }), position);

    if (parentNodeId) {
      addEdge({
        id: `${parentNodeId}-${graphNodeId}`,
        source: parentNodeId,
        target: graphNodeId,
        sourceHandle: pickDungeonSourceHandle(siblingIndex, siblingCount),
        targetHandle: pickDungeonTargetHandle(siblingIndex, siblingCount),
        label: edge?.materialRole ?? '',
        animated: parentGroup?.recommended === true,
        data: { siblingIndex, siblingCount, recommended: parentGroup?.recommended === true, isSummaryEdge: false },
        style: {
          stroke: parentGroup?.recommended ? '#2563eb' : 'rgba(37, 99, 235, 0.38)',
          strokeWidth: parentGroup?.recommended ? 3 : 2,
          strokeDasharray: '7 5',
        },
      });
    }

    if (!itemId || repeated || itemId === selectedRootId || depth >= maxDepth) return graphNodeId;

    const group = pickDungeonPathRecipeGroup(itemId, selectedRootId, reverseIndex, reachMemo, depth > 0);
    if (!group) return graphNodeId;

    const materials = buildDungeonRecipeMaterialsFromGroup(group, root, items, nameIndex);
    if (!materials.length) return graphNodeId;

    const nextPath = new Set(path);
    nextPath.add(itemId);
    const expandableMaterials = [];
    const summaryMaterials = [];
    for (const material of materials) {
      const shouldExpand = material.id === selectedRootId || dungeonItemCanReachRoot(material.id, selectedRootId, reverseIndex, reachMemo, nextPath);
      if (shouldExpand) expandableMaterials.push(material);
      else summaryMaterials.push(material);
    }

    const summaryLines = buildDungeonSummaryLines(summaryMaterials, group);
    const totalChildren = expandableMaterials.length + (summaryLines.length ? 1 : 0);

    expandableMaterials.forEach((material, index) => {
      const childPathKey = `${pathKey}-main-${index}-${hashString(material.id || material.name || index)}`;
      visitItem(material, depth + 1, nextPath, graphNodeId, group, material.edge, childPathKey, index, totalChildren);
    });

    if (summaryLines.length) {
      const summaryIndex = totalChildren - 1;
      const summaryId = `summary-${pathKey}-${hashString(summaryLines.join('|'))}`;
      const summaryPosition = getDungeonChildPosition(nodeByGraphId.get(graphNodeId)?.position ?? { x: 0, y: depth * 170 }, depth + 1, summaryIndex, totalChildren);
      addNode(makeDungeonSummaryGraphNode({ id: summaryId, lines: summaryLines, layer: depth + 1, group }), summaryPosition);
      addEdge({
        id: `${graphNodeId}-${summaryId}`,
        source: graphNodeId,
        target: summaryId,
        sourceHandle: pickDungeonSourceHandle(summaryIndex, totalChildren),
        targetHandle: pickDungeonTargetHandle(summaryIndex, totalChildren),
        animated: group.recommended === true,
        data: { siblingIndex: summaryIndex, siblingCount: totalChildren, recommended: group.recommended === true, isSummaryEdge: true },
        style: { stroke: 'rgba(100, 116, 139, 0.34)', strokeWidth: 2, strokeDasharray: '4 7' },
      });
    }

    return graphNodeId;
  }

  visitItem(selectedProduct, 0, new Set());
  resolveDungeonLayerCollisions(graphNodes);
  const maxLayerWidth = Math.max(0, ...[...layerCounts.values()]);
  return { nodes: graphNodes, edges: graphEdges, maxLayerWidth, preferReadableViewport: maxLayerWidth > 5 };
}

function getDungeonChildPosition(parentPosition, layer, siblingIndex, siblingCount) {
  const center = (siblingCount - 1) / 2;
  const gap = siblingCount <= 2 ? 250 : 220;
  return {
    x: parentPosition.x + (siblingIndex - center) * gap,
    y: layer * 170,
  };
}

function resolveDungeonLayerCollisions(nodes) {
  const byLayer = new Map();
  for (const node of nodes) {
    const layer = node.data.layer ?? 0;
    if (!byLayer.has(layer)) byLayer.set(layer, []);
    byLayer.get(layer).push(node);
  }
  for (const layerNodes of byLayer.values()) {
    layerNodes.sort((a, b) => a.position.x - b.position.x);
    for (let i = 1; i < layerNodes.length; i += 1) {
      const previous = layerNodes[i - 1];
      const current = layerNodes[i];
      const minGap = previous.data.isSummary || current.data.isSummary ? 230 : 210;
      if (current.position.x - previous.position.x < minGap) {
        current.position.x = previous.position.x + minGap;
      }
    }
  }
}

function pickDungeonSourceHandle(index, total) {
  if (total <= 1) return 'source-mid';
  const ratio = index / Math.max(1, total - 1);
  if (ratio <= 0.34) return 'source-left';
  if (ratio >= 0.66) return 'source-right';
  return 'source-mid';
}

function pickDungeonTargetHandle(index, total) {
  if (total <= 1) return 'target-mid';
  const ratio = index / Math.max(1, total - 1);
  if (ratio <= 0.34) return 'target-left';
  if (ratio >= 0.66) return 'target-right';
  return 'target-mid';
}

function buildDungeonNameIndex(root, items) {
  const index = new Map();
  function add(name, node) {
    const key = normalizeDungeonNameKey(name);
    if (!key || index.has(key)) return;
    index.set(key, node);
  }

  for (const [id, node] of Object.entries(root.nodes ?? {})) {
    add(node.name, normalizeDungeonNode(node, id));
  }
  for (const [id, item] of Object.entries(items ?? {})) {
    add(pick(item.name, 'zh-Hant'), normalizeItemAsDungeonNode(id, item, 'zh-Hant'));
    add(pick(item.name, 'zh-Hans'), normalizeItemAsDungeonNode(id, item, 'zh-Hans'));
    add(pick(item.name, 'en'), normalizeItemAsDungeonNode(id, item, 'en'));
  }
  return index;
}

function normalizeItemAsDungeonNode(id, item, locale) {
  return {
    id,
    name: pick(item.name, locale),
    type: pick(item.type, locale),
    level: item.level ?? '',
    stats: item.stats ?? '',
  };
}

function normalizeDungeonNameKey(value) {
  return String(value ?? '')
    .trim()
    .replace(/[\s　]+/g, '')
    .replace(/[()（）]/g, '')
    .toLowerCase();
}

function buildDungeonRecipeMaterialsFromGroup(group, root, items, nameIndex) {
  const byName = new Map();
  const ordered = [];

  function addMaterial(node, edge = null, order = 999) {
    const normalized = normalizeDungeonNode(node, node?.id ?? node?.name ?? '', edge);
    const key = normalized.id ? `id:${normalized.id}` : `name:${normalizeDungeonNameKey(normalized.name)}`;
    if (!key || byName.has(key)) return;
    const entry = { ...normalized, edge, order };
    byName.set(key, entry);
    ordered.push(entry);
  }

  for (const material of group.materials ?? []) {
    addMaterial(material.node, material.edge, Number(material.edge?.materialPosition ?? 999));
  }

  parseDungeonRecipeMaterialNames(group.recipe).forEach((name, index) => {
    const matched = nameIndex.get(normalizeDungeonNameKey(name));
    addMaterial(matched ?? { id: '', name, type: '', level: '', stats: '' }, null, index + 1);
  });

  return ordered.sort((a, b) => a.order - b.order);
}

function buildDungeonSummaryLines(materials, group) {
  const lines = [];
  for (const material of materials) {
    const name = material.name || material.id;
    if (!name) continue;
    lines.push(isDungeonMainMaterial(material) ? `${name}（主）` : name);
  }
  const book = normalizeDungeonBook(group.book);
  if (book) lines.push(book);
  return lines;
}

function isDungeonMainMaterial(material) {
  const role = String(material.edge?.materialRole ?? '');
  if (role.includes('主')) return true;
  return Number(material.edge?.materialPosition ?? material.order ?? 0) === 1;
}

function compactDungeonSummaryVisibleLines(lines) {
  if (lines.length <= 3) return lines;
  const bookIndex = lines.findIndex((line) => /^書|^书/i.test(line));
  if (bookIndex < 0) return lines.slice(0, 3);
  const materialLines = lines.filter((_, index) => index !== bookIndex);
  return [...materialLines.slice(0, 2), lines[bookIndex]];
}

function parseDungeonRecipeMaterialNames(recipe) {
  return String(recipe ?? '')
    .split('+')
    .map((part) => part.replace(/[x×]\s*\d+/gi, '').trim())
    .filter(Boolean);
}

function normalizeDungeonBook(book) {
  const value = String(book ?? '').trim();
  if (!value || value === '無' || value === '无') return '';
  return value;
}

function pickDungeonPathRecipeGroup(itemId, selectedRootId, reverseIndex, reachMemo, requireRootPath = false) {
  const groups = reverseIndex.get(itemId) ?? [];
  if (!groups.length) return null;
  const pathGroups = groups.filter((group) => dungeonGroupCanReachRoot(group, selectedRootId, reverseIndex, reachMemo, new Set([itemId])));
  if (pathGroups.length) return pickRepresentativeRecipeGroup(pathGroups);
  return requireRootPath ? null : pickRepresentativeRecipeGroup(groups);
}

function dungeonGroupCanReachRoot(group, selectedRootId, reverseIndex, reachMemo, path) {
  return (group.materials ?? []).some((material) => dungeonItemCanReachRoot(material.node?.id, selectedRootId, reverseIndex, reachMemo, path));
}

function dungeonItemCanReachRoot(itemId, selectedRootId, reverseIndex, reachMemo, path = new Set()) {
  if (!itemId) return false;
  if (itemId === selectedRootId) return true;
  if (path.has(itemId)) return false;
  if (reachMemo.has(itemId)) return reachMemo.get(itemId);

  const nextPath = new Set(path);
  nextPath.add(itemId);
  const groups = reverseIndex.get(itemId) ?? [];
  const result = groups.some((group) => dungeonGroupCanReachRoot(group, selectedRootId, reverseIndex, reachMemo, nextPath));
  reachMemo.set(itemId, result);
  return result;
}

function buildDungeonReverseIndex(root) {
  const nodes = root?.nodes ?? {};
  const reverse = new Map();
  let order = 0;
  for (const [fromId, node] of Object.entries(nodes)) {
    for (const edge of node.children ?? []) {
      if (!edge.toId) continue;
      const recipeKey = [edge.recipe, edge.book, edge.rank, edge.source, edge.recommended, edge.bad].join('|');
      if (!reverse.has(edge.toId)) reverse.set(edge.toId, new Map());
      const groups = reverse.get(edge.toId);
      if (!groups.has(recipeKey)) {
        groups.set(recipeKey, {
          toId: edge.toId,
          recipe: edge.recipe ?? '',
          book: edge.book ?? '',
          rank: edge.rank ?? '',
          source: edge.source ?? '',
          recommended: edge.recommended === true,
          bad: edge.bad === true,
          order: order++,
          materials: [],
        });
      }
      groups.get(recipeKey).materials.push({
        edge,
        node: normalizeDungeonNode(nodes[fromId] ?? { id: fromId, name: fromId }, fromId),
      });
    }
  }

  const result = new Map();
  for (const [toId, groupMap] of reverse.entries()) {
    result.set(toId, [...groupMap.values()].map((group) => ({
      ...group,
      materials: group.materials.sort((a, b) => Number(a.edge.materialPosition ?? 999) - Number(b.edge.materialPosition ?? 999)),
    })));
  }
  return result;
}

function pickRepresentativeRecipeGroup(groups) {
  if (!groups?.length) return null;
  return [...groups].sort(compareDungeonRecipeGroups)[0];
}

function compareDungeonRecipeGroups(a, b) {
  const aRecommendedGood = a.recommended === true && a.bad === false;
  const bRecommendedGood = b.recommended === true && b.bad === false;
  if (aRecommendedGood !== bRecommendedGood) return aRecommendedGood ? -1 : 1;

  const aGood = a.bad === false;
  const bGood = b.bad === false;
  if (aGood !== bGood) return aGood ? -1 : 1;

  const aGg = a.source === 'GG';
  const bGg = b.source === 'GG';
  if (aGg !== bGg) return aGg ? -1 : 1;

  const materialDelta = a.materials.length - b.materials.length;
  if (materialDelta !== 0) return materialDelta;

  return a.order - b.order;
}

function makeDungeonItemGraphNode({ id, node, layer, isSelectedProduct, isRootMaterial, disabled, repeated, text }) {
  const theme = getTypeTheme(node.type);
  const title = buildDungeonNodeTitle({ ...node, name: node.name }, text);
  return {
    id,
    type: 'dungeonItem',
    data: {
      ...node,
      itemId: node.id,
      layer,
      isSelectedProduct,
      isRootMaterial,
      disabled,
      repeated,
      title,
      missingLabel: text.missingItem,
      repeatedLabel: text.repeated,
      style: {
        '--node-text': theme.text,
        '--node-border': theme.border,
        '--node-bg-start': theme.start,
        '--node-bg-end': theme.end,
      },
    },
  };
}

function makeDungeonSummaryGraphNode({ id, lines, layer, group }) {
  const visibleLines = compactDungeonSummaryVisibleLines(lines);
  const title = [lines.join('\n'), group.rank, group.source].filter(Boolean).join('\n');
  return {
    id,
    type: 'dungeonItem',
    data: {
      id: '',
      itemId: '',
      name: visibleLines.join(' / '),
      type: '',
      level: '',
      stats: '',
      layer,
      isSummary: true,
      summaryLines: visibleLines,
      isSelectedProduct: false,
      isRootMaterial: false,
      disabled: false,
      repeated: false,
      title,
      style: {
        '--node-text': '#4b5563',
        '--node-border': 'rgba(100, 116, 139, 0.28)',
        '--node-bg-start': '#ffffff',
        '--node-bg-end': '#eef2f7',
      },
    },
  };
}


function sortDungeonRoots(roots) {
  return [...roots].sort((a, b) => {
    const levelDelta = Number(b.materialLevel ?? 0) - Number(a.materialLevel ?? 0);
    if (levelDelta !== 0) return levelDelta;
    const typeDelta = String(a.materialType ?? '').localeCompare(String(b.materialType ?? ''), 'zh-Hant');
    if (typeDelta !== 0) return typeDelta;
    return String(a.materialName ?? '').localeCompare(String(b.materialName ?? ''), 'zh-Hant');
  });
}

function sortDungeonProducts(products) {
  return [...products].sort((a, b) => {
    const levelDelta = Number(b.level ?? 0) - Number(a.level ?? 0);
    if (levelDelta !== 0) return levelDelta;
    const typeDelta = String(a.type ?? '').localeCompare(String(b.type ?? ''), 'zh-Hant');
    if (typeDelta !== 0) return typeDelta;
    return String(a.name ?? '').localeCompare(String(b.name ?? ''), 'zh-Hant');
  });
}

function centerDungeonGraphLayers(nodes) {
  const byLayer = new Map();
  for (const node of nodes) {
    const layer = node.data.layer ?? 0;
    if (!byLayer.has(layer)) byLayer.set(layer, []);
    byLayer.get(layer).push(node);
  }
  for (const layerNodes of byLayer.values()) {
    const width = (layerNodes.length - 1) * 270;
    layerNodes.forEach((node, index) => {
      node.position.x = index * 270 - width / 2;
    });
  }
}

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < String(value).length; i += 1) {
    hash = ((hash << 5) - hash + String(value).charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

function normalizeDungeonNode(value, fallbackId, edge = null) {
  return {
    id: value?.id ?? fallbackId,
    name: value?.name ?? edge?.toName ?? fallbackId,
    type: value?.type ?? edge?.toType ?? '',
    level: value?.level ?? edge?.toLevel ?? '',
    stats: value?.stats ?? edge?.toStats ?? '',
  };
}

function buildDungeonNodeTitle(node, text) {
  return [
    `${text.products}：${node.name ?? '—'}`,
    `${text.level}：${node.level ?? '—'}`,
    `${text.type}：${node.type || '—'}`,
    `${text.stats}：${node.stats || '—'}`,
  ].join('\n');
}

function getTypeFilterStyle(type) {
  const theme = getTypeTheme(type);
  return {
    '--tag-text': theme.text,
    '--tag-border': theme.border,
    '--tag-bg-start': theme.start,
    '--tag-bg-end': theme.end,
    '--tag-shadow': theme.shadow,
  };
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
