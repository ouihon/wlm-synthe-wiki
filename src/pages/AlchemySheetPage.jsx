import React, { useMemo, useState } from 'react';
import TypeTag from '../components/TypeTag.jsx';
import { getCanonicalType, getTypeOptions, pick } from '../lib/ui.js';

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
      matchingRecipes.push({ recipe, originalIndex, normalizedRecipeChain, matchRank });
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

export default function AlchemySheetPage({ items, locale, onOpenItem }) {
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

  const queryChain = useMemo(() => [mainType, ...subTypes.filter(Boolean)].filter(Boolean), [mainType, subTypes]);
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
          <input type="number" min="1" max="999" value={minLevel} onChange={(event) => setMinLevel(event.target.value)} />
        </label>
        <label className="sheetField small">
          <span>{text.maxLevel}</span>
          <input type="number" min="1" max="999" value={maxLevel} onChange={(event) => setMaxLevel(event.target.value)} />
        </label>
        <label className="sheetField">
          <span>{text.mainType}</span>
          <select value={mainType} onChange={(event) => setMainType(event.target.value)} required>
            <option value="">{text.selectType}</option>
            {typeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
        {subTypes.map((value, index) => (
          <label className="sheetField" key={index}>
            <span>{text.subType}{index + 1}</span>
            <select value={value} onChange={(event) => updateSubType(index, event.target.value)}>
              <option value="">—</option>
              {typeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
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
                    {row.recipes.map((line, index) => <div key={index}>{line}</div>)}
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
