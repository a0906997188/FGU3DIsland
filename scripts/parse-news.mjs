// 解析學院官網「最新消息」列表頁的 HTML（伺服器端輸出，無 RSS）。
// 列表項目格式：<span class="i-annc__postdate"> 2026-10/28</span> ... <a class="i-annc__title" href="..." title="標題">

export const SOURCE_ORIGIN = 'https://tech.fgu.edu.tw';

/** 把官網的「2026-10/28」或「2026-10-28」轉成 ISO 日期「2026-10-28」；無法辨識時回傳 null。 */
export function parseOfficialDate(text) {
  const m = String(text).trim().match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (!m) return null;
  const [, y, mo, d] = m;
  const month = Number(mo);
  const day = Number(d);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function decodeEntities(s) {
  return s
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

function cleanTitle(s) {
  return decodeEntities(s.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
}

/** 從列表頁 HTML 取出 { date, title, url } 陣列。 */
export function parseNewsList(html) {
  const items = [];
  const blocks = String(html).split(/<li class="i-annc__item/).slice(1);
  for (const block of blocks) {
    const dateMatch = block.match(/class="i-annc__postdate">([^<]+)</);
    const linkMatch = block.match(/<a class="i-annc__title" href="([^"]+)"(?: title="([^"]*)")?[^>]*>([\s\S]*?)<\/a>/);
    if (!dateMatch || !linkMatch) continue;
    const date = parseOfficialDate(dateMatch[1]);
    const title = cleanTitle(linkMatch[2] || linkMatch[3]);
    if (!date || !title) continue;
    const url = new URL(decodeEntities(linkMatch[1]), SOURCE_ORIGIN).href;
    items.push({ date, title, url });
  }
  return items;
}
