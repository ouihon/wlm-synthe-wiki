import React from 'react';
import RecipeBlock from './RecipeBlock.jsx';
import { cx, pick } from '../lib/ui.js';

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
