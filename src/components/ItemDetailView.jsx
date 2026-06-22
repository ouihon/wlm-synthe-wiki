import React, { useState } from 'react';
import CraftingInferenceDialog from './CraftingInferenceDialog.jsx';
import RecipeBlock from './RecipeBlock.jsx';
import { cx, pick } from '../lib/ui.js';
import { itemAnalyticsParams, trackEvent } from '../lib/analytics.js';

export default function ItemDetailView({
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
  isFavorite = false,
  onToggleFavorite,
  onOpenItem,
  handbookMissingLabel,
  handbookMissingHint,
  sourcePage = 'unknown',
}) {
  const [inferenceOpen, setInferenceOpen] = useState(false);
  const currentItemName = pick(currentItem.name, locale);
  const favoriteLabel = isFavorite
    ? pick({ 'zh-Hans': '取消收藏', 'zh-Hant': '取消收藏', en: 'Remove favorite' }, locale)
    : pick({ 'zh-Hans': '收藏', 'zh-Hant': '收藏', en: 'Favorite' }, locale);

  function handleInferenceOpen() {
    trackEvent('chain_inference_click', {
      ...itemAnalyticsParams(currentId, currentItem, locale),
      page: sourcePage,
      entry: 'detail_button',
    });
    setInferenceOpen(true);
  }

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
          <div className="itemHeroTitle">
            <div className="eyebrow">{pick(rootItem.name, locale) === currentItemName ? t.root : t.current}</div>
            <h1>{currentItemName}</h1>
          </div>
          <div className="heroSide">
            <div className="heroActionRow">
              <button
                className={cx('favoriteBtn', 'detailFavoriteBtn', isFavorite && 'active')}
                type="button"
                onClick={() => onToggleFavorite?.(currentId)}
                aria-pressed={isFavorite}
                aria-label={`${favoriteLabel}：${currentItemName}`}
                title={favoriteLabel}
              >
                <span aria-hidden="true">{isFavorite ? '★' : '☆'}</span>
                <span className="favoriteBtnText">{favoriteLabel}</span>
              </button>
              <button
                className="inferenceTriggerBtn"
                type="button"
                onClick={handleInferenceOpen}
              >
                <span className="inferenceTriggerText">{t.inferenceTitle}</span>
              </button>
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
            setSelectedRecipe={setSelectedRecipe}
            enterMaterial={enterMaterial}
          />
        ) : (
          <div className="noRecipeBox">
            <strong>{t.noRecipe}</strong>
          </div>
        )}
      </article>

      <CraftingInferenceDialog
        open={inferenceOpen}
        itemId={currentId}
        items={items}
        locale={locale}
        t={t}
        onClose={() => setInferenceOpen(false)}
        onOpenItem={onOpenItem}
      />
    </main>
  );
}

