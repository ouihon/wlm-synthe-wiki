import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ItemIcon from './ItemIcon.jsx';
import CorrectionDialog from './CorrectionDialog.jsx';
import CraftingInferenceDialog from './CraftingInferenceDialog.jsx';
import LuckyListDialog from './LuckyListDialog.jsx';
import RecipeBlock from './RecipeBlock.jsx';
import { cx, pick } from '../lib/ui.js';
import { itemAnalyticsParams, trackEvent } from '../lib/analytics.js';

const CORRECTION_TOAST_DURATION_MS = 5000;

function recipeTextValue(value, locale) {
  return pick(value, locale) || pick(value, 'zh-Hans') || '';
}

function shouldIncludeRecipeBook(book, locale) {
  const label = recipeTextValue(book, locale);
  if (!label) return false;
  return !['无', '無', 'none', 'no', 'n/a', '-'].includes(label.trim().toLowerCase());
}

function buildCorrectionClipboardText({ item, recipe, recipeIndex, locale, t }) {
  const itemName = recipeTextValue(item.name, locale);
  if (!recipe) return `${itemName} ${t.noRecipe}`;

  const recipeTitle = recipeTextValue(recipe.title, locale) || `${t.recipe}${recipeIndex + 1}`;
  const materialNames = (recipe.materials ?? [])
    .map((material) => recipeTextValue(material.name, locale) || material.itemId || t.unrecorded)
    .filter(Boolean);
  const bookName = shouldIncludeRecipeBook(recipe.book, locale) ? recipeTextValue(recipe.book, locale) : '';
  const formulaParts = bookName ? [...materialNames, bookName] : materialNames;
  const formulaText = formulaParts.length ? formulaParts.join('+') : t.noRecipe;
  const rankName = recipeTextValue(recipe.rank, locale);

  return `${itemName} ${recipeTitle}${t.correctionRecipeSeparator}${formulaText}${rankName ? ` ${t.correctionRankPrefix}${rankName}${t.correctionRankSuffix}` : ''}`;
}

function ComicTooltip({ anchorRef, text, open }) {
  const tooltipRef = useRef(null);
  const [position, setPosition] = useState(null);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return undefined;

    function updatePosition() {
      if (!anchorRef.current) return;
      const anchorRect = anchorRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current?.getBoundingClientRect();
      const tooltipWidth = tooltipRect?.width ?? 260;
      const gap = 12;
      const margin = 12;
      const left = Math.min(
        Math.max(anchorRect.left + anchorRect.width / 2 - tooltipWidth / 2, margin),
        window.innerWidth - tooltipWidth - margin,
      );
      const top = Math.max(anchorRect.top - gap, margin);
      const arrowLeft = anchorRect.left + anchorRect.width / 2 - left;
      setPosition({ left, top, arrowLeft });
    }

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [anchorRef, open, text]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={tooltipRef}
      className="comicTooltipBubble"
      role="tooltip"
      style={position ? { left: position.left, top: position.top, '--tooltip-arrow-left': `${position.arrowLeft}px` } : { visibility: 'hidden' }}
    >
      {text}
    </div>,
    document.body,
  );
}

function TooltipButton({ children, className, tooltip, ...props }) {
  const buttonRef = useRef(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        {...props}
        ref={buttonRef}
        className={className}
        aria-label={props['aria-label'] ?? tooltip}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        {children}
      </button>
      <ComicTooltip anchorRef={buttonRef} text={tooltip} open={open} />
    </>
  );
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '-1000px';
  document.body.appendChild(textarea);
  textarea.select();

  try {
    return document.execCommand('copy');
  } finally {
    document.body.removeChild(textarea);
  }
}

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
  const [luckyListOpen, setLuckyListOpen] = useState(false);
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [correctionToast, setCorrectionToast] = useState(false);
  const correctionToastTimerRef = useRef(null);
  const currentItemName = pick(currentItem.name, locale);
  const favoriteLabel = isFavorite
    ? pick({ 'zh-Hans': '取消收藏', 'zh-Hant': '取消收藏', en: 'Remove favorite' }, locale)
    : pick({ 'zh-Hans': '收藏', 'zh-Hant': '收藏', en: 'Favorite' }, locale);

  useEffect(() => {
    return () => {
      if (correctionToastTimerRef.current) {
        window.clearTimeout(correctionToastTimerRef.current);
      }
    };
  }, []);

  function handleInferenceOpen() {
    trackEvent('chain_inference_click', {
      ...itemAnalyticsParams(currentId, currentItem, locale),
      page: sourcePage,
      entry: 'detail_button',
    });
    setInferenceOpen(true);
  }

  function handleLuckyListOpen() {
    trackEvent('lucky_list_click', {
      ...itemAnalyticsParams(currentId, currentItem, locale),
      page: sourcePage,
      entry: 'detail_button',
    });
    setLuckyListOpen(true);
  }

  async function handleCorrectionOpen() {
    const clipboardText = buildCorrectionClipboardText({
      item: currentItem,
      recipe: selectedRecipe,
      recipeIndex: selectedRecipeIndex,
      locale,
      t,
    });

    try {
      await copyTextToClipboard(clipboardText);
      if (correctionToastTimerRef.current) {
        window.clearTimeout(correctionToastTimerRef.current);
      }
      setCorrectionToast(true);
      correctionToastTimerRef.current = window.setTimeout(() => {
        setCorrectionToast(false);
        correctionToastTimerRef.current = null;
      }, CORRECTION_TOAST_DURATION_MS);
    } catch {
      setCorrectionToast(false);
    }

    trackEvent('correction_feedback_click', {
      ...itemAnalyticsParams(currentId, currentItem, locale),
      page: sourcePage,
      entry: 'detail_title_button',
    });
    setCorrectionOpen(true);
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
          <div className="heroIdentity">
            <ItemIcon item={currentItem} locale={locale} className="itemHeroIcon" placeholder />
            <div className="itemHeroTitle">
              <div className="eyebrow">{pick(rootItem.name, locale) === currentItemName ? t.root : t.current}</div>
              <div className="itemTitleRow">
                <h1>{currentItemName}</h1>
                <TooltipButton
                  className="correctionTriggerBtn"
                  type="button"
                  onClick={handleCorrectionOpen}
                  tooltip={t.correctionTooltip}
                >
                  <span className="correctionTriggerIcon" aria-hidden="true">?</span>
                  <span>{t.correctionButton}</span>
                </TooltipButton>
              </div>
            </div>
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
              <TooltipButton
                className="inferenceTriggerBtn"
                type="button"
                onClick={handleInferenceOpen}
                tooltip={t.inferenceTooltip}
              >
                <span className="inferenceTriggerText">{t.inferenceTitle}</span>
              </TooltipButton>
              <TooltipButton
                className="inferenceTriggerBtn"
                type="button"
                onClick={handleLuckyListOpen}
                tooltip={t.luckyListTooltip}
              >
                <span className="inferenceTriggerText">{t.luckyListTitle}</span>
              </TooltipButton>
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
      <LuckyListDialog
        open={luckyListOpen}
        itemId={currentId}
        items={items}
        locale={locale}
        t={t}
        onClose={() => setLuckyListOpen(false)}
        onOpenItem={onOpenItem}
      />
      <CorrectionDialog
        open={correctionOpen}
        itemName={currentItemName}
        locale={locale}
        t={t}
        onClose={() => setCorrectionOpen(false)}
      />
      {correctionToast ? (
        <div className="correctionToast" role="status" aria-live="polite">
          {t.correctionCopiedToast}
        </div>
      ) : null}
    </main>
  );
}
