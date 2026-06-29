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
    subtitle: '本次更新聚焦配方核对与材料规划，反馈更方便，备料更清晰。',
    highlights: [
      {
        title: '新增欧皇清单按钮',
        text: '统计一次不爆时所需的基础材料清单。',
      },
      {
        title: '新增纠错功能',
        text: '高效反馈公式错误，帮助持续修正配方资料。',
      },
    ],
    sourcePrefix:
      '配方资料来自互联网与前人经验整理，可能存在遗漏或版本差异。如发现问题，欢迎联系作者邮箱 ',
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
    subtitle: '本次更新聚焦配方核對與材料規劃，回饋更方便，備料更清楚。',
    highlights: [
      {
        title: '新增歐皇清單按鈕',
        text: '統計一次不爆時所需的基礎材料清單。',
      },
      {
        title: '新增糾錯功能',
        text: '高效回饋公式錯誤，幫助持續修正配方資料。',
      },
    ],
    sourcePrefix:
      '配方資料來自網際網路與前人經驗整理，可能存在遺漏或版本差異。如發現問題，歡迎聯絡作者信箱 ',
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
    subtitle: 'This update focuses on recipe review and material planning: clearer prep, faster feedback.',
    highlights: [
      {
        title: 'Lucky List Button Added',
        text: 'Totals the base materials needed when no synthesis step breaks.',
      },
      {
        title: 'Correction Feedback Added',
        text: 'Report formula errors quickly and help keep recipe data accurate.',
      },
    ],
    sourcePrefix:
      'Recipe data is compiled from internet sources and earlier player experience. It may contain omissions or version differences. If you find an issue, please contact ',
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

export default function VersionUpdateDialog({ version, locale, openRequest = 0 }) {
  const text = COPY[locale] ?? COPY['zh-Hans'];
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      setOpen(localStorage.getItem(STORAGE_KEY) !== version);
    } catch {
      setOpen(true);
    }
  }, [version]);

  useEffect(() => {
    if (openRequest > 0) {
      setOpen(true);
    }
  }, [openRequest]);

  function dismiss() {
    markVersionAsSeen(version);
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="versionDialogOverlay" role="presentation">
      <section
        className="versionDialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="version-dialog-title"
      >
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
              </div>
            </article>
          ))}
        </div>

        <div className="versionDialogNotice">
          <p>
            {text.sourcePrefix}
            <a href="mailto:vengwang@gmail.com">vengwang@gmail.com</a>
            {text.sourceMiddle}
            <a
              href="https://www.facebook.com/ihon.ou.1/"
              target="_blank"
              rel="noreferrer"
            >
              {text.fbLabel}
            </a>
            {text.sourceSuffix}
          </p>

          <p>
            {text.thanksPrefix}
            <a
              href="https://www.facebook.com/profile.php?id=61567112734121"
              target="_blank"
              rel="noreferrer"
            >
              {text.thanksName}
            </a>
            {text.thanksHonorific}
            {text.thanksSuffix}
          </p>
        </div>

        <div className="versionDialogFoot">
          <button type="button" onClick={dismiss}>
            {text.dismiss}
          </button>
        </div>
      </section>
    </div>
  );
}