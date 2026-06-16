import React from 'react';
import { pick } from '../lib/ui.js';

export default function CreditsPage({ locale, guideLinks }) {
  return (
    <section className="guidePanel">
      <div className="guidePanelHead">
        <h2>{pick({ 'zh-Hans': '资料鸣谢', 'zh-Hant': '資料鳴謝', en: 'Credits' }, locale)}</h2>
        <span>{guideLinks.length}</span>
      </div>
      <div className="guideList">
        {guideLinks.map((entry) => (
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
  );
}
