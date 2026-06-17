import { useEffect, useState } from 'react';

const STORAGE_KEY = 'alchemy-version-seen';

export function markVersionAsSeen(version) {
  try {
    localStorage.setItem(STORAGE_KEY, version);
  } catch {
    // Ignore storage failures so dialog interactions still proceed.
  }
}

const COPY = {
  'zh-Hans': {
    eyebrow: 'VERSION UPDATE',
    title: '新版本已上线',
    subtitle: '这次更新了副本材料合成树。现在查看副本材料可以合成哪些装备，以及追踪推荐合成路线，会更清楚也更顺手。',
    highlights: [
      {
        title: '副本材料合成树',
        text: '整理了副本材料的可合成装备与推荐路径。同一个配方的连线会使用同一种颜色，关键材料也会更醒目。',
      },
      {
        title: '优化了试算表体验',
        text: '调整了试算表的使用体验，查询和查看配方时更顺手。',
      },
      {
        title: '飄流皮皮（Pilot）正式發布',
        text: '新增自動線上寶箱與自動煉金功能，可觀看教學並下載插件。',
        action: '前去查看',
      },
    ],
    sourcePrefix: '配方资料来自互联网与前人经验整理，可能存在遗漏或版本差异。如发现问题，欢迎联系作者邮箱 ',
    sourceMiddle: ' 或作者的 ',
    sourceSuffix: '。',
    fbLabel: 'Facebook',
    thanksPrefix: '特别鸣谢 ',
    thanksName: 'Gu Dia',
    thanksHonorific: ' 桑',
    thanksSuffix: ' 提供大量帮助~',
    dismiss: '开始使用',
  },
  'zh-Hant': {
    eyebrow: 'VERSION UPDATE',
    title: '新版本已上線',
    subtitle: '這次更新了副本材料合成樹。現在查看副本材料可以合成哪些裝備，以及追蹤推薦合成路線，會更清楚也更順手。',
    highlights: [
      {
        title: '副本材料合成樹',
        text: '整理了副本材料的可合成裝備與推薦路徑。同一個配方的連線會使用同一種顏色，關鍵材料也會更醒目。',
      },
      {
        title: '優化了試算表體驗',
        text: '調整了試算表的使用體驗，查詢和查看配方時更順手。',
      },
      {
        title: '飄流皮皮（Pilot）正式發布',
        text: '新增自動線上寶箱與自動煉金功能，可觀看教學並下載插件。',
        action: '前去查看',
      },
    ],
    sourcePrefix: '配方資料來自網際網路與前人經驗整理，可能存在遺漏或版本差異。如發現問題，歡迎聯絡作者信箱 ',
    sourceMiddle: ' 或作者的 ',
    sourceSuffix: '。',
    fbLabel: 'Facebook',
    thanksPrefix: '特別鳴謝 ',
    thanksName: 'Gu Dia',
    thanksHonorific: ' 桑',
    thanksSuffix: ' 提供大量幫助~',
    dismiss: '開始使用',
  },
  en: {
    eyebrow: 'VERSION UPDATE',
    title: 'New Version Is Live',
    subtitle: 'This update focuses on the dungeon material tree. It is now easier to see what each dungeon material can craft and follow recommended routes.',
    highlights: [
      {
        title: 'Dungeon Material Tree',
        text: 'Dungeon material craftable gear and recommended paths have been organized. Lines from the same recipe share one color, and key materials stand out more clearly.',
      },
      {
        title: 'Improved Calculator Experience',
        text: 'The calculator flow has been refined, making recipe search and review smoother.',
      },
      {
        title: 'Pilot Plugin Is Live',
        text: 'Adds auto online treasure chest and auto alchemy features, with tutorial and download access.',
        action: 'Open Pilot',
      },
    ],
    sourcePrefix: 'Recipe data is compiled from internet sources and earlier player experience. It may contain omissions or version differences. If you find an issue, please contact ',
    sourceMiddle: ' or the author on ',
    sourceSuffix: '.',
    fbLabel: 'Facebook',
    thanksPrefix: 'Special thanks to ',
    thanksName: 'Gu Dia',
    thanksHonorific: '',
    thanksSuffix: ' for extensive help.',
    dismiss: 'Start',
  },
};

export default function VersionUpdateDialog({ version, locale, onOpenPilot }) {
  const text = COPY[locale] ?? COPY['zh-Hans'];
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      setOpen(localStorage.getItem(STORAGE_KEY) !== version);
    } catch {
      setOpen(true);
    }
  }, [version]);

  function dismiss() {
    markVersionAsSeen(version);
    setOpen(false);
  }

  function openPilot() {
    markVersionAsSeen(version);
    setOpen(false);
    onOpenPilot?.();
  }

  if (!open) return null;

  return (
    <div className="versionDialogOverlay" role="presentation">
      <section className="versionDialog" role="dialog" aria-modal="true" aria-labelledby="version-dialog-title">
        <div className="versionDialogAura" aria-hidden="true" />
        <div className="versionDialogHead">
          <span>{text.eyebrow}</span>
          <strong>{version}</strong>
        </div>
        <h2 id="version-dialog-title">{text.title}</h2>
        <p>{text.subtitle}</p>
        <div className="versionDialogHighlights">
          {text.highlights.map((item) => (
            <article key={item.title} className="versionDialogItem">
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                {item.action ? (
                  <button type="button" className="versionDialogInlineAction" onClick={openPilot}>
                    {item.action}
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
        <div className="versionDialogNotice">
          <p>
            {text.sourcePrefix}
            <a href="mailto:vengwang@gmail.com">vengwang@gmail.com</a>
            {text.sourceMiddle}
            <a href="https://www.facebook.com/ihon.ou.1/" target="_blank" rel="noreferrer">{text.fbLabel}</a>
            {text.sourceSuffix}
          </p>
          <p>
            {text.thanksPrefix}
            <a href="https://www.facebook.com/profile.php?id=61567112734121" target="_blank" rel="noreferrer">{text.thanksName}</a>
            {text.thanksHonorific}
            {text.thanksSuffix}
          </p>
        </div>
        <div className="versionDialogFoot">
          <button type="button" onClick={dismiss}>{text.dismiss}</button>
        </div>
      </section>
    </div>
  );
}
