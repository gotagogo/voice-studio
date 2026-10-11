# 聲紋 · Voice Studio

繁體中文 Fish Audio 語音創作介面：聲音樣本上傳、逐字稿、文字生成、8 種語氣、語速、音量、Temperature / Top-p、MP3 / WAV 試聽下載。

網站：https://gotagogo.github.io/voice-studio/

## 使用

1. 部署下方語音後端。
2. 點「連接 Fish API」，填入後端完整網址與自己的 Fish API Key。
3. 上傳本人或已獲授權的清晰錄音（建議 10–30 秒，最大 10 MB），填寫樣本逐字稿。
4. 輸入生成文字、調整參數並生成。

**GitHub Pages 僅提供靜態介面。** Fish API 跨網域預檢在 2026-10-11 回傳 404，不能直接从瀏覽器可靠呼叫，因此需要代理後端。此 repo 未包含任何 API Key，後端尚未代為部署。

Key 與後端網址只存在本次頁面記憶體。樣本、逐字稿、生成文字及 Key 會傳送至你指定的後端，再由後端送給 Fish Audio。只填寫自己部署或信任的後端，不使用公共未知代理。Fish Audio 可能依帳戶方案計費；取消等待不保證取消生成或計費。

## 語音後端

提供 Cloudflare Worker 範例，不儲存 Key 或樣本。每位使用者需自備 Fish Key。

安裝 Node.js 22.13 以上，登入自己的 Cloudflare 帳戶：

```sh
cd voice-studio
npx wrangler login
npx wrangler deploy
```

部署後把 `https://voice-studio-api.<你的帳戶>.workers.dev/api/generate` 填入網頁後端網址欄位。

`wrangler.jsonc` 的 `ALLOWED_ORIGIN` 已設定為 `https://gotagogo.github.io`。CORS 只限制瀏覽器來源，不是身分驗證；此代理不使用共用 Fish Key，僅轉送呼叫者自己的 Key。

## 本機开发

下載並解壓 `source.zip`，再進入解壓後的資料夾。

```sh
npm install
npm run dev
npm run build
```

建置產物在 `docs/`。GitHub Settings → Pages 設定從 `main` branch 的 `/ (root)` 發布。修改來源後重新建置並提交 `docs/`。

API 文件：https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech
情緒標記：https://docs.fish.audio/developer-guide/core-features/emotions
API Key：https://fish.audio/app/api-keys

## 驗證範圍

靜態建置、輸入介面與後端驗證已檢查。未使用真實 Fish Key 驗證付費生成與音色品質。情绪標記屬模型引導，效果依樣本而異。
