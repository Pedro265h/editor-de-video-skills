import { need } from "./env.mjs";

// Música con Suno vía Kie AI. Ref: /api/v1/generate + /api/v1/generate/record-info
const BASE = () => process.env.KIE_BASE_URL || "https://api.kie.ai/api/v1";

export async function generateMusic({ prompt, model = "V4_5", instrumental = true, timeoutMs = 300_000 }) {
  const auth = { Authorization: `Bearer ${need("KIE_API_TOKEN")}`, "Content-Type": "application/json" };

  const createRes = await fetch(`${BASE()}/generate`, {
    method: "POST",
    headers: auth,
    body: JSON.stringify({
      prompt,
      customMode: false,
      instrumental,
      model,
      callBackUrl: "https://example.com/callback", // requerido por la API; igual hacemos polling
    }),
  });
  const createJson = await createRes.json();
  const taskId = createJson?.data?.taskId;
  if (!taskId) throw new Error(`Kie Suno sin taskId: ${JSON.stringify(createJson).slice(0, 300)}`);

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 8000));
    const res = await fetch(`${BASE()}/generate/record-info?taskId=${taskId}`, { headers: auth });
    const d = (await res.json())?.data || {};
    const status = String(d.status || d.state || "").toUpperCase();
    if (status === "SUCCESS") {
      const arr = d.response?.sunoData || d.response?.data || [];
      const t = arr[0] || {};
      const url = t.audioUrl || t.audio_url || t.streamAudioUrl;
      if (!url) throw new Error(`Suno success sin URL: ${JSON.stringify(d).slice(0, 200)}`);
      return url;
    }
    if (/FAIL|ERROR/.test(status)) throw new Error(`Suno falló: ${JSON.stringify(d).slice(0, 200)}`);
  }
  throw new Error("Suno: timeout esperando el audio");
}
