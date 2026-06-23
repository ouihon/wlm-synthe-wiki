import React, { useEffect, useMemo, useState } from 'react';
import TypeTag from './TypeTag.jsx';
import { pick } from '../lib/ui.js';

const ELEMENT_OPTIONS = [
  {
    key: 'fire',
    label: { 'zh-Hans': '火系', 'zh-Hant': '火系', en: 'Fire' },
    patterns: [/火系/u],
  },
  {
    key: 'water',
    label: { 'zh-Hans': '水系', 'zh-Hant': '水系', en: 'Water' },
    patterns: [/水系/u],
  },
  {
    key: 'earth',
    label: { 'zh-Hans': '地系', 'zh-Hant': '地系', en: 'Earth' },
    patterns: [/地系/u],
  },
  {
    key: 'wind',
    label: { 'zh-Hans': '风系', 'zh-Hant': '風系', en: 'Wind' },
    patterns: [/风系/u, /風系/u],
  },
];

const DEFAULT_ELEMENT_KEY = ELEMENT_OPTIONS[0].key;

function getRecipes(item) {
  return Array.isArray(item?.recipes) ? item.recipes : [];
}

function normalizeLabel(value) {
  return String(value || '')
    .replace(/\s+/g, '')
    .trim();
}

function parseMaterialAmount(label) {
  const raw = String(label || '').trim();
  const match = raw.match(/^(.*?)\s*[×xX＊*]\s*(\d+)\s*$/u);
  if (!match) {
    return { label: raw, amount: 1 };
  }

  return {
    label: match[1].trim(),
    amount: Number.parseInt(match[2], 10) || 1,
  };
}

function extractInlineSource(label) {
  const raw = String(label || '').trim();
  const match = raw.match(/^(.*?)\s*[（(]([^（）()]+)[）)]\s*$/u);
  if (!match) return { label: raw, sourceLabel: '' };

  const sourceLabel = match[2].trim();
  const looksLikeSource = /购买|購買|副本|來源|来源|宝箱|寶箱|商城|点装|點裝|任务|任務|获得|獲得|罗德岛|羅德島|日本|埃及|长安|長安|中国|中國|印度|雅典|朝鲜|朝鮮|澳洲|南極|玛雅|瑪雅|曼谷|印加|复活岛|復活島|基督|克兰|克蘭|威灵|威靈|督村/u.test(sourceLabel);
  if (!looksLikeSource) return { label: raw, sourceLabel: '' };

  return {
    label: match[1].trim(),
    sourceLabel,
  };
}

function getMaterialParts(material, locale) {
  const localizedLabel = pick(material?.name, locale) || '';
  const fallbackLabel = pick(material?.name, 'zh-Hans') || localizedLabel;
  const shouldSplit = !material?.itemId && !material?.type && /[，,]/u.test(localizedLabel || fallbackLabel);
  const localizedParts = shouldSplit ? localizedLabel.split(/[，,]/u) : [localizedLabel];
  const fallbackParts = shouldSplit ? fallbackLabel.split(/[，,]/u) : [fallbackLabel];

  return localizedParts
    .map((part, index) => {
      const parsed = parseMaterialAmount(part);
      const fallbackParsed = parseMaterialAmount(fallbackParts[index] || part);
      const inlineSource = extractInlineSource(parsed.label || fallbackParsed.label);
      const fallbackInlineSource = extractInlineSource(fallbackParsed.label || parsed.label);
      return {
        label: inlineSource.label || fallbackInlineSource.label,
        fallbackLabel: fallbackInlineSource.label || inlineSource.label,
        amount: parsed.amount,
        type: shouldSplit ? null : material?.type,
        itemId: shouldSplit ? null : material?.itemId,
        sourceLabel: inlineSource.sourceLabel || fallbackInlineSource.sourceLabel,
      };
    })
    .filter((part) => part.label || part.fallbackLabel);
}

function buildNameIndex(items, locale) {
  const candidates = new Map();

  Object.entries(items).forEach(([id, item]) => {
    [pick(item?.name, locale), pick(item?.name, 'zh-Hans')]
      .filter(Boolean)
      .forEach((name) => {
        const key = normalizeLabel(name);
        if (!key) return;
        if (!candidates.has(key)) candidates.set(key, new Set());
        candidates.get(key).add(id);
      });
  });

  const index = new Map();
  candidates.forEach((ids, key) => {
    if (ids.size === 1) index.set(key, [...ids][0]);
  });

  return index;
}

