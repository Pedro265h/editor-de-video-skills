import { need } from "./env.mjs";

// Cliente Kie.ai — Nano Banana. Ref: https://api.kie.ai/api/v1/jobs/{createTask,recordInfo}
const BASE = () => process.env.KIE_BASE_URL || "https://api.kie.ai/api/v1";

function authHeaders() {
  return {
    Authorization: `Bearer ${need("KIE_API_TOKEN")}`,
    "Content-Type": "application/json",
  };
}

/**
 * Crea una tarea de generación/edición.
 * @param {{prompt:string, aspectRatio?:string, model?:string, imageInput?:string[]}} opts
 *   imageInput = URLs de imágenes de referencia (para recortes / edición imagen-a-imagen)
 * @returns {Promise<string>} taskId
 */
export async function createTask({ prompt, aspectRatio = "16:9", model, imageInput }) {
  const input = { prompt, aspect_ratio: aspectRatio, output_format: "png" };
  if (imageInput && imageInput.length) input.image_input = imageInput;

  const res = await fetch(`${BASE()}/jobs/createTask`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      model: model || process.env.KIE_MODEL || "nano-banana-pro",
      input,
    }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Kie createTask ${res.status}: ${JSON.stringify(j).slice(0, 300)}`);
  const id = j?.data?.taskId;
  if (!id) throw new Error(`Kie createTask sin taskId: ${JSON.stringify(j).slice(0, 300)}`);
  return id;
}

/** Espera a que la tarea termine y devuelve la URL de la imagen. */
export async function pollTask(taskId, { timeoutMs = 240_000, intervalMs = 4000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await fetch(
      `${BASE()}/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`,
      { headers: authHeaders() }
    );
    const j = await res.json().catch(() => ({}));
    const data = j?.data || {};
    const state = String(data.state || "").toLowerCase();

    if (state === "success") {
      const rj =
        typeof data.resultJson === "string"
          ? JSON.parse(data.resultJson)
          : data.resultJson;
      const url = rj?.resultUrls?.[0];
      if (!url) throw new Error(`Kie success sin URL: ${JSON.stringify(data).slice(0, 300)}`);
      return url;
    }
    if (["fail", "failed", "error"].includes(state)) {
      throw new Error(`Kie task falló: ${data.failMsg || "desconocido"}`);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`Kie task ${taskId} agotó el tiempo de espera`);
}

export async function generateImage(opts) {
  const id = await createTask(opts);
  return pollTask(id);
}

/** Prueba de auth SIN gastar créditos: un taskId inválido responde 4xx pero autenticado. */
export async function probe() {
  const res = await fetch(`${BASE()}/jobs/recordInfo?taskId=probe-${Date.now()}`, {
    headers: authHeaders(),
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error(`token inválido (HTTP ${res.status})`);
  }
  return res.status;
}
