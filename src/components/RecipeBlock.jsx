import React from 'react';
import TypeTag from './TypeTag.jsx';
import { cx, entryBool, pick } from '../lib/ui.js';

export default function RecipeBlock({ item, itemId, recipe, recipeIndex, items, locale, t, setSelectedRecipe, enterMaterial }) {
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
