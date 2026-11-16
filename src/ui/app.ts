// 介面：島嶼清單、島嶼面板（島長選單式對話、島民、地標、任務）、消息清單、導覽。
// 3D 只是其中一種入口；所有資訊都能只靠這裡的清單讀到，3D 失敗時仍可使用。
import type { Island, IslandData, Link, NewsData, NewsItem } from '../types';
import { progress } from '../state/progress';

export interface AppHooks {
  /** 進島時讓 3D 鏡頭飛過去；沒有 3D 時為 null */
  focusIsland: ((id: string) => void) | null;
  overview: (() => void) | null;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const linkHtml = (l: Link) => `<a class="src-link" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}<span aria-hidden="true"> ↗</span></a>`;
const demoTag = (on?: boolean) => (on ? `<span class="demo-tag" title="這是課堂作業的示範內容，不是官方資訊">課堂示範</span>` : '');

function fmtTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
}

export function createApp(root: HTMLElement, data: IslandData, news: NewsData, hooks: AppHooks) {
  const islands = data.islands;
  const byId = new Map(islands.map((i) => [i.id, i]));
  const total = islands.length;
  let current: string | null = null;

  root.innerHTML = `
    <header class="topbar">
      <div class="brand">
        <span class="brand-logo" aria-hidden="true">⬡</span>
        <div>
          <h1>佛光科技設計學習群島</h1>
          <p class="brand-sub">課堂專題・非官方網站・資料以<a href="${esc(data.college.url)}" target="_blank" rel="noopener">學院官網</a>為準</p>
        </div>
      </div>
      <nav class="top-actions" aria-label="主要功能">
        <button type="button" data-act="list" class="btn">🗺️ <span>島嶼清單</span></button>
        <button type="button" data-act="news" class="btn">📰 <span>消息</span></button>
        <button type="button" data-act="quests" class="btn btn-progress" aria-live="polite">⭐ <span class="progress-text"></span></button>
        <button type="button" data-act="help" class="btn btn-icon" aria-label="導覽說明">?</button>
      </nav>
    </header>

    <aside class="drawer" id="drawer" aria-label="島嶼清單" hidden>
      <div class="drawer-head">
        <h2>島嶼清單</h2>
        <button type="button" class="btn btn-icon close-drawer" aria-label="關閉清單">✕</button>
      </div>
      <p class="drawer-note">點任一座島直接前往。共 ${total} 個學組，資料查證於 ${esc(data.college.verifiedAt)}。</p>
      <ul class="island-list"></ul>
      <div class="drawer-foot">
        <button type="button" class="btn btn-ghost" data-act="toggle-mode"></button>
        <button type="button" class="btn btn-ghost" data-act="reset">重設任務進度</button>
      </div>
    </aside>

    <section class="panel" id="panel" aria-live="polite" hidden></section>

    <div class="toast" role="status" aria-live="polite" hidden></div>
    <div class="tour" hidden></div>
  `;

  const $ = <T extends HTMLElement>(sel: string) => root.querySelector(sel) as T;
  const drawer = $('#drawer');
  const panel = $('#panel');
  const toastEl = $('.toast');
  const progressText = $('.progress-text');
  const listEl = $('.island-list');
  const modeBtn = $('[data-act="toggle-mode"]');

  // ---------- 共用 ----------
  let toastTimer = 0;
  const toast = (msg: string) => {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => (toastEl.hidden = true), 3200);
  };

  const renderProgress = () => {
    progressText.textContent = `任務 ${progress.doneCount()}/${total}`;
    listEl.innerHTML = [data.hub, ...islands]
      .map((i) => {
        const island = byId.get(i.id);
        const done = island ? progress.isDone(island.quest.id) : false;
        return `<li><button type="button" class="island-item ${current === i.id ? 'is-active' : ''}" data-go="${esc(i.id)}">
          <span class="dot" style="background:${esc(island ? island.palette.grass : data.hub.color)}"></span>
          <span class="island-item-text"><strong>${esc(i.name)}</strong><small>${esc(i.subtitle)}</small></span>
          <span class="island-item-state">${island ? (done ? '✅' : '☆') : '🛰️'}</span>
        </button></li>`;
      })
      .join('');
  };
  progress.subscribe(renderProgress);

  const is3D = () => !document.body.classList.contains('no-3d');
  const updateModeBtn = () => {
    modeBtn.textContent = is3D() ? '切換成純清單模式' : hooks.focusIsland ? '回到 3D 群島' : '3D 無法載入，使用清單模式';
    (modeBtn as HTMLButtonElement).disabled = !hooks.focusIsland;
  };

  const openDrawer = (open: boolean) => {
    drawer.hidden = !open;
    if (open) (drawer.querySelector('.island-item') as HTMLElement | null)?.focus({ preventScroll: true });
  };

  const closePanel = () => {
    panel.hidden = true;
    panel.innerHTML = '';
    current = null;
    hooks.overview?.();
    renderProgress();
    if (!is3D()) window.scrollTo({ top: 0 });
  };

  const panelShell = (title: string, sub: string, body: string, color = '#bcd4ff') => {
    panel.innerHTML = `
      <div class="panel-grip" aria-hidden="true"></div>
      <div class="panel-head" style="--island:${esc(color)}">
        <button type="button" class="btn btn-back" data-act="back">← 返回群島</button>
        <h2>${title}</h2>
        <p class="panel-sub">${sub}</p>
      </div>
      <div class="panel-body">${body}</div>`;
    panel.hidden = false;
    panel.scrollTop = 0;
    const back = panel.querySelector('[data-act="back"]') as HTMLElement;
    if (!is3D()) {
      back.textContent = '← 返回清單';
      panel.scrollIntoView({ block: 'start' });
    }
    back.focus({ preventScroll: true });
  };

  const relatedNews = (island: Island) =>
    news.items.filter((n) => island.newsKeywords.some((k) => n.title.includes(k))).slice(0, 3);

  const newsRow = (n: NewsItem) =>
    `<li class="news-item"><time datetime="${esc(n.date)}">${esc(n.date)}</time><a href="${esc(n.url)}" target="_blank" rel="noopener">${esc(n.title)}</a></li>`;

  // ---------- 島嶼面板 ----------
  const openIsland = (id: string) => {
    if (id === data.hub.id) return openHub();
    const island = byId.get(id);
    if (!island) return;
    current = id;
    if (progress.visit(id) && progress.doneCount() === 0) toast(`登陸「${island.name}」！先問問島長吧。`);
    hooks.focusIsland?.(id);
    const rel = relatedNews(island);
    const body = `
      <p class="summary">${esc(island.summary)}</p>
      <p class="source-line">${linkHtml({ label: '官網學組介紹', url: island.sourceUrl })} ${linkHtml({ label: '學組網站', url: island.siteUrl })}<span class="verified">查證：${esc(island.verifiedAt)}</span></p>

      <article class="card chief-card">
        <header class="card-head"><span class="avatar" aria-hidden="true">🧑‍🚀</span>
          <div><h3>${esc(island.chief.name)} ${demoTag(island.chief.demo)}</h3><p class="muted">島長（原創角色）</p></div>
        </header>
        <p class="bubble">${esc(island.chief.greeting)}</p>
        <div class="menu" role="group" aria-label="問島長">
          ${island.chief.answers.map((a, i) => `<button type="button" class="chip" data-ask="${i}">${esc(a.q)}</button>`).join('')}
          <button type="button" class="chip chip-quest" data-act="quest">⭐ 迷你任務</button>
        </div>
        <div class="answer" aria-live="polite"></div>
      </article>

      <article class="card resident-card">
        <header class="card-head"><span class="avatar" aria-hidden="true">✨</span>
          <div><h3>${esc(island.resident.name)} ${demoTag(island.resident.demo)}</h3><p class="muted">島民・${esc(island.resident.species)} 太空精靈</p></div>
        </header>
        <div class="resident-line"><button type="button" class="chip" data-act="talk">和${esc(island.resident.name)}聊聊</button></div>
      </article>

      <article class="card">
        <h3>🏛️ 地標：${esc(island.landmark.name)}</h3>
        <p>${esc(island.landmark.description)}</p>
      </article>

      ${rel.length ? `<article class="card"><h3>📰 相關消息</h3><ul class="news-list compact">${rel.map(newsRow).join('')}</ul></article>` : ''}
    `;
    panelShell(esc(island.name), esc(island.subtitle), body, island.palette.grass);
    renderProgress();

    const answerEl = panel.querySelector('.answer') as HTMLElement;
    panel.querySelectorAll<HTMLButtonElement>('[data-ask]').forEach((btn) =>
      btn.addEventListener('click', () => {
        const a = island.chief.answers[Number(btn.dataset.ask)];
        panel.querySelectorAll('.chip').forEach((c) => c.classList.toggle('is-on', c === btn));
        answerEl.innerHTML = `<p class="bubble bubble-answer"><strong>${esc(a.q)}</strong><br>${esc(a.a)}</p><p class="links">${a.links.map(linkHtml).join(' ')}</p>`;
      }),
    );
    panel.querySelector('[data-act="quest"]')!.addEventListener('click', (e) => {
      panel.querySelectorAll('.chip').forEach((c) => c.classList.toggle('is-on', c === e.currentTarget));
      renderQuest(island, answerEl);
    });
    panel.querySelector('[data-act="talk"]')!.addEventListener('click', () => talkResident(island));
  };

  const talkResident = (island: Island) => {
    const line = panel.querySelector('.resident-line') as HTMLElement | null;
    if (!line) return;
    const clue = island.resident.givesClue;
    let extra = '';
    if (clue) {
      const isNew = progress.addClue(clue.id);
      extra = `<p class="clue">🔑 ${esc(clue.label)}${isNew ? '（已收進背包）' : '（已經拿過了）'}</p>`;
      if (isNew) toast(`取得${clue.label}！`);
    }
    line.innerHTML = `<p class="bubble">${esc(island.resident.line)}</p>${extra}`;
  };

  const renderQuest = (island: Island, host: HTMLElement) => {
    const q = island.quest;
    const head = `<h4>⭐ ${esc(q.title)} ${demoTag(q.demo)}</h4>`;
    const explain = () =>
      `<div class="explain"><p>${esc(q.explain)}</p><p class="links">${q.sources.map(linkHtml).join(' ')}</p></div>`;

    if (progress.isDone(q.id)) {
      host.innerHTML = `<div class="quest is-done">${head}<p>✅ 已完成！</p>${explain()}</div>`;
      return;
    }
    if (q.requiresClue && !progress.hasClue(q.requiresClue)) {
      const holder = islands.find((i) => i.resident.givesClue?.id === q.requiresClue);
      host.innerHTML = `<div class="quest is-locked">${head}<p>🔒 ${esc(q.lockedHint ?? '需要其他島的線索。')}</p>
        ${holder ? `<button type="button" class="btn btn-primary" data-go="${esc(holder.id)}">前往${esc(holder.name)} →</button>` : ''}</div>`;
      return;
    }
    host.innerHTML = `<div class="quest">${head}
      ${q.requiresClue ? `<p class="clue">🔑 你帶著從別座島拿到的線索。</p>` : ''}
      <p class="q">${esc(q.question)}</p>
      <div class="options">${q.options.map((o, i) => `<button type="button" class="option" data-opt="${i}">${esc(o)}</button>`).join('')}</div>
      <div class="feedback" aria-live="polite"></div></div>`;
    host.querySelectorAll<HTMLButtonElement>('[data-opt]').forEach((btn) =>
      btn.addEventListener('click', () => {
        const fb = host.querySelector('.feedback') as HTMLElement;
        if (Number(btn.dataset.opt) === q.answer) {
          btn.classList.add('is-right');
          progress.complete(q.id);
          fb.innerHTML = `<p class="right">🎉 答對了！任務完成。</p>${explain()}`;
          host.querySelectorAll<HTMLButtonElement>('[data-opt]').forEach((b) => (b.disabled = true));
          toast(progress.doneCount() === total ? '🌟 全部任務完成！你已經認識整個學院了。' : `任務完成！目前 ${progress.doneCount()}/${total}`);
        } else {
          btn.classList.add('is-wrong');
          btn.disabled = true;
          fb.innerHTML = `<p class="wrong">再想想看，可以先問島長「這裡學什麼？」或「有哪些課程或活動？」</p>`;
        }
      }),
    );
  };

  // ---------- 中央星港 ----------
  const openHub = () => {
    current = data.hub.id;
    hooks.focusIsland?.(data.hub.id);
    const body = `
      <p class="summary">${esc(data.hub.intro)}</p>
      <article class="card"><h3>🧭 五個學組</h3>
        <ul class="hub-list">${islands.map((i) => `<li><button type="button" class="island-item" data-go="${esc(i.id)}"><span class="dot" style="background:${esc(i.palette.grass)}"></span><span class="island-item-text"><strong>${esc(i.name)}</strong><small>${esc(i.summary)}</small></span></button></li>`).join('')}</ul>
        <p class="links">${linkHtml({ label: '學組介紹列表（學院官網）', url: data.college.deptListUrl })} ${linkHtml({ label: '全校學程手冊', url: data.college.handbookUrl })}</p>
      </article>
      <article class="card"><h3>📰 最新消息</h3><ul class="news-list compact">${news.items.slice(0, 3).map(newsRow).join('')}</ul>
        <button type="button" class="btn btn-primary" data-act="news">查看與搜尋全部消息</button></article>`;
    panelShell(esc(data.hub.name), esc(data.hub.subtitle), body, data.hub.color);
    renderProgress();
  };

  // ---------- 消息 ----------
  const openNews = () => {
    current = null;
    const failed = news.lastAttempt && !news.lastAttempt.ok;
    const status = `
      <div class="news-status ${failed ? 'is-stale' : ''}">
        <p>🕒 本站更新時間：<strong>${esc(fmtTime(news.fetchedAt))}</strong></p>
        ${failed ? `<p>⚠️ 最近一次抓取官網（${esc(fmtTime(news.lastAttempt!.at))}）失敗，以下顯示最近一次成功更新的資料。</p>` : ''}
        <p>來源：${linkHtml({ label: '學院官網・最新消息', url: news.source })}</p>
      </div>`;
    const body = `${status}
      <label class="search"><span class="sr-only">搜尋消息</span>
        <input type="search" placeholder="搜尋標題，例如：AI、建築、傳播…" autocomplete="off" />
      </label>
      <p class="muted result-count"></p>
      <ul class="news-list"></ul>`;
    panelShell('📰 學院消息', `共 ${news.items.length} 則・公告日期依官網`, body);
    const input = panel.querySelector('input') as HTMLInputElement;
    const list = panel.querySelector('.news-list:not(.compact)') as HTMLElement;
    const count = panel.querySelector('.result-count') as HTMLElement;
    const render = () => {
      const kw = input.value.trim().toLowerCase();
      const items = kw ? news.items.filter((n) => n.title.toLowerCase().includes(kw) || n.date.includes(kw)) : news.items;
      list.innerHTML = items.length ? items.map(newsRow).join('') : `<li class="muted">找不到「${esc(input.value)}」相關的消息。</li>`;
      count.textContent = kw ? `找到 ${items.length} 則` : '';
    };
    input.addEventListener('input', render);
    render();
  };

  const openQuests = () => {
    current = null;
    const body = `<p class="summary">每座島都有一個迷你任務，問完島長就能作答。其中「數位策展任務」要先去另一座島找線索。</p>
      <ul class="hub-list">${islands
        .map((i) => {
          const done = progress.isDone(i.quest.id);
          const locked = i.quest.requiresClue && !progress.hasClue(i.quest.requiresClue);
          return `<li><button type="button" class="island-item" data-go="${esc(i.id)}"><span class="dot" style="background:${esc(i.palette.grass)}"></span>
          <span class="island-item-text"><strong>${esc(i.quest.title)}</strong><small>${esc(i.name)}</small></span>
          <span class="island-item-state">${done ? '✅ 完成' : locked ? '🔒 需線索' : '☆ 未完成'}</span></button></li>`;
        })
        .join('')}</ul>
      <p class="muted">進度存在這台裝置的瀏覽器中，重新整理後仍會保留。</p>`;
    panelShell('⭐ 任務進度', `已完成 ${progress.doneCount()}/${total}`, body);
  };

  // ---------- 導覽 ----------
  const tourEl = $('.tour');
  const steps = [
    { t: '歡迎登島！', d: '這是佛光大學應用科技與設計學院的 3D 群島。拖曳可以旋轉，滾輪或雙指可以縮放。' },
    { t: '點島登陸', d: '點任一座島或島名標籤就能登陸；也可以用上方的「🗺️ 島嶼清單」直接跳過去。' },
    { t: '問島長、出任務', d: '每座島的島長會回答三個問題並附官網連結。完成迷你任務收集 ⭐，進度會自動保存。' },
  ];
  const showTour = (i = 0) => {
    const s = steps[i];
    tourEl.hidden = false;
    tourEl.innerHTML = `<div class="tour-card" role="dialog" aria-modal="false" aria-label="導覽">
      <p class="tour-step">${i + 1} / ${steps.length}</p><h2>${esc(s.t)}</h2><p>${esc(s.d)}</p>
      <div class="tour-actions"><button type="button" class="btn btn-ghost" data-tour="skip">跳過</button>
      <button type="button" class="btn btn-primary" data-tour="next">${i === steps.length - 1 ? '開始探索' : '下一步'}</button></div></div>`;
    tourEl.querySelector('[data-tour="skip"]')!.addEventListener('click', endTour);
    tourEl.querySelector('[data-tour="next"]')!.addEventListener('click', () => (i === steps.length - 1 ? endTour() : showTour(i + 1)));
    (tourEl.querySelector('[data-tour="next"]') as HTMLElement).focus();
  };
  const endTour = () => {
    tourEl.hidden = true;
    progress.finishTour();
  };

  // ---------- 事件 ----------
  root.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const go = target.closest<HTMLElement>('[data-go]');
    if (go) {
      openDrawer(false);
      openIsland(go.dataset.go!);
      return;
    }
    const act = target.closest<HTMLElement>('[data-act]')?.dataset.act;
    if (!act) return;
    if (act === 'list') openDrawer(drawer.hidden);
    else if (act === 'news') openNews();
    else if (act === 'quests') openQuests();
    else if (act === 'help') showTour(0);
    else if (act === 'back') closePanel();
    else if (act === 'reset') {
      if (confirm('確定要清除這台裝置上的任務進度嗎？')) {
        progress.reset();
        progress.finishTour();
        toast('已重設任務進度');
      }
    } else if (act === 'toggle-mode') {
      document.body.classList.toggle('no-3d');
      updateModeBtn();
    }
  });
  root.querySelector('.close-drawer')!.addEventListener('click', () => openDrawer(false));
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!tourEl.hidden) endTour();
    else if (!drawer.hidden) openDrawer(false);
    else if (!panel.hidden) closePanel();
  });

  renderProgress();
  updateModeBtn();
  if (!progress.tourDone) showTour(0);

  return {
    /** 3D 場景中點到東西時呼叫 */
    handlePick(islandId: string, role: string) {
      openIsland(islandId);
      if (islandId === data.hub.id && role === 'board') openNews();
      const island = byId.get(islandId);
      if (!island) return;
      if (role === 'chief') (panel.querySelector('[data-ask="0"]') as HTMLElement | null)?.click();
      if (role === 'resident') talkResident(island);
    },
    ready3D() {
      updateModeBtn();
    },
    setNo3D(reason: string) {
      document.body.classList.add('no-3d');
      updateModeBtn();
      toast(reason);
    },
  };
}
