import React, { useEffect, useMemo, useState } from 'react';
import ReactFlow, { Background, Controls, Handle, MiniMap, Position, ReactFlowProvider } from 'reactflow';
import TypeTag from '../components/TypeTag.jsx';
import { cx, getHandbookMissingWarning, getTypeFilterStyle, getTypeTheme, pick } from '../lib/ui.js';

const DUNGEON_PRODUCT_COLLAPSE_LIMIT = 24;
const DUNGEON_RECIPE_EDGE_COLORS = ['#2563eb', '#d97706', '#059669', '#dc2626', '#7c3aed', '#0891b2', '#c2410c', '#be185d', '#4f46e5', '#65a30d'];

function isDungeonItemDisabled(itemId, items) {
  return getHandbookMissingWarning(items?.[itemId]);
}

function normalizeDungeonTreeData(data, items) {
  if (!data || data.schemaVersion !== 3) return data;
  return { ...data, roots: (data.roots ?? []).map((root) => normalizeDungeonTreeRoot(root, items)) };
}

function normalizeDungeonTreeRoot(root, items) {
  const sourceNodes = root.nodes ?? {};
  const nodes = {};

  for (const [nodeId, node] of Object.entries(sourceNodes)) {
    const display = getDungeonItemDisplayNode(nodeId, items, node);
    nodes[nodeId] = {
      ...display,
      children: (node.children ?? []).map((edge) => normalizeDungeonTreeEdge(edge, root.recipes ?? {}, items, sourceNodes)),
    };
  }

  const allCraftableItemNodes = (root.productIds ?? [])
    .map((itemId) => getDungeonItemDisplayNode(itemId, items, sourceNodes[itemId]))
    .filter((node) => node.id);

  return { ...root, nodes, allCraftableItemNodes };
}

function normalizeDungeonTreeEdge(edge, recipes, items, sourceNodes) {
  const recipe = recipes[edge.recipeId] ?? {};
  const target = getDungeonItemDisplayNode(edge.toId, items, sourceNodes?.[edge.toId], edge);
  return {
    toId: edge.toId,
    materialPosition: edge.materialPosition,
    materialRole: edge.materialRole ?? '',
    recipe: recipe.recipe ?? '',
    book: recipe.book ?? '',
    rank: recipe.rank ?? '',
    source: recipe.source ?? '',
    recommended: recipe.recommended === true,
    bad: recipe.bad === true,
    toName: target.name,
    toType: target.type,
    toLevel: target.level,
    toStats: target.stats,
  };
}

