// 任務進度存在瀏覽器 localStorage：重新整理後仍保留。無法使用儲存空間時（無痕模式等）退回記憶體，不讓網站壞掉。

const KEY = 'fgu-archipelago:v1';

interface ProgressState {
  done: string[];
  clues: string[];
  visited: string[];
  tourDone: boolean;
}

const empty = (): ProgressState => ({ done: [], clues: [], visited: [], tourDone: false });

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const p = JSON.parse(raw);
    return {
      done: Array.isArray(p.done) ? p.done : [],
      clues: Array.isArray(p.clues) ? p.clues : [],
      visited: Array.isArray(p.visited) ? p.visited : [],
      tourDone: Boolean(p.tourDone),
    };
  } catch {
    return empty();
  }
}

let state = load();
const listeners = new Set<() => void>();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* 儲存失敗時只保留在本次瀏覽 */
  }
  listeners.forEach((fn) => fn());
}

function addTo(list: keyof Pick<ProgressState, 'done' | 'clues' | 'visited'>, id: string) {
  if (state[list].includes(id)) return false;
  state = { ...state, [list]: [...state[list], id] };
  save();
  return true;
}

export const progress = {
  isDone: (questId: string) => state.done.includes(questId),
  hasClue: (clueId: string) => state.clues.includes(clueId),
  hasVisited: (islandId: string) => state.visited.includes(islandId),
  doneCount: () => state.done.length,
  complete: (questId: string) => addTo('done', questId),
  addClue: (clueId: string) => addTo('clues', clueId),
  visit: (islandId: string) => addTo('visited', islandId),
  get tourDone() {
    return state.tourDone;
  },
  finishTour() {
    state = { ...state, tourDone: true };
    save();
  },
  reset() {
    state = empty();
    save();
  },
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