function isSourceRecipe(recipe, locale) {
  const materials = Array.isArray(recipe?.materials) ? recipe.materials : [];
  if (!materials.length) return false;

  const title = pick(recipe?.title, locale) || pick(recipe?.title, 'zh-Hans') || '';
  const hasLinkedMaterial = materials.some((material) => material?.itemId);
  const singleRawMaterialWithoutType = materials.length === 1 && !materials[0]?.itemId && !materials[0]?.type;
  const sourceTitle = /来源|來源/u.test(title);

  return sourceTitle || (!hasLinkedMaterial && singleRawMaterialWithoutType);
}

function getSourceLabel(recipe, locale) {
  const materials = Array.isArray(recipe?.materials) ? recipe.materials : [];
  if (!materials.length) return '';
  return getMaterialParts(materials[0], locale)[0]?.label || '';
}

function detectElement(labels) {
  const joined = labels.filter(Boolean).join(' ');
  if (!joined) return null;

  return ELEMENT_OPTIONS.find((option) => option.patterns.some((pattern) => pattern.test(joined)))?.key ?? null;
}

function getItemElement(items, itemId, locale) {
  const item = items[itemId];
  if (!item) return null;
  return detectElement([pick(item.name, locale), pick(item.name, 'zh-Hans')]);
}

function isItemAllowedByElement(items, itemId, locale, elementKey) {
  const itemElement = getItemElement(items, itemId, locale);
  return !itemElement || itemElement === elementKey;
}

function isRawMaterialAllowedByElement(part, elementKey) {
  const materialElement = detectElement([part.fallbackLabel, part.label]);
  return !materialElement || materialElement === elementKey;
}

function createLeafEntry({ items, itemId = null, name = '', fallbackName = '', type = null, amount = 1, locale, sourceLabel = '', circular = false }) {
  const linkedItem = itemId ? items[itemId] : null;
  const displayName = linkedItem ? pick(linkedItem.name, locale) : (name || fallbackName || itemId || '');
  const fallbackDisplayName = linkedItem ? pick(linkedItem.name, 'zh-Hans') : (fallbackName || name || itemId || '');
  const key = linkedItem ? `item:${itemId}` : `raw:${normalizeLabel(fallbackDisplayName || displayName)}`;

  return {
    key,
    id: linkedItem ? itemId : null,
    name: displayName,
    level: linkedItem?.level ?? null,
    type: linkedItem?.type ?? type ?? null,
    amount,
    sourceLabels: sourceLabel ? [sourceLabel] : [],
    circular,
  };
}

function makeLeafResult(entry) {
  return {
    entries: new Map([[entry.key, entry]]),
    totalAmount: entry.amount,
    circular: Boolean(entry.circular),
  };
}

function addEntryToMap(target, entry, multiplier = 1, extraSourceLabel = '') {
  const amount = entry.amount * multiplier;
  const old = target.get(entry.key);
  const nextSources = [...entry.sourceLabels];
  if (extraSourceLabel && !nextSources.includes(extraSourceLabel)) nextSources.push(extraSourceLabel);

  if (old) {
    const mergedSources = [...old.sourceLabels];
    nextSources.forEach((sourceLabel) => {
      if (sourceLabel && !mergedSources.includes(sourceLabel)) mergedSources.push(sourceLabel);
    });

    target.set(entry.key, {
      ...old,
      amount: old.amount + amount,
      sourceLabels: mergedSources,
      circular: old.circular || entry.circular,
    });
    return;
  }

  target.set(entry.key, {
    ...entry,
    amount,
    sourceLabels: nextSources,
  });
}

function shouldAttachEdgeSource(result, materialId) {
  if (!materialId || !result || result.entries.size !== 1) return false;
  return result.entries.has(`item:${materialId}`);
}

function mergeResultIntoMap(target, result, multiplier = 1, edgeSourceLabel = '', materialId = null) {
  const extraSourceLabel = shouldAttachEdgeSource(result, materialId) ? edgeSourceLabel : '';
  result.entries.forEach((entry) => addEntryToMap(target, entry, multiplier, extraSourceLabel));
}

function makeResultFromMap(entries) {
  let totalAmount = 0;
  let circular = false;
  entries.forEach((entry) => {
    totalAmount += entry.amount;
    circular = circular || entry.circular;
  });

  return {
    entries,
    totalAmount,
    circular,
  };
}

