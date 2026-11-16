import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseOfficialDate, parseNewsList } from '../scripts/parse-news.mjs';

test('解析官網「2026-10/28」日期格式', () => {
  assert.equal(parseOfficialDate(' 2026-10/28'), '2026-10-28');
  assert.equal(parseOfficialDate('2026-9/2'), '2026-09-02');
  assert.equal(parseOfficialDate('2026-10-28'), '2026-10-28');
});

test('無效日期回傳 null', () => {
  assert.equal(parseOfficialDate('2026-13/01'), null);
  assert.equal(parseOfficialDate('下週一'), null);
});

test('從列表 HTML 取出日期、標題、絕對網址', () => {
  const html = `
  <ul class="i-annc__list">
    <li class="i-annc__item  row">
      <span class="i-annc__postdate"> 2026-10/28</span>
      <a class="i-annc__title" href="/zh_tw/News/abc-123" title="跨界凝聚，卓越同行！"><span>跨界凝聚，卓越同行！</span></a>
    </li>
    <li class="i-annc__item  row">
      <span class="i-annc__postdate"> 2026-10/02</span>
      <a class="i-annc__title" href="https://website.fgu.edu.tw/zh_tw/x"><span>TVBS&nbsp;專家 &amp; 簡報術</span></a>
    </li>
    <li class="i-annc__item  row"><span>壞掉的項目</span></li>
  </ul>`;
  assert.deepEqual(parseNewsList(html), [
    { date: '2026-10-28', title: '跨界凝聚，卓越同行！', url: 'https://tech.fgu.edu.tw/zh_tw/News/abc-123' },
    { date: '2026-10-02', title: 'TVBS 專家 & 簡報術', url: 'https://website.fgu.edu.tw/zh_tw/x' },
  ]);
});

test('格式改版、抓不到項目時回傳空陣列（交給呼叫端決定是否保留舊資料）', () => {
  assert.deepEqual(parseNewsList('<html><body>維護中</body></html>'), []);
});
