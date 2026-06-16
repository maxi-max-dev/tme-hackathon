// 声画像 · AI 解说 代理 (Cloudflare Worker)
// 作用：浏览器把音频发来 → 这里转发给 Gemini → 返回"这首歌在表达什么"的中文解说。
// 你的 Gemini key 以密文 GEMINI_KEY 存在 Cloudflare，前端和仓库都看不到。

const MODEL = 'gemini-2.0-flash'; // 如不可用可换 gemini-2.5-flash / gemini-1.5-flash
const PROMPT = '你是帮助听障者"读懂"音乐的解说员。请用中文写一段 150 字以内的解说，描述这段音乐的：情绪、张力的起伏（从安静到爆发等）、像什么画面或场景、乐器/声响的质感。目标是让一个听不见的人也能在脑海里"感受到"这首歌。要求：具体、有画面感；不要写歌词、不要逐句翻译、不要泛泛而谈（如"很好听""很有感染力"）。直接给解说正文，不要前缀。';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (req.method !== 'POST') return json({ error: 'POST {audio(base64), mime}' }, 405);
    if (!env.GEMINI_KEY) return json({ error: '后端缺少 GEMINI_KEY 密文，请在 Cloudflare 里设置' }, 500);
    let payload;
    try { payload = await req.json(); } catch { return json({ error: 'bad json' }, 400); }
    const { audio, mime, prompt } = payload || {};
    if (!audio) return json({ error: '缺少 audio (base64)' }, 400);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${env.GEMINI_KEY}`;
    const body = {
      contents: [{ parts: [
        { inline_data: { mime_type: mime || 'audio/mpeg', data: audio } },
        { text: prompt || PROMPT },
      ] }],
      generationConfig: { temperature: 0.9, maxOutputTokens: 400 },
    };

    let r, j;
    try {
      r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      j = await r.json();
    } catch (e) {
      return json({ error: '调用 Gemini 失败: ' + String(e) }, 502);
    }
    if (!r.ok) return json({ error: (j && j.error && j.error.message) || 'Gemini 返回错误', status: r.status }, r.status);

    const text = (j.candidates && j.candidates[0] && j.candidates[0].content
      && j.candidates[0].content.parts || []).map(p => p.text || '').join('').trim();
    return json({ text: text || '(模型没有返回文本)' });
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}
