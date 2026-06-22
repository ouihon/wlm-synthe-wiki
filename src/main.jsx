import React, { useEffect, useMemo, useRef, useState } from 'react';
import 'reactflow/dist/style.css';
import { createRoot } from 'react-dom/client';
import itemsData from './data/items.json';
import dungeonMaterialCraftingTreeData from './data/dungeon_material_crafting_tree.json';
import uiText from './i18n/ui.json';
import packageInfo from '../package.json';
import VersionUpdateDialog from './VersionUpdateDialog.jsx';
import PilotDownloadDialog from './components/PilotDownloadDialog.jsx';
import InventoryPage from './pages/InventoryPage.jsx';
import CommonGearPage from './pages/CommonGearPage.jsx';
import FavoritesPage from './pages/FavoritesPage.jsx';
import AlchemySheetPage from './pages/AlchemySheetPage.jsx';
import DungeonMaterialTreePage from './pages/DungeonMaterialTreePage.jsx';
import CreditsPage from './pages/CreditsPage.jsx';
import { COMMON_CATEGORIES, GEAR_TABS, GUIDE_LINKS, LOCALES, PAGE_TABS } from './lib/appConfig.js';
import { cx, getHandbookMissingWarning, getTypeTheme, pick } from './lib/ui.js';
import './styles.css';

const APP_VERSION = `v${packageInfo.version}`;
const BRAND_ICON_SRC = `${import.meta.env.BASE_URL}favicon.ico`;
const RECIPE_CHOICE_STORAGE_KEY = 'alchemy-recipe-choice';
const FAVORITE_ITEMS_STORAGE_KEY = 'alchemy-favorite-item-ids';
const TYPE_ORDER = [
  '钢', '铁', '铜', '钛', '赤铁', '铅', '锡', '金', '银', '白银', '铝', '兽骨', '岩石', '皮', '花', '草',
  '叶', '兽毛', '羽毛', '木', '魔玉', '水晶', '结晶', '钻石', '宝', '玉', '尼龙', '壳', '硅', '果', '肉', '泌',
];

