# AI 解说后端（Cloudflare Worker）部署 — 给 Max 的点击步骤

目的：把你的 Gemini key 放在 Cloudflare（密文），让 demo 能调用"音乐→解说"，而 key 不进仓库、不经过 Claude。

## A. 用网页面板（推荐，不用命令行）

1. 打开 https://dash.cloudflare.com → 注册/登录（免费）。
2. 左侧 **Workers & Pages** → **Create application** → **Create Worker**。
3. 随便起个名（比如 `see-caption`）→ **Deploy**（先部署个默认的）。
4. 进这个 Worker → **Edit code**：把 `src/index.js` 的全部内容**整段粘贴**进去，覆盖原有 → 右上 **Deploy**。
5. 回到 Worker 的 **Settings** → **Variables and Secrets**（或 Settings → Variables）→ **Add**：
   - 名称填 `GEMINI_KEY`
   - 值填你的 Gemini key（`AIza...`）
   - **类型选 Secret / Encrypt（加密）** → Save / Deploy
6. 复制这个 Worker 的网址，形如 `https://see-caption.你的名字.workers.dev`
   —— 这个网址**不是 key、可以公开**，把它发给 Claude（或自己在 demo 里点"AI 解说"时粘贴）。

完成。demo 里点「✦ 让 AI 解说这首歌」就会走这个 Worker。

## B. 用命令行（可选，懂技术再用）

```
cd worker
npx wrangler login           # 浏览器登录你的 Cloudflare
npx wrangler secret put GEMINI_KEY   # 粘贴你的 AIza... key
npx wrangler deploy          # 部署，输出 workers.dev 网址
```

## 排错
- 点解说报错 `GEMINI_KEY 缺失` → 第 5 步密文没设好。
- 报错 `API_KEY_INVALID` → key 不对（要 `AIza...`，不是别的 token）。
- 报错模型不存在 → 把 `src/index.js` 里的 `MODEL` 换成 `gemini-2.5-flash` 或 `gemini-1.5-flash`，重 Deploy。
