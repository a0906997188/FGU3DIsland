# 佛光科技設計學習群島

用 Three.js 做的 3D 群島，帶大學生探索佛光大學應用科技與設計學院的五個學組。
這是課堂專題作品，不是官方網站；正式資訊以[學院官網](https://tech.fgu.edu.tw/?locale=zh_tw)為準。

🌐 線上版：https://fgu-3-d-island.vercel.app

## 本機執行

```bash
npm install
npm run dev        # 開發伺服器
npm test           # 測試消息解析程式
npm run fetch-news # 手動抓一次官網消息
npm run build      # 產生正式版到 dist/
```

## 資料在哪裡改

| 檔案 | 內容 |
|---|---|
| `src/data/islands.json` | 學組、島長對話、島民、地標、任務（每筆附官網來源與查證日期） |
| `src/data/news.json` | 學院消息，由 `scripts/fetch-news.mjs` 自動產生，請不要手動改 |

新增一座島：在 `islands` 陣列加一筆資料，`landmark.type` 和 `resident.model` 從已有的類型中挑一個，
`position` 是它在群島上的 x、z 座標。

## 部署（GitHub + Vercel）

1. 在 GitHub 建立新的 repo，把這個專案推上去。
2. 到 Vercel 選「Add New → Project」，匯入這個 repo；框架會自動偵測為 Vite，不需要改設定。
3. 不需要改 GitHub 設定：`.github/workflows/update-news.yml` 已宣告 `permissions: contents: write`，
   每天的消息更新可以直接提交。
4. 之後每天台灣時間 06:00 會自動抓取消息；有更新就提交，Vercel 會自動重新部署。

## 展示：證明自動更新與失敗備援真的能用

1. **正常更新**：到 GitHub 的 **Actions → 更新學院消息 → Run workflow**。跑完後網站「📰 消息」裡的「本站更新時間」會跟著改變。
2. **故意失敗**：在本機執行

   ```bash
   NEWS_URL=https://tech.fgu.edu.tw/not-found node scripts/fetch-news.mjs
   ```

   網站仍顯示原本的消息與原本的更新時間，並多一行黃色警告「最近一次抓取官網失敗」。
   展示完再執行 `npm run fetch-news` 恢復。
3. **自動測試**：`npm test` 驗證官網「2026-10/28」這種日期格式，也驗證版面改版時不會產生空資料。
4. **3D 失敗備援**：網址加上 `?nowebgl=1`，網站會改用清單模式，所有資訊都還能閱讀與作答。
