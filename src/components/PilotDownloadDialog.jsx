import { useEffect, useMemo } from 'react';
import uiText from '../i18n/ui.json';

const ZIP_URL = 'https://github.com/ouihon/wlm-synthe-wiki/releases/download/wonderland/Wonderland-M-pilot.zip';
const YOUTUBE_EMBED_URL = 'https://www.youtube.com/embed/XI2LKhvECFA';
const YOUTUBE_WATCH_URL = 'https://www.youtube.com/watch?v=XI2LKhvECFA';

export default function PilotDownloadDialog({ open, onClose, locale }) {
  const t = useMemo(() => uiText[locale] ?? uiText['zh-Hans'], [locale]);

  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose?.();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  function handleOverlayClick(event) {
    if (event.target === event.currentTarget) onClose?.();
  }

  function handleZipClick() {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'download_click', {
        file_name: 'Wonderland-M-pilot.zip',
        file_url: ZIP_URL,
        source: 'pilot_dialog',
      });
    }
  }

  return (
    <div className="pilotDialogOverlay" role="presentation" onClick={handleOverlayClick}>
      <section className="pilotDialog" role="dialog" aria-modal="true" aria-labelledby="pilot-dialog-title">
        <div className="pilotDialogCard">
          <button type="button" className="pilotClose" onClick={onClose} aria-label={t.pilotClose}>
            ×
          </button>
          <header className="pilotHeader">
            <div className="pilotHeaderCopy">
              <div className="pilotBadgeRow" aria-label={t.pilotTagsLabel}>
                <span>PILOT PLUGIN</span>
                <span>Wonderland M</span>
              </div>
              <h2 id="pilot-dialog-title">{t.pilotTitle}</h2>
              <p>{t.pilotDescription}</p>
            </div>
          </header>

          <div className="pilotGrid">
            <section className="videoPanel">
              <div className="pilotVideoFrame">
                <iframe
                  src={YOUTUBE_EMBED_URL}
                  title={t.pilotVideoTitle}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
              <div className="pilotActionRow">
                <a
                  className="pilotActionButton primary"
                  href={ZIP_URL}
                  target="_blank"
                  rel="noreferrer"
                  onClick={handleZipClick}
                >
                  {t.pilotDownloadZip}
                </a>
                <a
                  className="pilotActionButton secondary"
                  href={YOUTUBE_WATCH_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t.pilotOpenYoutube}
                </a>
              </div>
            </section>

            <aside className="releasePanel">
              <div className="releasePanelHead">
                <span>Release Notes</span>
              </div>
              <div className="pilotReleaseList">
                <article className="pilotReleaseCard">
                  <h3>{t.pilotRelease1Title}</h3>
                  <p>{t.pilotRelease1Text}</p>
                </article>
                <article className="pilotReleaseCard">
                  <h3>{t.pilotRelease2Title}</h3>
                  <p>{t.pilotRelease2Text}</p>
                </article>
                <article className="pilotReleaseCard">
                  <h3>{t.pilotRelease3Title}</h3>
                  <p>{t.pilotRelease3Text}</p>
                </article>
              </div>
              <p className="pilotFootnote">{t.pilotFootnote}</p>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
