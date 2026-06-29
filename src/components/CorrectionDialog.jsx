import React, { useEffect, useRef } from 'react';
import { pick } from '../lib/ui.js';

const WJX_SCRIPT_SRC = 'https://v.wjx.cn/handler/jqemed.ashx?activity=rRFSX3Y&width=750&source=iframe&sm=t';

export default function CorrectionDialog({ open, itemName, locale, t, onClose }) {
  const embedRef = useRef(null);

  useEffect(() => {
    if (!open || !embedRef.current) return undefined;

    const container = embedRef.current;
    container.innerHTML = '';

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = WJX_SCRIPT_SRC;
    script.async = true;
    container.appendChild(script);

    return () => {
      container.innerHTML = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose?.();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) onClose?.();
  }

  return (
    <div className="inferenceDialogOverlay correctionDialogOverlay" onMouseDown={handleBackdropClick}>
      <section className="inferenceDialog correctionDialog" role="dialog" aria-modal="true" aria-labelledby="correctionDialogTitle">
        <header className="inferenceDialogHead">
          <h2 id="correctionDialogTitle">
            {itemName}{t.inferenceTitleSeparator}{t.correctionFeedbackTitle}
          </h2>
          <button className="inferenceCloseBtn" type="button" onClick={onClose} aria-label={t.closeCorrectionDialog}>×</button>
        </header>

        <div className="inferenceDialogBody correctionDialogBody">
          <div className="correctionEmbed" ref={embedRef} aria-label={pick({
            'zh-Hans': '问卷星纠错反馈问卷',
            'zh-Hant': '問卷星糾錯回饋問卷',
            en: 'WJX correction feedback form',
          }, locale)} />
        </div>
      </section>
    </div>
  );
}
