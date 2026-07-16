import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

// Verifica dependencias + llaves. Con --fix auto-instala lo instalable (npm/pip).
// Multiplataforma: da el comando correcto según el SO para lo que no puede instalar solo.
const FIX = process.argv.includes("--fix");
const OS = process.platform; // 'darwin' | 'linux' | 'win32'

function run(cmd, args, opts = {}) {
  execFileSync(cmd, args, { stdio: opts.quiet ? "pipe" : "inherit" });
}
function has(cmd) {
  try {
    execFileSync(cmd, ["-version"], { stdio: "pipe" }); // -version sirve para ffmpeg y node/npm
    return true;
  } catch (e) {
    // ENOENT = el binario no existe. Cualquier otro error = existe pero el flag falló.
    return e.code !== "ENOENT";
  }
}
function pyCmd() {
  for (const c of ["python3", "python"]) {
    try {
      execFileSync(c, ["--version"], { stdio: "pipe" });
      return c;
    } catch {}
  }
  return null;
}
function pyMod(py, mod) {
  try {
    execFileSync(py, ["-c", `import ${mod}`], { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}
function osHint(mac, linux, win) {
  return OS === "win32" ? win : OS === "darwin" ? mac : linux;
}

const rows = [];
const ok = (l, d = "") => rows.push(["✅", l, d]);
const bad = (l, d) => rows.push(["❌", l, d]);

// --- Node + deps npm ---
has("node") ? ok("Node.js") : bad("Node.js", osHint("brew install node", "nvm install 22", "winget install OpenJS.NodeJS.LTS"));
if (existsSync(resolve("node_modules"))) ok("node_modules");
else if (FIX && has("npm")) {
  try { console.log("→ npm install…"); run("npm", ["install"]); ok("node_modules", "(instalado)"); }
  catch { bad("node_modules", "corre: npm install"); }
} else bad("node_modules", "corre: npm install");

// --- ffmpeg (no se auto-instala: requiere gestor de paquetes del SO) ---
has("ffmpeg") ? ok("ffmpeg") : bad("ffmpeg", osHint("brew install ffmpeg", "sudo apt install ffmpeg", "winget install ffmpeg"));
has("ffprobe") ? ok("ffprobe") : bad("ffprobe", "viene con ffmpeg");

// --- Python + rembg/Pillow (recortes) ---
const py = pyCmd();
if (!py) bad("Python 3", osHint("brew install python", "sudo apt install python3 python3-pip", "winget install Python.Python.3.12"));
else {
  ok("Python 3");
  for (const [mod, pip, label] of [["PIL", "pillow", "Pillow"], ["rembg", "rembg onnxruntime", "rembg (recortes)"]]) {
    if (pyMod(py, mod)) ok(label);
    else if (FIX) {
      try { console.log(`→ instalando ${label}…`); run(py, ["-m", "pip", "install", "--quiet", ...pip.split(" ")]); ok(label, "(instalado)"); }
      catch { bad(label, `corre: ${py} -m pip install ${pip}`); }
    } else bad(label, `${py} -m pip install ${pip}`);
  }
}

// --- Llaves ---
if (!existsSync(resolve(".env"))) {
  bad(".env", "el onboarding lo crea: copia .env.example a .env y pon Kie + ElevenLabs");
} else {
  const env = readFileSync(resolve(".env"), "utf8");
  /KIE_API_TOKEN=.+/.test(env) ? ok("KIE_API_TOKEN") : bad("KIE_API_TOKEN", "ponla en .env");
  /ELEVENLABS_API_KEY=.+/.test(env) ? ok("ELEVENLABS_API_KEY") : bad("ELEVENLABS_API_KEY", "ponla en .env");
}

console.log("\n🩺 video-vox doctor\n");
for (const [icon, l, d] of rows) console.log(`  ${icon} ${l.padEnd(22)} ${d}`);
const fails = rows.filter((r) => r[0] === "❌").length;
if (fails && !FIX) console.log("\n💡 Corre con --fix para auto-instalar lo instalable: node scripts/doctor.mjs --fix");
console.log(fails ? `\n⚠️  ${fails} pendiente(s).\n` : "\n✨ Todo listo. Ya puedes generar videos.\n");
process.exit(fails ? 1 : 0);
