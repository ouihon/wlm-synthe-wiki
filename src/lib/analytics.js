const MAX_SEARCH_TERM_LENGTH = 60;

function hasGtag() {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
}

export function trackEvent(eventName, params = {}) {
  if (!hasGtag()) return;

  window.gtag('event', eventName, params);
}

export function itemAnalyticsParams(itemId, item, locale = 'zh-Hans') {
  const name = item?.name ?? {};
  const type = item?.type ?? {};

  return {
    item_id: itemId,
    item_name: name[locale] || name['zh-Hans'] || name.en || itemId,
    item_name_zh: name['zh-Hans'] || name[locale] || name.en || itemId,
    item_type: type[locale] || type['zh-Hans'] || type.en || '',
    item_level: item?.level ?? null,
  };
}

export function cleanSearchTerm(term) {
  const normalized = String(term ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, MAX_SEARCH_TERM_LENGTH);

  if (!normalized) {
    return { searchTerm: '', redacted: false };
  }

  const looksLikeEmail = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(normalized);
  const looksLikeUrl = /(?:https?:\/\/|www\.)\S+/i.test(normalized);
  const digitsOnly = normalized.replace(/\D/g, '');
  const looksLikePhoneOrId = digitsOnly.length >= 8;

  if (looksLikeEmail || looksLikeUrl || looksLikePhoneOrId) {
    return { searchTerm: '[redacted]', redacted: true };
  }

  return { searchTerm: normalized, redacted: false };
}
