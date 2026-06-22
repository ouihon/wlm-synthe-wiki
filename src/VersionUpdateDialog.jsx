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
    subtitle: '这次更新带来了飘流皮皮（Pilot），新增装备收藏功能，并优化了副本材料合成树体验。现在可以按合成路径需要的步数筛选路线，查找会更清楚。',
    highlights: [
      {
        title: '飘流皮皮（Pilot）正式发布',
        text: '新增自动在线宝箱与自动炼金功能，可观看教学并下载插件。',
        action: '前去查看',
      },
      {
        title: '新增装备收藏功能',
        text: '全部装备和装备详情都可以收藏或取消收藏，收藏后的装备会集中显示在“我的收藏”。',
      },
      {
        title: '优化副本材料合成树体验',
        text: '现在可以筛选合成路径需要的步数，更方便查看材料到目标装备之间的推荐合成路线。',
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
    subtitle: '這次更新帶來了飄流皮皮（Pilot），新增裝備收藏功能，並優化了副本材料合成樹體驗。現在可以按合成路徑需要的步數篩選路線，查找會更清楚。',
    highlights: [
      {
        title: '飄流皮皮（Pilot）正式發布',
        text: '新增自動線上寶箱與自動煉金功能，可觀看教學並下載插件。',
        action: '前去查看',
      },
      {
        title: '新增裝備收藏功能',
        text: '全部裝備和裝備詳情都可以收藏或取消收藏，收藏後的裝備會集中顯示在「我的收藏」。',
      },
      {
        title: '優化副本材料合成樹體驗',
        text: '現在可以篩選合成路徑需要的步數，更方便查看材料到目標裝備之間的推薦合成路線。',
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
    subtitle: 'This update introduces the Pilot plugin, adds gear favorites, and improves the dungeon material tree experience. You can now filter crafting routes by the number of required steps.',
    highlights: [
      {
        title: 'Pilot Plugin Is Live',
        text: 'Adds auto online treasure chest and auto alchemy features, with tutorial and download access.',
        action: 'Open Pilot',
      },
      {
        title: 'Gear Favorites Added',
        text: 'You can favorite or unfavorite gear from All Gear and item details, then review everything under Favorites.',
      },
      {
        title: 'Improved Dungeon Material Tree',
        text: 'You can now filter crafting routes by required step count, making recommended paths from materials to target gear easier to follow.',
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
