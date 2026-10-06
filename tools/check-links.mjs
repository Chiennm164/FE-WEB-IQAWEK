// Kiểm tra link / ảnh nội bộ trong dist/: mọi href, src, data-src, url() bắt đầu bằng "/"
// và url() tương đối trong CSS phải trỏ tới file có thật. Chạy sau build: npm run check
import fs from "node:fs";
import path from "node:path";

const root = path.resolve("dist");
const files = fs.readdirSync(root, { recursive: true }).map(String);
const broken = new Map();
let checked = 0;

function exists(url) {
  const clean = decodeURI(url.split(/[?#]/)[0]);
  const p = path.join(root, clean);
  if (clean.endsWith("/")) return fs.existsSync(path.join(p, "index.html"));
  return fs.existsSync(p);
}

for (const f of files.filter((f) => f.endsWith(".html") || f.endsWith(".css"))) {
  const text = fs.readFileSync(path.join(root, f), "utf8");
  const refs = [...text.matchAll(/(?:href|src|data-src)="(\/[^"]*)"|url\(['"]?(\/[^'")]+)['"]?\)/g)].map((m) => m[1] || m[2]);
  // url() tương đối trong CSS: quy về đường dẫn tuyệt đối theo vị trí file CSS
  if (f.endsWith(".css")) {
    for (const m of text.matchAll(/url\(['"]?(?!data:|https?:|\/)([^'")?#]+)[^'")]*['"]?\)/g)) {
      refs.push("/" + path.posix.join(path.posix.dirname(f.replaceAll("\\", "/")), m[1]));
    }
  }
  for (const r of refs) {
    if (r.startsWith("//")) continue; // "//cdn…" là link ngoài
    checked++;
    if (!exists(r)) {
      if (!broken.has(r)) broken.set(r, new Set());
      broken.get(r).add(f);
    }
  }
}

console.log(`Da kiem tra ${checked} lien ket trong ${files.length} file.`);
if (broken.size) {
  console.log(`${broken.size} lien ket hong:`);
  for (const [r, from] of broken) console.log(`  ${r}  <- ${[...from].slice(0, 3).join(", ")}${from.size > 3 ? ` (+${from.size - 3})` : ""}`);
  process.exitCode = 1;
} else {
  console.log("Khong co lien ket hong.");
}
