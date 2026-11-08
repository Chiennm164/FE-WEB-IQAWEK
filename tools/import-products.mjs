// Nhập sản phẩm MỚI từ file Excel vào src/content/vi/products/. Chạy: npm run import -- <file.xlsx>
//
// File Excel gồm 2 sheet (xem mẫu exports/san-pham-moi-mau.xlsx):
//   "Sản phẩm": Mã model | Tên sản phẩm | Danh mục | Mô tả SEO | Mô tả ngắn | Thư mục ảnh | Slug | Ẩn khỏi Google
//   "Thông số": Mã model | Thông số | Giá trị   (mỗi dòng một thông số, theo thứ tự hiển thị)
// - Danh mục: đúng tên danh mục sản phẩm trong src/_data/categories.json (vd. "Loại đeo vai").
// - Thư mục ảnh: tên thư mục trong src/assets/media/products/, phải có thumb.jpg (vuông 640×640); 1.jpg, 2.jpg… là gallery.
// - Slug: tuỳ chọn, thành URL /product/<slug>/; trống thì lấy từ mã model (chữ thường, nối "-").
// - Ẩn khỏi Google = "Có": trang gắn noindex, không vào sitemap (dùng cho sản phẩm thử).
// Kiểm tra toàn bộ file trước; có lỗi thì báo theo dòng và KHÔNG ghi gì. Bản này chỉ thêm mới: slug đã có thì báo lỗi.
import fs from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";
import matter from "gray-matter";

const file = process.argv[2];
if (!file) {
  console.error("Cách dùng: npm run import -- <file.xlsx>");
  process.exit(1);
}

const PRODUCTS_DIR = "src/content/vi/products";
const MEDIA_DIR = "src/assets/media/products";
const categories = JSON.parse(fs.readFileSync("src/_data/categories.json", "utf8"));
const productCats = categories.filter((c) => c.type === "products" && c.lang === "vi" && c.parentId);

// id lớn nhất trong toàn site (sản phẩm + tin dùng chung dãy id)
const allIds = ["src/content/vi/products", "src/content/vi/news"].flatMap((dir) =>
  fs.readdirSync(dir).filter((f) => f.endsWith(".html")).map((f) => Number(matter(fs.readFileSync(path.join(dir, f), "utf8")).data.id) || 0));
let nextId = Math.max(0, ...allIds) + 1;

const text = (v) => {
  if (v == null) return "";
  if (typeof v === "object") return String(v.text ?? v.result ?? (v.richText ? v.richText.map((r) => r.text).join("") : "")).trim();
  return String(v).trim();
};
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const slugify = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(file);
const sheetP = wb.getWorksheet("Sản phẩm");
const sheetS = wb.getWorksheet("Thông số");
if (!sheetP) { console.error('Thiếu sheet "Sản phẩm"'); process.exit(1); }

// Đọc sheet theo tên cột ở dòng 1
function rowsOf(ws) {
  if (!ws) return [];
  const head = ws.getRow(1).values.map(text);
  const out = [];
  ws.eachRow((row, i) => {
    if (i === 1) return;
    const obj = { _row: i };
    head.forEach((h, col) => { if (h) obj[h] = text(row.getCell(col).value); });
    if (Object.entries(obj).some(([k, v]) => k !== "_row" && v)) out.push(obj);
  });
  return out;
}
const specs = rowsOf(sheetS);
const errors = [];
const plans = [];

for (const r of rowsOf(sheetP)) {
  const at = `Sản phẩm, dòng ${r._row}`;
  const model = r["Mã model"];
  const title = r["Tên sản phẩm"];
  if (!title) errors.push(`${at}: thiếu Tên sản phẩm`);
  const cat = productCats.find((c) => c.name.toLowerCase() === (r["Danh mục"] || "").toLowerCase());
  if (!cat) errors.push(`${at}: Danh mục "${r["Danh mục"] || ""}" không có trong categories.json`);
  const slug = slugify(r["Slug"] || model || title || "");
  if (!slug) errors.push(`${at}: không tạo được slug (cần Mã model hoặc Slug)`);
  if (slug && fs.existsSync(path.join(PRODUCTS_DIR, `${slug}.html`))) errors.push(`${at}: đã có sản phẩm /product/${slug}/ (bản này chỉ thêm mới)`);
  if (plans.some((p) => p.slug === slug)) errors.push(`${at}: trùng slug "${slug}" với dòng khác trong file`);
  const folder = r["Thư mục ảnh"];
  const dir = folder ? path.join(MEDIA_DIR, folder) : "";
  if (!folder) errors.push(`${at}: thiếu Thư mục ảnh`);
  else if (!fs.existsSync(path.join(dir, "thumb.jpg"))) errors.push(`${at}: không thấy ${dir}/thumb.jpg`);
  const description = r["Mô tả SEO"] || "";
  if (description.length > 160) errors.push(`${at}: Mô tả SEO dài ${description.length} ký tự (tối đa 160)`);
  const mySpecs = specs.filter((s) => s["Mã model"] && s["Mã model"] === model && s["Thông số"] && s["Giá trị"]);
  plans.push({ r, model, title, cat, slug, folder, dir, description, mySpecs, noindex: /^c[oó]$/i.test(r["Ẩn khỏi Google"] || "") });
}
if (!plans.length) errors.push('Sheet "Sản phẩm" không có dòng nào');
if (errors.length) {
  console.error(`Có ${errors.length} lỗi, chưa ghi gì:\n  - ` + errors.join("\n  - "));
  process.exit(1);
}

for (const p of plans) {
  const gallery = fs.readdirSync(p.dir).filter((f) => /^\d+\.(jpe?g|png|webp)$/i.test(f)).sort((a, b) => parseInt(a) - parseInt(b));
  const media = (f) => `/assets/media/products/${p.folder}/${f}`;
  const table = (rows) => `<table class="rows"><tbody>${rows.map((s) => `<tr><td>${esc(s["Thông số"])}</td><td>${esc(s["Giá trị"])}</td></tr>`).join("")}</tbody></table>`;
  const data = {
    id: nextId++,
    title: p.title,
    model: p.model || undefined,
    categoryId: p.cat.id,
    thumb: media("thumb.jpg"),
    images: gallery.length ? gallery.map(media) : undefined,
    description: p.description || undefined,
    summary: [p.r["Mô tả ngắn"] && `<p>${esc(p.r["Mô tả ngắn"])}</p>`, p.mySpecs.length && table(p.mySpecs.slice(0, 3))].filter(Boolean).join("\n") || undefined,
    noindex: p.noindex || undefined,
  };
  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
  const body = [p.r["Mô tả ngắn"] && `<p>${esc(p.r["Mô tả ngắn"])}</p>`, p.mySpecs.length && table(p.mySpecs)].filter(Boolean).join("\n");
  const out = path.join(PRODUCTS_DIR, `${p.slug}.html`);
  // lineWidth -1: không tự ngắt dòng các trường dài trong front matter (giữ HTML trên một dòng, dễ đọc / sửa tay)
  fs.writeFileSync(out, matter.stringify(body + "\n", data, { lineWidth: -1 }));
  console.log(`+ ${out}  →  /product/${p.slug}/  (id ${data.id}, danh mục "${p.cat.name}", ${p.mySpecs.length} thông số, ${gallery.length} ảnh gallery${p.noindex ? ", noindex" : ""})`);
}
console.log(`Đã thêm ${plans.length} sản phẩm. Xem thử: npm start — rồi npm run build && npm run check.`);
