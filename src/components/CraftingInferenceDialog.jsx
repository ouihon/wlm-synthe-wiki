import React, { useEffect, useMemo, useState } from 'react';
import TypeTag from './TypeTag.jsx';
import { cx, pick } from '../lib/ui.js';

const MAX_INFERENCE_STEPS = 7;
const DEFAULT_INFERENCE_STEPS = 3;
const MIN_LOADING_MS = 1200;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildCraftUpIndex(items) {
  const index = new Map();

  Object.entries(items).forEach(([productId, item]) => {
    const recipes = Array.isArray(item.recipes) ? item.recipes : [];

    recipes.forEach((recipe, recipeIndex) => {
      const materials = Array.isArray(recipe.materials) ? recipe.materials : [];

      materials.forEach((material) => {
        const materialId = material?.itemId;
        if (!materialId || !items[materialId]) return;

        if (!index.has(materialId)) index.set(materialId, []);
        index.get(materialId).push({ productId, recipeIndex });
      });
    });
  });

  return index;
}

function sortResultEntries(a, b, items, locale) {
  if (a.step !== b.step) return a.step - b.step;

  const aLevel = items[a.id]?.level ?? -1;
  const bLevel = items[b.id]?.level ?? -1;
  if (aLevel !== bLevel) return bLevel - aLevel;

  return pick(items[a.id]?.name, locale).localeCompare(pick(items[b.id]?.name, locale), locale);
}

function inferCraftableItems({ items, craftUpIndex, startItemId, maxSteps, locale }) {
  const queue = [{ id: startItemId, step: 0, path: [startItemId] }];
  const bestStepByItem = new Map();
  const results = [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (current.step >= maxSteps) continue;

    const nextProducts = craftUpIndex.get(current.id) ?? [];
    if (nextProducts.length === 0) continue;

    for (const { productId } of nextProducts) {
      if (!items[productId]) continue;
      if (current.path.includes(productId)) continue;

      const nextStep = current.step + 1;
      const knownStep = bestStepByItem.get(productId);
      if (knownStep !== undefined && knownStep <= nextStep) continue;

      const nextPath = [...current.path, productId];
      bestStepByItem.set(productId, nextStep);

      const oldIndex = results.findIndex((result) => result.id === productId);
      if (oldIndex >= 0) results.splice(oldIndex, 1);

      results.push({
        id: productId,
        step: nextStep,
        path: nextPath,
      });

      queue.push({
        id: productId,
        step: nextStep,
        path: nextPath,
      });
    }
  }

  return results.sort((a, b) => sortResultEntries(a, b, items, locale));
}

function groupResultsByStep(results) {
  return results.reduce((groups, result) => {
    if (!groups.has(result.step)) groups.set(result.step, []);
    groups.get(result.step).push(result);
    return groups;
  }, new Map());
}

