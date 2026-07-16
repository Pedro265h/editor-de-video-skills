import { loadEnv, need, mask } from "./lib/env.mjs";
import * as kie from "./lib/kie.mjs";

loadEnv();

async function testEleven() {
  const key = need("ELEVENLABS_API_KEY");
  const res = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: { "xi-api-key": key },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 150)}`);
  const j = await res.json();
  const voices = j.voices || [];
  const names = voices.slice(0, 3).map((v) => v.name).join(", ");
  return `${voices.length} voces (ej: ${names || "—"})`;
}

async function testKie() {
  const status = await kie.probe();
  return `auth OK (HTTP ${status}) · modelo ${process.env.KIE_MODEL}`;
}

async function testApify() {
  const token = need("APIFY_TOKEN");
  const res = await fetch(`https://api.apify.com/v2/users/me?token=${token}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const d = (await res.json()).data || {};
  return `usuario ${d.username} · plan ${(d.plan || {}).id || "?"}`;
}

const checks = [
  ["ElevenLabs", "ELEVENLABS_API_KEY", testEleven],
  ["Kie.ai    ", "KIE_API_TOKEN", testKie],
  ["Apify     ", "APIFY_TOKEN", testApify],
];

console.log("\n🔌 Probando conexiones…\n");
let allOk = true;
for (const [name, keyEnv, fn] of checks) {
  const masked = mask(process.env[keyEnv]);
  try {
    const detail = await fn();
    console.log(`  ✅ ${name}  [${masked}]  ${detail}`);
  } catch (e) {
    allOk = false;
    console.log(`  ❌ ${name}  [${masked}]  ${e.message}`);
  }
}
console.log(allOk ? "\n✨ Todo conectado.\n" : "\n⚠️  Revisa las que fallaron.\n");
process.exit(allOk ? 0 : 1);