function getDungeonItemDisplayNode(itemId, items, fallback = {}, edge = null) {
  const item = items?.[itemId];
  return {
    id: itemId ?? fallback?.id ?? '',
    name: pick(item?.name, 'zh-Hant') || fallback?.name || edge?.toName || itemId || '',
    type: pick(item?.type, 'zh-Hant') || fallback?.type || edge?.toType || '',
    level: item?.level ?? fallback?.level ?? edge?.toLevel ?? '',
    stats: item?.stats ?? fallback?.stats ?? edge?.toStats ?? '',
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

function getInitialDungeonRoot(data, items) {
  return sortDungeonRoots(normalizeDungeonTreeData(data, items)?.roots ?? [])[0] ?? null;
}

function getInitialDungeonProduct(data, items) {
  return sortDungeonProducts(getInitialDungeonRoot(data, items)?.allCraftableItemNodes ?? [])[0] ?? null;
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
  return [`${text.products}：${node.name ?? '—'}`, `${text.level}：${node.level ?? '—'}`, `${text.type}：${node.type || '—'}`, `${text.stats}：${node.stats || '—'}`].join('\n');
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

function getDungeonRecipeColorKey(group) {
  return [group?.recipe ?? '', group?.book ?? '', group?.rank ?? '', group?.source ?? '', group?.recommended === true ? 'recommended' : '', group?.bad === true ? 'bad' : ''].join('|');
}

function getDungeonChildPosition(parentPosition, layer, siblingIndex, siblingCount) {
  const center = (siblingCount - 1) / 2;
  const gap = siblingCount <= 2 ? 250 : 220;
  return { x: parentPosition.x + (siblingIndex - center) * gap, y: layer * 170 };
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

function normalizeItemAsDungeonNode(id, item, locale) {
  return { id, name: pick(item.name, locale), type: pick(item.type, locale), level: item.level ?? '', stats: item.stats ?? '' };
}

function normalizeDungeonNameKey(value) {
  return String(value ?? '').trim().replace(/[\s　]+/g, '').replace(/[()（）]/g, '').toLowerCase();
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

function parseDungeonRecipeMaterialNames(recipe) {
  return String(recipe ?? '').split('+').map((part) => part.replace(/[x×]\s*\d+/gi, '').trim()).filter(Boolean);
}

function normalizeDungeonBook(book) {
  const value = String(book ?? '').trim();
  if (!value || value === '無' || value === '无') return '';
  return value;
}

function isDungeonMainMaterial(material) {
  const role = String(material.edge?.materialRole ?? '');
  if (role.includes('主')) return true;
  return Number(material.edge?.materialPosition ?? material.order ?? 0) === 1;
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

function compactDungeonSummaryVisibleLines(lines) {
  if (lines.length <= 3) return lines;
  const bookIndex = lines.findIndex((line) => /^書|^书/i.test(line));
  if (bookIndex < 0) return lines.slice(0, 3);
  const materialLines = lines.filter((_, index) => index !== bookIndex);
  return [...materialLines.slice(0, 2), lines[bookIndex]];
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

  for (const material of group.materials ?? []) addMaterial(material.node, material.edge, Number(material.edge?.materialPosition ?? 999));
  parseDungeonRecipeMaterialNames(group.recipe).forEach((name, index) => {
    const matched = nameIndex.get(normalizeDungeonNameKey(name));
    addMaterial(matched ?? { id: '', name, type: '', level: '', stats: '' }, null, index + 1);
  });

  return ordered.sort((a, b) => a.order - b.order);
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

function pickRepresentativeRecipeGroup(groups) {
  if (!groups?.length) return null;
  return [...groups].sort(compareDungeonRecipeGroups)[0];
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

function pickDungeonPathRecipeGroup(itemId, selectedRootId, reverseIndex, reachMemo, requireRootPath = false) {
  const groups = reverseIndex.get(itemId) ?? [];
  if (!groups.length) return null;
  const pathGroups = groups.filter((group) => dungeonGroupCanReachRoot(group, selectedRootId, reverseIndex, reachMemo, new Set([itemId])));
  if (pathGroups.length) return pickRepresentativeRecipeGroup(pathGroups);
  return requireRootPath ? null : pickRepresentativeRecipeGroup(groups);
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
  const recipeColorMap = new Map();

  function addNode(node, position = null) {
    const layer = node.data.layer ?? 0;
    const index = layerCounts.get(layer) ?? 0;
    layerCounts.set(layer, index + 1);
    const graphNode = { ...node, position: position ?? { x: index * 270, y: layer * 170 } };
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

  function getRecipeColor(group) {
    if (!group) return 'rgba(37, 99, 235, 0.48)';
    const key = getDungeonRecipeColorKey(group);
    if (!recipeColorMap.has(key)) {
      recipeColorMap.set(key, DUNGEON_RECIPE_EDGE_COLORS[recipeColorMap.size % DUNGEON_RECIPE_EDGE_COLORS.length]);
    }
    return recipeColorMap.get(key);
  }

  function visitItem(item, depth, path, parentNodeId = null, parentGroup = null, edge = null, pathKey = 'root', siblingIndex = 0, siblingCount = 1) {
    const itemId = item.id;
    const node = normalizeDungeonNode(nodesById[itemId] ?? item, itemId, edge);
    const repeated = itemId ? path.has(itemId) : false;
    const graphNodeId = `item-${pathKey}-${hashString(itemId || node.name || pathKey)}`;
    const disabled = itemId ? isDungeonItemDisabled(itemId, items) : false;
    const parentNode = parentNodeId ? nodeByGraphId.get(parentNodeId) : null;
    const position = parentNode ? getDungeonChildPosition(parentNode.position, depth, siblingIndex, siblingCount) : { x: 0, y: depth * 170 };

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
      const recipeColor = getRecipeColor(parentGroup);
      addEdge({
        id: `${parentNodeId}-${graphNodeId}`,
        source: parentNodeId,
        target: graphNodeId,
        sourceHandle: pickDungeonSourceHandle(siblingIndex, siblingCount),
        targetHandle: pickDungeonTargetHandle(siblingIndex, siblingCount),
        label: edge?.materialRole ?? '',
        animated: parentGroup?.recommended === true,
        data: { siblingIndex, siblingCount, recommended: parentGroup?.recommended === true, isSummaryEdge: false, edgeColor: recipeColor },
        style: { stroke: recipeColor, strokeWidth: parentGroup?.recommended ? 3 : 2, strokeDasharray: '7 5' },
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
      const recipeColor = getRecipeColor(group);
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
        data: { siblingIndex: summaryIndex, siblingCount: totalChildren, recommended: group.recommended === true, isSummaryEdge: true, edgeColor: recipeColor },
        style: { stroke: recipeColor, strokeWidth: group.recommended === true ? 3 : 2, strokeDasharray: '4 7' },
      });
    }

    return graphNodeId;
  }

  visitItem(selectedProduct, 0, new Set());
  resolveDungeonLayerCollisions(graphNodes);
  const maxLayerWidth = Math.max(0, ...[...layerCounts.values()]);
  return { nodes: graphNodes, edges: graphEdges, maxLayerWidth, preferReadableViewport: maxLayerWidth > 5 };
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
  const stroke = data.edgeColor ?? style.stroke ?? (data.isSummaryEdge ? 'rgba(100, 116, 139, 0.34)' : '#2563eb');
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

export default function DungeonMaterialTreePage({ data, items, locale, onOpenItem }) {
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

  const normalizedData = useMemo(() => normalizeDungeonTreeData(data, items), [data, items]);
  const roots = useMemo(() => sortDungeonRoots(normalizedData?.roots ?? []), [normalizedData]);
  const [materialQuery, setMaterialQuery] = useState('');
  const [selectedMaterialId, setSelectedMaterialId] = useState(() => getInitialDungeonRoot(data, items)?.materialId ?? '');
  const [productQuery, setProductQuery] = useState('');
  const [productType, setProductType] = useState('all');
  const [selectedProductId, setSelectedProductId] = useState(() => getInitialDungeonProduct(data, items)?.id ?? '');
  const [selectedTreeNodeId, setSelectedTreeNodeId] = useState(() => getInitialDungeonProduct(data, items)?.id ?? '');
  const [showAllProducts, setShowAllProducts] = useState(false);

  const selectedRoot = useMemo(() => roots.find((root) => root.materialId === selectedMaterialId) ?? roots[0] ?? null, [roots, selectedMaterialId]);
  const filteredRoots = useMemo(() => {
    const raw = materialQuery.trim().toLowerCase();
    if (!raw) return roots;
    return roots.filter((root) => [root.materialName, root.materialType, String(root.materialLevel ?? ''), root.materialStats ?? ''].join(' ').toLowerCase().includes(raw));
  }, [roots, materialQuery]);
  const sortedProducts = useMemo(() => sortDungeonProducts(selectedRoot?.allCraftableItemNodes ?? []), [selectedRoot]);

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
  const visibleProducts = shouldCollapseProducts && !showAllProducts ? filteredProducts.slice(0, DUNGEON_PRODUCT_COLLAPSE_LIMIT) : filteredProducts;

  useEffect(() => {
    if (!selectedRoot) return;
    const firstProduct = sortDungeonProducts(selectedRoot.allCraftableItemNodes ?? []).find((item) => !isDungeonItemDisabled(item.id, items)) ?? null;
    setProductQuery('');
    setProductType('all');
    setShowAllProducts(false);
    setSelectedProductId(firstProduct?.id ?? '');
    setSelectedTreeNodeId(firstProduct?.id ?? '');
  }, [selectedRoot?.materialId, items]);

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
  }, [selectedRoot, selectedProduct, items, text]);

  const nodeTypes = useMemo(() => ({ dungeonItem: DungeonItemGraphNode }), []);
  const edgeTypes = useMemo(() => ({ dungeonFlow: DungeonFlowEdge }), []);
  const hasProducts = Boolean(sortedProducts.length);
  const selectedProductMissingTree = Boolean(selectedProduct && !(selectedRootReverseIndex.has(selectedProduct.id) || selectedRoot?.nodes?.[selectedProduct.id]));
  const graphKey = `${selectedRoot?.materialId ?? 'none'}-${selectedProduct?.id ?? 'none'}`;

  function selectMaterial(materialId) {
    if (!roots.some((root) => root.materialId === materialId)) return;
    setSelectedMaterialId(materialId);
  }

  function selectProduct(productId) {
    if (isDungeonItemDisabled(productId, items)) return;
    setSelectedProductId(productId);
    setSelectedTreeNodeId(productId);
  }

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
              <input value={materialQuery} onChange={(event) => setMaterialQuery(event.target.value)} placeholder={text.materialSearch} spellCheck="false" />
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
                    <input value={productQuery} onChange={(event) => setProductQuery(event.target.value)} placeholder={text.productSearch} spellCheck="false" />
                  </div>
                  <div className="typeFilterBar dungeonTypeFilterBar" aria-label={text.type}>
                    <button className={cx('typeFilterBtn', productType === 'all' && 'active')} onClick={() => setProductType('all')} style={getTypeFilterStyle('__default')}>
                      {text.all}
                    </button>
                    {productTypeOptions.map((type) => (
                      <button key={type} className={cx('typeFilterBtn', productType === type && 'active')} onClick={() => setProductType(type)} style={getTypeFilterStyle(type)}>
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
                  <button className="dungeonProductToggle" type="button" onClick={() => setShowAllProducts((value) => !value)}>
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