export default function CraftingInferenceDialog({
  open,
  itemId,
  items,
  locale,
  t,
  onClose,
  onOpenItem,
}) {
  const [stepCount, setStepCount] = useState(DEFAULT_INFERENCE_STEPS);
  const [phase, setPhase] = useState('select');
  const [results, setResults] = useState([]);
  const [selectedResultId, setSelectedResultId] = useState(null);

  const currentItem = items[itemId];
  const currentItemName = pick(currentItem?.name, locale);
  const craftUpIndex = useMemo(() => buildCraftUpIndex(items), [items]);

  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose?.();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    setPhase('select');
    setResults([]);
    setSelectedResultId(null);
    setStepCount(DEFAULT_INFERENCE_STEPS);
  }, [open, itemId]);

  useEffect(() => {
    if (!results.length) {
      setSelectedResultId(null);
      return;
    }
    if (!selectedResultId || !results.some((result) => result.id === selectedResultId)) {
      setSelectedResultId(results[0].id);
    }
  }, [results, selectedResultId]);

  const selectedResult = useMemo(() => {
    return results.find((result) => result.id === selectedResultId) ?? null;
  }, [results, selectedResultId]);

  const groupedResults = useMemo(() => groupResultsByStep(results), [results]);

  if (!open || !currentItem) return null;

  async function handleStart() {
    setPhase('loading');

    const [nextResults] = await Promise.all([
      Promise.resolve(inferCraftableItems({
        items,
        craftUpIndex,
        startItemId: itemId,
        maxSteps: stepCount,
        locale,
      })),
      wait(MIN_LOADING_MS),
    ]);

    setResults(nextResults);
    setSelectedResultId(nextResults[0]?.id ?? null);
    setPhase('results');
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) onClose?.();
  }

  function handleLocateItem() {
    if (!selectedResultId) return;
    onOpenItem?.(selectedResultId);
    onClose?.();
  }

  const selectedItem = selectedResult ? items[selectedResult.id] : null;

  return (
    <div className="inferenceDialogOverlay" onMouseDown={handleBackdropClick}>
      <section className="inferenceDialog" role="dialog" aria-modal="true" aria-labelledby="inferenceDialogTitle">
        <header className="inferenceDialogHead">
          <h2 id="inferenceDialogTitle">
            {currentItemName}{t.inferenceTitleSeparator}{t.inferenceTitle}
          </h2>
          <button className="inferenceCloseBtn" type="button" onClick={onClose} aria-label={t.closeInferenceDialog}>×</button>
        </header>

        <div className="inferenceDialogBody">
          {phase === 'select' ? (
            <section className="inferenceSelectPanel">
              <div className="inferenceStepValue">
                <strong>{stepCount}</strong>
                <span>{t.inferenceWithinSteps}</span>
              </div>

              <div className="inferenceRangeCard">
                <input
                  className="inferenceRange"
                  type="range"
                  min="1"
                  max={MAX_INFERENCE_STEPS}
                  value={stepCount}
                  onChange={(event) => setStepCount(Number(event.target.value))}
                  aria-label={t.inferenceStepSlider}
                />
                <div className="inferenceRangeLabels">
                  <span>{t.inferenceOneStep}</span>
                  <span>{t.inferenceSevenSteps}</span>
                </div>
              </div>

              <div className="inferenceDialogActions">
                <button className="secondaryAction inferenceActionBtn" type="button" onClick={onClose}>{t.cancelInference}</button>
                <button className="primaryAction inferenceActionBtn" type="button" onClick={handleStart}>{t.startInference}</button>
              </div>
            </section>
          ) : null}

          {phase === 'loading' ? (
            <section className="inferenceLoadingPanel" aria-live="polite">
              <strong>{t.inferenceLoadingPrefix}{stepCount}{t.inferenceLoadingSuffix}</strong>
              <div className="inferenceLoadingBar" aria-hidden="true"><span /></div>
            </section>
          ) : null}

          {phase === 'results' ? (
            <section className="inferenceResultsPanel">
              <div className="inferenceResultsTop">
                <div className="inferenceResultSummary">
                  <strong>{results.length}</strong>
                  <span>{t.inferenceResultCountSuffix}</span>
                </div>
                <button className="secondaryAction inferenceResetBtn" type="button" onClick={() => setPhase('select')}>
                  {t.resetInferenceSteps}
                </button>
              </div>

              {results.length ? (
                <div className="inferenceResultsGrid">
                  <div className="inferenceResultList">
                    {[...groupedResults.entries()].map(([step, group]) => (
                      <section className="inferenceStepGroup" key={step}>
                        <div className="inferenceStepHeading">
                          <span>{t.inferenceStepGroupPrefix}{step}{t.inferenceStepGroupSuffix}</span>
                          <span>{group.length}{t.inferenceGroupCountSuffix}</span>
                        </div>

                        {group.map((result) => {
                          const resultItem = items[result.id];
                          const resultName = pick(resultItem.name, locale);
                          return (
                            <button
                              key={result.id}
                              className={cx('inferenceResultRow', selectedResultId === result.id && 'active')}
                              type="button"
                              onClick={() => setSelectedResultId(result.id)}
                            >
                              <span className="inferenceLevelPill">{resultItem.level ? `${t.levelPrefix}${resultItem.level}` : t.unrecorded}</span>
                              <TypeTag type={resultItem.type} locale={locale} compact />
                              <span className="inferenceResultName">{resultName}</span>
                            </button>
                          );
                        })}
                      </section>
                    ))}
                  </div>

                  <aside className="inferencePathPanel">
                    {selectedResult && selectedItem ? (
                      <>
                        <div className="inferenceSelectedHead">
                          <h3>{pick(selectedItem.name, locale)}</h3>
                          <div className="inferenceSelectedMeta">
                            <span>{selectedItem.level ? `${t.levelPrefix}${selectedItem.level}` : t.unrecorded}</span>
                            <TypeTag type={selectedItem.type} locale={locale} compact />
                            <span>{t.inferenceStepMetaPrefix}{selectedResult.step}{t.inferenceStepMetaSuffix}</span>
                          </div>
                        </div>

                        <div className="inferencePathBlock">
                          <div className="inferencePathTitle">{t.inferencePathTitle}</div>
                          <div className="inferencePathChain">
                            {selectedResult.path.map((pathItemId, index) => (
                              <React.Fragment key={`${pathItemId}-${index}`}>
                                <span className="inferencePathNode">{pick(items[pathItemId]?.name, locale)}</span>
                                {index < selectedResult.path.length - 1 ? <span className="inferencePathArrow">→</span> : null}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>

                        <div className="inferencePathActions">
                          <button className="primaryAction inferenceLocateBtn" type="button" onClick={handleLocateItem}>
                            {t.locateInferenceItem}
                          </button>
                        </div>
                      </>
                    ) : null}
                  </aside>
                </div>
              ) : (
                <div className="inferenceEmptyResult">
                  {t.inferenceEmptyResult}
                </div>
              )}
            </section>
          ) : null}
        </div>
      </section>
    </div>
  );
}
