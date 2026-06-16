const TYPE_ORDER = [
  '钢', '铁', '铜', '钛', '赤铁', '铅', '锡', '金', '银', '白银', '铝', '兽骨', '岩石', '皮', '花', '草',
  '叶', '兽毛', '羽毛', '木', '魔玉', '水晶', '结晶', '钻石', '宝', '玉', '尼龙', '壳', '硅', '果', '肉', '泌',
];

function makeTypeTheme(text, border, start, end, shadow = 'rgba(22, 32, 49, 0.10)') {
  return { text, border, start, end, shadow };
}

const TYPE_THEME_MAP = {
  钢: makeTypeTheme('#1f2a3b', '#8a97a8', '#e8edf3', '#c9d2de'),
  铁: makeTypeTheme('#3a4049', '#a7afb8', '#edf0f3', '#cbd2d9'),
  铜: makeTypeTheme('#7b4a1f', '#dfb08a', '#fff0e4', '#f0d4bf'),
  钛: makeTypeTheme('#36506e', '#b6c7db', '#edf4fb', '#d5e2ef'),
  赤铁: makeTypeTheme('#7a3028', '#db9d93', '#fff0ef', '#f1d0cb'),
  铅: makeTypeTheme('#4a5563', '#b3bcc8', '#eef2f7', '#d5dde6'),
  锡: makeTypeTheme('#627082', '#c7d0db', '#f4f7fb', '#dbe3ec'),
  金: makeTypeTheme('#8b5b00', '#f0c566', '#fff6d8', '#f3deaa'),
  银: makeTypeTheme('#5d6773', '#d4d8de', '#f7f9fc', '#e1e7ee'),
  白银: makeTypeTheme('#74808d', '#eef2f5', '#fbfcfe', '#e3e8ee'),
  铝: makeTypeTheme('#58768e', '#d2e4f1', '#f4fbff', '#deebf6'),
  兽骨: makeTypeTheme('#7b735f', '#e0d7c1', '#fbf8f0', '#e8dec8'),
  岩石: makeTypeTheme('#5e646d', '#c8cfd8', '#f3f5f8', '#d8e0e8'),
  皮: makeTypeTheme('#8e6449', '#e4b48e', '#fff4ec', '#efd2bd'),
  花: makeTypeTheme('#b12b4f', '#f0a0b7', '#fff1f5', '#f3d4df'),
  草: makeTypeTheme('#2f7b35', '#9fd19f', '#edf9ee', '#d1ecd2'),
  叶: makeTypeTheme('#5b8a2a', '#c1e08f', '#f3fbeb', '#ddebbe'),
  兽毛: makeTypeTheme('#8a5d3b', '#e0b08c', '#fff4eb', '#efd6c5'),
  羽毛: makeTypeTheme('#4d7ca8', '#c5dcf1', '#f2f9ff', '#d8e8f4'),
  木: makeTypeTheme('#6e4f31', '#d8b28f', '#fbf4ec', '#e9d5c3'),
  魔玉: makeTypeTheme('#6a1fa2', '#d9b2ff', '#f8f1ff', '#e5d3f7'),
  水晶: makeTypeTheme('#008a9f', '#9fe5ef', '#eefcff', '#cbeef2'),
  结晶: makeTypeTheme('#0f8f7e', '#8fe1d7', '#effdfb', '#cbeee7'),
  钻石: makeTypeTheme('#1e78d1', '#b7dcff', '#eff8ff', '#d6e8f8'),
  宝: makeTypeTheme('#6d3bb8', '#d0b4ff', '#f8f2ff', '#e4d6f6'),
  玉: makeTypeTheme('#0c8d63', '#a8e2c7', '#effbf5', '#d0ecdf'),
  尼龙: makeTypeTheme('#2d6c9a', '#a9d2ef', '#eff8ff', '#d1e5f3'),
  壳: makeTypeTheme('#b06b82', '#f0bfd0', '#fff4f8', '#edd5de'),
  硅: makeTypeTheme('#4e7f8a', '#b8e0e6', '#f0fbfc', '#d7eaee'),
  果: makeTypeTheme('#d26f1f', '#ffd1a0', '#fff6ec', '#f6ddc3'),
  肉: makeTypeTheme('#c15f67', '#f0b7ba', '#fff3f4', '#f0d2d3'),
  泌: makeTypeTheme('#7c9a34', '#d5ea9d', '#f5fce8', '#dfecc2'),
  __default: makeTypeTheme('#455164', '#ced7e2', '#f6f9fc', '#dbe3ed'),
};

export function pick(value, locale) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value[locale] ?? value['zh-Hans'] ?? Object.values(value)[0] ?? '';
  }
  return value ?? '';
}

export function cx(...names) {
  return names.filter(Boolean).join(' ');
}

export function getTypeTheme(typeLabel) {
  return TYPE_THEME_MAP[typeLabel] ?? TYPE_THEME_MAP.__default;
}

export function getTypeFilterStyle(type) {
  const theme = getTypeTheme(type);
  return {
    '--tag-text': theme.text,
    '--tag-border': theme.border,
    '--tag-bg-start': theme.start,
    '--tag-bg-end': theme.end,
    '--tag-shadow': theme.shadow,
  };
}

export function getHandbookMissingWarning(item) {
  const strings = [];
  if (!item) return false;
  if (typeof item.note === 'string') strings.push(item.note);
  if (typeof item.note === 'object' && item.note) {
    strings.push(...Object.values(item.note).filter((value) => typeof value === 'string'));
  }
  if (Array.isArray(item.notes)) {
    for (const note of item.notes) {
      if (typeof note === 'string') strings.push(note);
      else if (note && typeof note === 'object') {
        strings.push(...Object.values(note).filter((value) => typeof value === 'string'));
      }
    }
  }
  if (Array.isArray(item.flags) && item.flags.includes('missing_in_handbook')) return true;
  return strings.some((text) => text.includes('手飘无此装') || text.includes('手飄無此裝'));
}

export function getCanonicalType(value) {
  return pick(value, 'zh-Hans').trim();
}

export function getTypeOptions(items) {
  const existing = new Set();
  for (const item of Object.values(items)) {
    const type = getCanonicalType(item.type);
    if (type && type !== '未知') existing.add(type);
  }
  const ordered = TYPE_ORDER.filter((type) => existing.has(type));
  const extras = [...existing].filter((type) => !TYPE_ORDER.includes(type)).sort((a, b) => a.localeCompare(b, 'zh-Hans'));
  return [...ordered, ...extras];
}

export function entryBool(value) {
  return value === true;
}
