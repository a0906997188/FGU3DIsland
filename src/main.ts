import './style.css';
import islandsJson from './data/islands.json';
import newsJson from './data/news.json';
import type { IslandData, NewsData } from './types';
import { createApp, type AppHooks } from './ui/app';

const data = islandsJson as IslandData;
const news = newsJson as NewsData;

const hooks: AppHooks = { focusIsland: null, overview: null };
const app = createApp(document.getElementById('app')!, data, news, hooks);

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

async function start3D() {
  // 展示用：網址加上 ?nowebgl=1 可模擬 3D 載入失敗
  const forceFail = new URLSearchParams(location.search).has('nowebgl');
  if (forceFail || !webglAvailable()) {
    app.setNo3D('這台裝置無法顯示 3D，已切換成清單模式，所有資訊都能在清單中閱讀。');
    return;
  }
  try {
    // 3D 程式碼分開載入：就算載入失敗，清單仍可使用
    const { createWorld } = await import('./scene/world');
    const world = createWorld(document.getElementById('scene')!, data, (e) => app.handlePick(e.islandId, e.role));
    hooks.focusIsland = (id) => {
      world.flyToIsland(id);
      world.setFocus(id);
    };
    hooks.overview = () => {
      world.overview();
      world.setFocus(null);
    };
    document.body.classList.add('has-3d');
    app.ready3D();
  } catch (err) {
    console.error(err);
    app.setNo3D('3D 場景載入失敗，已切換成清單模式。');
  }
}

start3D();
