export const LOCALES = [
  { key: 'zh-Hans', label: '简体' },
  { key: 'zh-Hant', label: '繁體' },
  { key: 'en', label: 'EN' },
];

export const GEAR_TABS = [
  {
    key: 'inventory',
    label: { 'zh-Hans': '全部装备', 'zh-Hant': '全部裝備', en: 'All Gear' },
  },
  {
    key: 'common',
    label: { 'zh-Hans': '常用装备', 'zh-Hant': '常用裝備', en: 'Common Gear' },
  },
  {
    key: 'favorites',
    label: { 'zh-Hans': '我的收藏', 'zh-Hant': '我的收藏', en: 'Favorites' },
  },
];

export const PAGE_TABS = [
  {
    key: 'sheet',
    label: { 'zh-Hans': '试算表', 'zh-Hant': '試算表', en: 'Calculator' },
  },
  {
    key: 'dungeonTree',
    label: { 'zh-Hans': '副本材料合成树', 'zh-Hant': '副本材料合成樹', en: 'Dungeon Material Tree' },
  },
  {
    key: 'guides',
    label: { 'zh-Hans': '资料鸣谢', 'zh-Hant': '資料鳴謝', en: 'Credits' },
  },
];

export const COMMON_CATEGORIES = [
  {
    key: 'ATK',
    items: ['gudia_1da7c8c985', 'gudia_f3acdbeeaa', 'gudia_bfb766cd13', 'gudia_acd8e0a607', 'gudia_57ab719408', 'gudia_79ee2fca6b'],
  },
  { key: 'CON', items: [] },
  { key: 'MATK', items: ['black_bishop_robe', 'gudia_b2ea578080', 'gudia_95b634156d', 'gudia_f583f226fc', 'gudia_cc0f8f730e'] },
  { key: 'WIS', items: [] },
  {
    key: 'SPD',
    items: ['gudia_b91b18ee78', 'gudia_370c597283', 'gudia_42f2a7107b', 'gudia_8f82e6b47e', 'gudia_c8f81c5b16', 'gudia_989941bc54'],
  },
];

export const GUIDE_LINKS = [
  {
    id: 'black-bishop-robe-gg',
    title: {
      'zh-Hans': '黑主教袍合成公式',
      'zh-Hant': '黑主教袍合成公式',
      en: 'Black Bishop Robe Formula',
    },
    provider: 'GG',
    note: {
      'zh-Hans': '本条目配方资料由 GG 提供，感谢整理与分享。',
      'zh-Hant': '本條目配方資料由 GG 提供，感謝整理與分享。',
      en: 'Formula data for this entry was provided by GG.',
    },
    href: 'https://forum.gamer.com.tw/C.php?bsn=31536&snA=1306',
  },
  {
    id: 'gu-dia-source',
    title: {
      'zh-Hans': 'Gu Dia 资料来源',
      'zh-Hant': 'Gu Dia 資料來源',
      en: 'Gu Dia Source',
    },
    provider: 'Gu Dia',
    note: {
      'zh-Hans': '部分装备资料来源于 Gu Dia。',
      'zh-Hant': '部分裝備資料來源於 Gu Dia。',
      en: 'Some item data comes from Gu Dia.',
    },
    href: 'https://www.facebook.com/groups/1759640994357521/user/61567112734121',
  },
];