function App() {
  const items = itemsData.items;
  const defaultItemId = itemsData.defaultItemId;
  const [locale, setLocale] = useState(() => localStorage.getItem('alchemy-locale') || 'zh-Hans');
  const [pageTab, setPageTab] = useState('inventory');
  const [pilotOpen, setPilotOpen] = useState(false);
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
  const [gearMenuOpen, setGearMenuOpen] = useState(false);
  const gearMenuRef = useRef(null);
  const [favoriteItemIds, setFavoriteItemIds] = useState(() => {
    try {
      const raw = localStorage.getItem(FAVORITE_ITEMS_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
    } catch {
      return [];
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

  useEffect(() => {
    localStorage.setItem(FAVORITE_ITEMS_STORAGE_KEY, JSON.stringify(favoriteItemIds));
  }, [favoriteItemIds]);

  useEffect(() => {
    if (!gearMenuOpen) return undefined;

    function handlePointerDown(event) {
      if (gearMenuRef.current && !gearMenuRef.current.contains(event.target)) {
        setGearMenuOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setGearMenuOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [gearMenuOpen]);

  const itemEntries = useMemo(() => {
    return Object.entries(items)
      .map(([id, item]) => ({ id, item }))
      .sort((a, b) => (b.item.level || 0) - (a.item.level || 0));
  }, [items]);

  const favoriteItemIdSet = useMemo(() => new Set(favoriteItemIds), [favoriteItemIds]);

  const favoriteEntries = useMemo(() => {
    return favoriteItemIds
      .map((id) => ({ id, item: items[id] }))
      .filter(({ item }) => item);
  }, [favoriteItemIds, items]);

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

  function toggleFavoriteItem(id) {
    if (!items[id]) return;
    setFavoriteItemIds((old) => (old.includes(id) ? old.filter((entry) => entry !== id) : [id, ...old]));
  }

  function selectGearTab(tabKey) {
    openPageTab(tabKey);
    setGearMenuOpen(false);
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
    const recommended = recipes.findIndex((recipe) => recipe.recommended && !recipe.bad);
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
    return category.items.map((id) => ({ id, item: items[id] })).filter((entry) => entry.item);
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
    if (nextTab === 'favorites') {
      const firstId = favoriteItemIds.find((id) => items[id]);
      if (firstId) {
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

  const activeGearTab = GEAR_TABS.find((tab) => tab.key === pageTab) ?? GEAR_TABS[0];
  const isGearTabActive = GEAR_TABS.some((tab) => tab.key === pageTab);

  const detailProps = {
    path,
    items,
    locale,
    t,
    jumpTo,
    rootItem,
    currentItem,
    currentId,
    selectedRecipe,
    selectedRecipeIndex,
    setSelectedRecipe,
    enterMaterial,
    currentWarning,
    isFavorite: favoriteItemIdSet.has(currentId),
    onToggleFavorite: toggleFavoriteItem,
    handbookMissingLabel: pick({ 'zh-Hans': '手飘无此装', 'zh-Hant': '手飄無此裝', en: 'Not listed in Wonderland M' }, locale),
    handbookMissingHint: pick({
      'zh-Hans': '飘流幻境M不存在此装备，请留意来源。',
      'zh-Hant': '飄流幻境M不存在此裝備，請留意來源。',
      en: 'Wonderland M does not list this gear. Please check the source.',
    }, locale),
  };

  return (
    <div className="appShell">
      <VersionUpdateDialog version={APP_VERSION} locale={locale} onOpenPilot={() => setPilotOpen(true)} />
      <PilotDownloadDialog open={pilotOpen} onClose={() => setPilotOpen(false)} locale={locale} />
      <header className="topbar">
        <button className="brand" onClick={() => selectRoot(defaultItemId)} aria-label={t.appTitle}>
          <span className="brandMark">
            <img src={BRAND_ICON_SRC} alt="" />
          </span>
          <span className="brandText">{t.appTitle}</span>
        </button>
        <div className="topActions" aria-label={t.language}>
          <button className="pilotCta" onClick={() => setPilotOpen(true)}>
            <span className="pilotCtaGlow" aria-hidden="true" />
            <span className="pilotCtaIcon" aria-hidden="true">⇣</span>
            <span className="pilotCtaText">{t.pilotCta}</span>
          </button>
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
        <div ref={gearMenuRef} className={cx('pageTabGroup', isGearTabActive && 'active', gearMenuOpen && 'menuOpen')}>
          <button
            className={cx('pageTab', 'pageTabGroupTrigger', isGearTabActive && 'active')}
            type="button"
            onClick={() => setGearMenuOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={gearMenuOpen}
          >
            <span>{pick({ 'zh-Hans': '装备', 'zh-Hant': '裝備', en: 'Gear' }, locale)}</span>
            <small>{pick(activeGearTab.label, locale)}</small>
            <span className="pageTabChevron" aria-hidden="true">⌄</span>
          </button>
          {gearMenuOpen ? (
            <div className="pageSubmenu" role="menu">
              {GEAR_TABS.map((tab) => (
                <button
                  key={tab.key}
                  className={cx('pageSubmenuItem', pageTab === tab.key && 'active')}
                  type="button"
                  onPointerDown={(event) => {
                    event.preventDefault();
                    selectGearTab(tab.key);
                  }}
                  onClick={() => selectGearTab(tab.key)}
                  role="menuitem"
                >
                  {pick(tab.label, locale)}
                </button>
              ))}
            </div>
          ) : null}
        </div>

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
        <InventoryPage
          t={t}
          locale={locale}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          allTypeTheme={allTypeTheme}
          typeOrder={TYPE_ORDER}
          getTypeTheme={getTypeTheme}
          filteredItems={filteredItems}
          query={query}
          setQuery={setQuery}
          currentId={currentId}
          rootId={rootId}
          selectRoot={selectRoot}
          getHandbookMissingWarning={getHandbookMissingWarning}
          detailProps={detailProps}
          favoriteItemIdSet={favoriteItemIdSet}
          toggleFavoriteItem={toggleFavoriteItem}
        />
      ) : null}

      {pageTab === 'common' ? (
        <CommonGearPage
          locale={locale}
          commonCategories={COMMON_CATEGORIES}
          commonCategory={commonCategory}
          selectCommonCategory={selectCommonCategory}
          commonEntries={commonEntries}
          currentId={currentId}
          rootId={rootId}
          selectRoot={selectRoot}
          getHandbookMissingWarning={getHandbookMissingWarning}
          detailProps={detailProps}
        />
      ) : null}


      {pageTab === 'favorites' ? (
        <FavoritesPage
          locale={locale}
          favoriteEntries={favoriteEntries}
          currentId={currentId}
          rootId={rootId}
          selectRoot={selectRoot}
          getHandbookMissingWarning={getHandbookMissingWarning}
          detailProps={detailProps}
          toggleFavoriteItem={toggleFavoriteItem}
        />
      ) : null}

      {pageTab === 'sheet' ? (
        <AlchemySheetPage items={items} locale={locale} onOpenItem={openItemFromSheet} />
      ) : null}

      {pageTab === 'dungeonTree' ? (
        <DungeonMaterialTreePage data={dungeonMaterialCraftingTreeData} items={items} locale={locale} onOpenItem={openItemFromSheet} />
      ) : null}

      {pageTab === 'guides' ? (
        <CreditsPage locale={locale} guideLinks={GUIDE_LINKS} />
      ) : null}

      <footer className="siteFooter">
        <strong>Pepper Cold</strong>
        <span>Version {APP_VERSION}</span>
        <span>Copyright © 2026-{new Date().getFullYear()} Pepper Cold. All rights reserved.</span>
      </footer>
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