function isBetterResult(candidate, currentBest) {
  if (!candidate) return false;
  if (!currentBest) return true;
  if (candidate.totalAmount !== currentBest.totalAmount) return candidate.totalAmount < currentBest.totalAmount;
  if (candidate.entries.size !== currentBest.entries.size) return candidate.entries.size < currentBest.entries.size;
  return false;
}

function sortLuckyEntries(a, b, locale) {
  if (b.amount !== a.amount) return b.amount - a.amount;
  const aLevel = a.level ?? -1;
  const bLevel = b.level ?? -1;
  if (aLevel !== bLevel) return bLevel - aLevel;
  return a.name.localeCompare(b.name, locale);
}

function buildLuckyMaterialListForElement({ items, rootItemId, locale, elementKey, nameIndex }) {
  const memo = new Map();
  const activePath = new Set();

  function rawLeaf(part, amount = 1) {
    if (!isRawMaterialAllowedByElement(part, elementKey)) return null;
    return makeLeafResult(createLeafEntry({
      items,
      name: part.label,
      fallbackName: part.fallbackLabel,
      type: part.type,
      amount,
      locale,
      sourceLabel: part.sourceLabel,
    }));
  }

  function itemLeaf(itemId, amount = 1, sourceLabel = '', circular = false) {
    if (!isItemAllowedByElement(items, itemId, locale, elementKey)) return null;
    return makeLeafResult(createLeafEntry({
      items,
      itemId,
      amount,
      locale,
      sourceLabel,
      circular,
    }));
  }

  function solve(itemId) {
    const item = items[itemId];
    if (!item || !isItemAllowedByElement(items, itemId, locale, elementKey)) return null;

    const memoKey = `${itemId}|${elementKey}`;
    if (memo.has(memoKey)) return memo.get(memoKey);

    if (activePath.has(itemId)) {
      return itemLeaf(itemId, 1, '', true);
    }

    const legalRecipes = getRecipes(item).filter((recipe) => !recipe?.bad);
    if (!legalRecipes.length) {
      const result = itemLeaf(itemId);
      memo.set(memoKey, result);
      return result;
    }

    activePath.add(itemId);
    let bestResult = null;

    try {
      legalRecipes.forEach((recipe) => {
        if (isSourceRecipe(recipe, locale)) {
          const sourceResult = itemLeaf(itemId, 1, getSourceLabel(recipe, locale));
          if (isBetterResult(sourceResult, bestResult)) bestResult = sourceResult;
          return;
        }

        const materials = Array.isArray(recipe.materials) ? recipe.materials : [];
        if (!materials.length) {
          const emptyRecipeResult = itemLeaf(itemId);
          if (isBetterResult(emptyRecipeResult, bestResult)) bestResult = emptyRecipeResult;
          return;
        }

        const totalEntries = new Map();
        let validRecipe = true;

        materials.forEach((material) => {
          if (!validRecipe) return;

          getMaterialParts(material, locale).forEach((part) => {
            if (!validRecipe) return;

            const materialId = part.itemId || nameIndex.get(normalizeLabel(part.fallbackLabel || part.label));
            const subResult = materialId && items[materialId]
              ? solve(materialId)
              : rawLeaf(part);

            if (!subResult) {
              validRecipe = false;
              return;
            }

            mergeResultIntoMap(totalEntries, subResult, part.amount, part.sourceLabel, materialId);
          });
        });

        if (!validRecipe) return;

        const recipeResult = makeResultFromMap(totalEntries);
        if (isBetterResult(recipeResult, bestResult)) bestResult = recipeResult;
      });
    } finally {
      activePath.delete(itemId);
    }

    if (!bestResult) {
      bestResult = itemLeaf(itemId);
    }

    memo.set(memoKey, bestResult);
    return bestResult;
  }

  const result = solve(rootItemId);
  const entries = result ? [...result.entries.values()].sort((a, b) => sortLuckyEntries(a, b, locale)) : [];

  return {
    entries,
    totalAmount: result?.totalAmount ?? 0,
    circular: Boolean(result?.circular),
  };
}

function buildLuckyMaterialLists({ items, rootItemId, locale }) {
  const nameIndex = buildNameIndex(items, locale);
  return ELEMENT_OPTIONS.map((element) => {
    const result = buildLuckyMaterialListForElement({
      items,
      rootItemId,
      locale,
      elementKey: element.key,
      nameIndex,
    });

    return {
      ...element,
      ...result,
    };
  });
}

