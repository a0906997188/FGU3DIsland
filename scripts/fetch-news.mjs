// 抓取學院官網最新消息，寫入 src/data/news.json。
// 失敗（網路錯誤、HTTP 錯誤、解析不到任何項目）時「不覆寫」舊檔，只更新 lastAttempt 紀錄並以非零狀態結束，
// 讓網站繼續顯示最近一次成功的資料與時間。
//
// 用法：node scripts/fetch-news.mjs            （正常抓取）
//       NEWS_URL=https://example.invalid node scripts/fetch-news.mjs   （展示用：故意讓抓取失敗）

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { parseNewsList } from './parse-news.mjs';

const NEWS_URL = process.env.NEWS_URL || 'https://tech.fgu.edu.tw/zh_tw/News';
const PAGES = Number(process.env.NEWS_PAGES || 2);
const OUT = fileURLToPath(new URL('../src/data/news.json', import.meta.url));

async function readExisting() {
  try {
    return JSON.parse(await readFile(OUT, 'utf8'));
  } catch {
    return null;
  }
}

async function fetchPage(page) {
  const url = page === 1 ? NEWS_URL : `${NEWS_URL}?page_no=${page}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'fgu-archipelago-news-bot/1.0 (course project)' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.text();
}

async function main() {
  const now = new Date().toISOString();
  const existing = await readExisting();
  try {
    const seen = new Set();
    const items = [];
    for (let p = 1; p <= PAGES; p++) {
      for (const item of parseNewsList(await fetchPage(p))) {
        if (seen.has(item.url)) continue;
        seen.add(item.url);
        items.push(item);
      }
    }
    if (items.length === 0) throw new Error('解析不到任何消息（官網版面可能改版）');
    items.sort((a, b) => b.date.localeCompare(a.date));
    const data = {
      source: NEWS_URL,
      fetchedAt: now,
      lastAttempt: { at: now, ok: true },
      items,
    };
    await writeFile(OUT, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log(`✅ 取得 ${items.length} 則消息，已寫入 ${OUT}`);
  } catch (err) {
    console.error(`❌ 抓取失敗：${err.message}`);
    if (existing) {
      existing.lastAttempt = { at: now, ok: false, error: String(err.message).slice(0, 200) };
      await writeFile(OUT, JSON.stringify(existing, null, 2) + '\n', 'utf8');
      console.error(`保留最近一次成功的資料（${existing.fetchedAt}）`);
    }
    process.exitCode = 1;
  }
}

main();