export default function LuckyListDialog({
  open,
  itemId,
  items,
  locale,
  t,
  onClose,
  onOpenItem,
}) {
  const currentItem = items[itemId];
  const currentItemName = pick(currentItem?.name, locale);
  const [activeElementKey, setActiveElementKey] = useState(DEFAULT_ELEMENT_KEY);

  const luckyLists = useMemo(() => {
    if (!currentItem) return [];
    return buildLuckyMaterialLists({ items, rootItemId: itemId, locale });
  }, [currentItem, itemId, items, locale]);

  useEffect(() => {
    if (open) setActiveElementKey(DEFAULT_ELEMENT_KEY);
  }, [itemId, open]);

  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose?.();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const activeList = luckyLists.find((list) => list.key === activeElementKey) || luckyLists[0];

  if (!open || !currentItem || !activeList) return null;

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) onClose?.();
  }

  function handleOpenMaterial(materialId) {
    if (!materialId) return;
    onOpenItem?.(materialId);
    onClose?.();
  }

  return (
    <div className="inferenceDialogOverlay" onMouseDown={handleBackdropClick}>
      <section className="inferenceDialog luckyListDialog" role="dialog" aria-modal="true" aria-labelledby="luckyListDialogTitle">
        <header className="inferenceDialogHead">
          <h2 id="luckyListDialogTitle">
            {currentItemName}{t.inferenceTitleSeparator}{t.luckyListTitle}
          </h2>
          <button className="inferenceCloseBtn" type="button" onClick={onClose} aria-label={t.closeLuckyListDialog}>×</button>
        </header>

        <div className="inferenceDialogBody luckyListBody">
          <section className="luckyListIntro">
            <p>{t.luckyListDescription}</p>
          </section>

          <div className="luckyElementTabs" role="tablist" aria-label={t.luckyListTitle}>
            {luckyLists.map((list) => {
              const selected = list.key === activeElementKey;
              return (
                <button
                  key={list.key}
                  className={`luckyElementTab${selected ? ' active' : ''}`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveElementKey(list.key)}
                >
                  <strong>{pick(list.label, locale)}</strong>
                  <span>{list.totalAmount}{t.luckyListTotalSuffix} / {list.entries.length}{t.luckyListKindSuffix}</span>
                </button>
              );
            })}
          </div>

          <section className="luckyElementPanel" aria-label={`${pick(activeList.label, locale)} ${t.luckyListMaterialTitle}`}>
            {activeList.entries.length ? (
              <section className="luckyListMaterialPanel" aria-label={t.luckyListMaterialTitle}>
                <div className="luckyListMaterialHead">
                  <span>{t.luckyListMaterialTitle}</span>
                  <span>{t.luckyListLevelTitle}</span>
                  <span>{t.type}</span>
                  <span>{t.luckyListSourceTitle}</span>
                  <span>{t.luckyListAmountTitle}</span>
                </div>

                <div className="luckyListMaterialRows">
                  {activeList.entries.map((entry) => {
                    const sourceText = entry.sourceLabels.length ? entry.sourceLabels.join(locale === 'en' ? ', ' : '、') : t.luckyListMissingValue;
                    const rowContent = (
                      <>
                        <span className="luckyListMaterialName">{entry.name}</span>
                        <span className="luckyListLevelCell">{entry.level != null ? `${t.levelPrefix}${entry.level}` : t.luckyListMissingValue}</span>
                        <span className="luckyListTypeCell">
                          {entry.type ? <TypeTag type={entry.type} locale={locale} compact /> : <span className="luckyListMissingCell">{t.luckyListMissingValue}</span>}
                        </span>
                        <span className="luckyListSourceCell" title={sourceText}>{sourceText}</span>
                        <strong className="luckyListAmount">×{entry.amount}</strong>
                        {entry.circular ? <span className="luckyListCircularCell">{t.luckyListCircularMark}</span> : null}
                      </>
                    );

                    if (entry.id) {
                      return (
                        <button
                          key={entry.key}
                          className="luckyListMaterialRow"
                          type="button"
                          onClick={() => handleOpenMaterial(entry.id)}
                        >
                          {rowContent}
                        </button>
                      );
                    }

                    return (
                      <div key={entry.key} className="luckyListMaterialRow plain">
                        {rowContent}
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : (
              <div className="inferenceEmptyResult">
                {t.luckyListEmptyResult}
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
