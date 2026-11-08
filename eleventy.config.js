import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

// Phiên bản file CSS / JS (8 ký tự hash nội dung), gắn vào link trong base.njk: "/assets/css/reset.css?v=…".
// Nội dung file đổi thì số đổi → trình duyệt (và .htaccess cho giữ CSS / JS 1 tháng) buộc tải bản mới, không dùng bản cũ đã lưu
function assetVersion() {
  const hash = crypto.createHash("md5");
  for (const dir of ["src/assets/css", "src/assets/iconfont", "src/assets/js"]) {
    for (const name of fs.readdirSync(dir).sort()) {
      if (/\.(css|js)$/.test(name)) hash.update(fs.readFileSync(path.join(dir, name)));
    }
  }
  return hash.digest("hex").slice(0, 8);
}

// Chỉ đọc một lần khi nạp cấu hình: đang chạy `npm start` mà sửa categories.json
// thì phải khởi động lại server, nếu không menu và trang danh mục vẫn dùng dữ liệu cũ.
const categories = JSON.parse(fs.readFileSync("src/_data/categories.json", "utf8"));
const catById = new Map(categories.map((cat) => [cat.id, cat]));
const { url: siteUrl, defaultLang } = JSON.parse(fs.readFileSync("src/_data/site.json", "utf8"));

// Trang chủ của một ngôn ngữ: ngôn ngữ mặc định không có tiền tố trong URL ("/"), ngôn ngữ khác "/<lang>/".
// Mọi URL tạo trong template / config ghép từ đây (vd. `{{ lang | langHome }}search/`), không viết "/{{ lang }}/".
const langHome = (lang) => (lang === defaultLang ? "/" : `/${lang}/`);

const PRODUCTS_PER_PAGE = 12;
const NEWS_PER_PAGE = 4;

const byOrder = (a, b) => a.order - b.order;
const byIdDesc = (a, b) => b.data.id - a.data.id;

// "/product/c558/" -> "<site.url>/product/c558/" (canonical, og:image, sitemap, JSON-LD cần URL đầy đủ)
const absUrl = (url) => (Array.isArray(url) ? url.map(absUrl) : url && url.startsWith("/") ? siteUrl + url : url);

const ENTITIES = { "&amp;": "&", "&quot;": '"', "&#39;": "'", "&lt;": "<", "&gt;": ">", "&nbsp;": " " };

// Văn bản thuần: bỏ thẻ HTML và entity, gộp khoảng trắng
function plainText(html) {
  return String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(amp|quot|#39|lt|gt|nbsp);/g, (m) => ENTITIES[m])
    .replace(/\s+/g, " ")
    .trim();
}

// Văn bản thuần cho thẻ meta description: quá max ký tự thì cắt ở ranh giới từ và thêm "…"
// (Google chỉ hiện khoảng 150–160 ký tự)
function metaDescription(text, max = 160) {
  const clean = plainText(text);
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return (space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,;:.–-]+$/, "") + "…";
}

// Chuỗi danh mục từ gốc tới chính nó, vd. [Sản phẩm, Máy cắt cỏ, Đeo vai]
function catPath(id) {
  const path = [];
  let cat = catById.get(Number(id));
  while (cat) {
    path.unshift(cat);
    cat = cat.parentId ? catById.get(cat.parentId) : null;
  }
  return path;
}

function subCats(id) {
  return categories.filter((cat) => cat.parentId === Number(id)).sort(byOrder);
}

// Gồm cả id của chính danh mục đó
function descendantIds(id) {
  const ids = [Number(id)];
  for (const cat of subCats(id)) ids.push(...descendantIds(cat.id));
  return ids;
}

// Nhóm máy chính chứa một danh mục sản phẩm (cấp ngay dưới "Sản phẩm"), vd. Loại đeo vai -> Máy cắt cỏ / Máy cắt bụi cây
const topGroupId = (catId) => catPath(catId)[1]?.id;

// Sản phẩm liên quan ở trang chi tiết sản phẩm: bỏ chính sản phẩm đang xem; cộng điểm khi cùng mã model (biến thể khác
// của cùng máy, vd. G43 đeo vai / G43 đeo lưng: +5), cùng danh mục (+4), cùng nhóm máy chính (+2) → biến thể cùng loại máy
// đứng đầu, rồi tới máy cùng danh mục; bằng điểm thì sản phẩm mới hơn đứng trước.
// Nhóm ít sản phẩm (vd. Máy cưa xích chỉ có C558) thì phần còn thiếu là sản phẩm mới nhất của nhóm khác, đủ n mục.
function relatedProducts(products, id, lang, n = 8) {
  const items = (products || []).filter((item) => item.data.lang === lang);
  const self = items.find((item) => item.data.id === id);
  if (!self) return [...items].sort(byIdDesc).slice(0, n);
  const model = (item) => String(item.data.model || "").trim().toLowerCase();
  const group = topGroupId(self.data.categoryId);
  const score = (item) =>
    (model(self) && model(item) === model(self) ? 5 : 0) +
    (item.data.categoryId === self.data.categoryId ? 4 : 0) +
    (group && topGroupId(item.data.categoryId) === group ? 2 : 0);
  return items
    .filter((item) => item.url !== self.url)
    .map((item) => ({ item, score: score(item) }))
    .sort((a, b) => b.score - a.score || b.item.data.id - a.item.data.id)
    .slice(0, n)
    .map(({ item }) => item);
}

// ---- Tìm kiếm ----
// Danh mục sản phẩm có ít nhất 1 sản phẩm (tính cả danh mục con), theo thứ tự cây danh mục.
// depth 1 = nhóm máy chính (gợi ý nhanh trong ô tìm kiếm); path = tên từ nhóm chính tới danh mục đó
function productCats(lang, products) {
  const root = categories.find((cat) => cat.lang === lang && cat.type === "products" && !cat.parentId);
  if (!root) return [];
  const items = (products || []).filter((item) => item.data.lang === lang);
  const out = [];
  const walk = (parentId, path) => {
    for (const cat of subCats(parentId)) {
      const ids = new Set(descendantIds(cat.id));
      const count = items.filter((item) => ids.has(item.data.categoryId)).length;
      const names = [...path, cat.name];
      if (count) out.push({ id: cat.id, name: cat.name, url: cat.url, depth: names.length, path: names, count });
      walk(cat.id, names);
    }
  };
  walk(root.id, []);
  return out;
}

// Nội dung dạng chữ của một mục trang Hỗ trợ (support.json): câu hỏi thường gặp = các bước;
// bài hướng dẫn vận hành (operation.groups[].articles[], có points) = các bước / ý + ý con + Nên làm / Tuyệt đối không làm.
// Dùng cho JSON-LD FAQPage và tìm kiếm
function supportAnswerText(item, sp) {
  if (item.points) {
    const points = (item.points || []).map((p) => [p.title && `${p.title}${p.text ? ":" : ""}`, p.text, ...(p.sub || [])].filter(Boolean).join(" "));
    const notes = [item.do && `${sp?.operation?.doTitle || "Nên làm"}: ${item.do}`, item.dont && `${sp?.operation?.dontTitle || "Tuyệt đối không làm"}: ${item.dont}`];
    return [...points, ...notes].filter(Boolean).join(" ");
  }
  return (item.steps || []).map((step) => `${step.title}: ${step.text}`).join(" ");
}

// Các bài hướng dẫn vận hành (support.json → operation), kèm tên bước: dùng chung cho tìm kiếm và JSON-LD
const operationArticles = (sp) => (sp?.operation?.groups || []).flatMap((g) => g.articles.map((a) => ({ ...a, group: `${g.no}. ${g.name}` })));

// Câu kết chung của mô tả sản phẩm: không mang thông tin để tìm, bỏ khỏi dữ liệu tìm kiếm
const DESC_BOILERPLATE = /\s*:?\s*xem hình ảnh, thông số kỹ thuật và nhận báo giá từ Kewaqi Việt Nam\.?|\s*Nhận báo giá từ Kewaqi Việt Nam\.?/gi;

// "2026-01-12 09:00:00" -> "12/01/2026"
function viDate(value) {
  const [y, m, d] = String(value || "").slice(0, 10).split("-");
  return d ? `${d}/${m}/${y}` : "";
}

// Dữ liệu cho assets/js/search.js (routes/search-index.njk -> /<lang>/search/index.json). Khoá viết tắt cho file nhẹ:
// t = tiêu đề, u = URL, i = ảnh, m = mã model, c = chuỗi danh mục, k = chữ phụ để so khớp (mô tả, tóm tắt, dấu hiệu),
// d = ngày đăng, n = số sản phẩm. Sản phẩm / bài mới nhất đứng trước (thứ tự khi điểm khớp bằng nhau).
function searchIndex(lang, products, news, support) {
  const ofLang = (items) => (items || []).filter((item) => item.data.lang === lang).sort(byIdDesc);
  const catNames = (id) => catPath(id).slice(1).map((cat) => cat.name); // bỏ danh mục gốc "Sản phẩm"
  return {
    products: ofLang(products).map((item) => ({
      t: item.data.title,
      m: item.data.model || "",
      u: item.url,
      i: item.data.thumb || "",
      c: catNames(item.data.categoryId).join(" › "),
      k: plainText(item.data.description).replace(DESC_BOILERPLATE, "").replace(/^Kewaqi\s+/i, ""),
    })),
    categories: productCats(lang, products).map((cat) => ({ t: cat.path.join(" › "), u: cat.url, n: cat.count })),
    articles: ofLang(news).map((item) => ({
      t: item.data.title,
      u: item.url,
      d: viDate(item.data.published),
      k: plainText(item.data.excerpt || item.data.description),
    })),
    // Câu hỏi thường gặp (k = khối "Dấu hiệu") rồi các bài hướng dẫn vận hành (k = tên bước + toàn bộ nội dung)
    faq: [
      ...((support && support.items) || []).map((item) => ({ t: item.question, u: `${langHome(lang)}support/#${item.id}`, k: (item.info || []).join(" ") })),
      ...operationArticles(support).map((a) => ({ t: a.title, u: `${langHome(lang)}support/#${a.id}`, k: `${a.group} ${supportAnswerText(a, support)}` })),
    ],
  };
}

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  // File phải nằm đúng ở gốc site, chép nguyên văn (vd. file xác minh Google Search Console google….html)
  eleventyConfig.addPassthroughCopy({ "src/static": "/" });
  eleventyConfig.ignores.add("src/static/**");

  eleventyConfig.addFilter("langHome", langHome);
  // Hàm: Eleventy tính lại mỗi lần build (kể cả khi npm start tự build lại sau khi sửa CSS / JS)
  eleventyConfig.addGlobalData("assetVersion", assetVersion);

  // ---- Danh mục ----
  eleventyConfig.addFilter("category", (id) => catById.get(Number(id)));
  eleventyConfig.addFilter("catPath", catPath);
  eleventyConfig.addFilter("catPathIds", (id) => (id ? catPath(id).map((cat) => cat.id) : []));
  eleventyConfig.addFilter("subCats", subCats);
  eleventyConfig.addFilter("topCats", (lang) => categories.filter((cat) => cat.lang === lang && !cat.parentId).sort(byOrder));
  // type: "products" | "news" | "about" | "service" | "contact"
  eleventyConfig.addFilter("sectionRoot", (lang, type) =>
    categories.find((cat) => cat.lang === lang && cat.type === type && !cat.parentId));
  // Danh mục không có banner thì dùng banner của danh mục cha gần nhất
  eleventyConfig.addFilter("catBanner", (id) => catPath(id).reverse().find((cat) => cat.banner) || {});

  // ---- Lọc, sắp xếp sản phẩm / tin ----
  eleventyConfig.addFilter("byLang", (items, lang) => (items || []).filter((item) => item.data.lang === lang));
  eleventyConfig.addFilter("pickByIds", (items, ids) =>
    (ids || []).map((id) => (items || []).find((item) => item.data.id === id)).filter(Boolean));
  eleventyConfig.addFilter("latest", (items, n) => [...(items || [])].sort(byIdDesc).slice(0, n));
  eleventyConfig.addFilter("relatedProducts", relatedProducts);

  // ---- Tìm kiếm ----
  eleventyConfig.addFilter("productCats", productCats);
  eleventyConfig.addFilter("searchIndex", searchIndex);

  // ---- SEO ----
  eleventyConfig.addFilter("absUrl", absUrl);
  eleventyConfig.addFilter("metaDescription", metaDescription);
  // Ảnh đầu tiên trong một đoạn HTML (ảnh chia sẻ của tin tức)
  eleventyConfig.addFilter("firstImage", (html) => (String(html || "").match(/<img\b[^>]*\bsrc="([^"]+)"/i) || [])[1]);
  // "2024-01-14 09:15:00" -> "2024-01-14T09:15:00+07:00" (giờ Việt Nam)
  eleventyConfig.addFilter("isoDate", (value) => String(value || "").trim().replace(" ", "T") + "+07:00");
  // Link mạng xã hội đã điền thật (bỏ "#"); không có thì undefined để JSON-LD bỏ trống trường sameAs
  eleventyConfig.addFilter("externalUrls", (links) => {
    const urls = (links || []).map((link) => link.url).filter((url) => /^https?:\/\//.test(url));
    return urls.length ? urls : undefined;
  });
  // Thẻ <script> JSON-LD; "<" được mã hoá để chuỗi dữ liệu không thể đóng thẻ script
  eleventyConfig.addFilter("jsonLd", (data) =>
    `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`);
  // JSON-LD BreadcrumbList: trang chủ → chuỗi danh mục → trang hiện tại (nếu khác trang danh mục cuối)
  eleventyConfig.addFilter("breadcrumbLd", (categoryId, home, current) => {
    const items = [home, ...catPath(categoryId).map((cat) => ({ name: cat.name, url: cat.url }))];
    if (current && current.url !== items.at(-1).url) items.push(current);
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, item: absUrl(item.url) })),
    };
  });
  // JSON-LD FAQPage của trang Hỗ trợ (_data/support.json): câu hỏi thường gặp + các bài hướng dẫn vận hành, câu trả lời dạng văn bản thuần
  eleventyConfig.addFilter("faqLd", (items, sp) => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [...(items || []), ...operationArticles(sp)].map((item) => ({
      "@type": "Question",
      name: item.question || item.title,
      acceptedAnswer: { "@type": "Answer", text: supportAnswerText(item, sp) },
    })),
  }));
  // Ảnh trong phần nội dung nằm dưới màn hình đầu tiên: để trình duyệt chỉ tải khi cuộn tới
  eleventyConfig.addFilter("lazyImages", (html) =>
    String(html || "").replace(/<img\b(?![^>]*\bloading=)/gi, '<img loading="lazy" decoding="async"'));
  // Trang đưa vào sitemap.xml: bỏ trang noindex và trang danh mục chưa có sản phẩm / bài viết
  eleventyConfig.addFilter("sitemapPages", (items) =>
    (items || []).filter((item) => item.outputPath?.endsWith(".html") && !item.data.noindex && item.data.listPage?.items.length !== 0)
      .sort((a, b) => a.url.localeCompare(b.url)));

  // Ảnh không có alt, hoặc alt chỉ là tên file (HTML lấy từ CMS cũ, vd. alt="20250305211318702.jpg"),
  // được gán alt = nội dung thẻ <h1> của trang. Ảnh trang trí trong template khai báo alt="" nên không bị đổi.
  eleventyConfig.addTransform("imageAlts", function (html) {
    if (!this.page.outputPath?.endsWith(".html")) return html;
    const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
    const alt = h1 ? h1[1].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().replace(/"/g, "&quot;") : "";
    if (!alt) return html;
    return html.replace(/<img\b[^>]*>/gi, (tag) => {
      const current = tag.match(/\salt\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
      if (!current) return tag.replace(/^<img\b/i, `<img alt="${alt}"`);
      const value = (current[1] ?? current[2]).trim();
      return /^[^/\\]+\.(jpe?g|png|gif|webp|bmp)$/i.test(value) ? tag.replace(current[0], ` alt="${alt}"`) : tag;
    });
  });

  // Một dòng của dist/_redirects (cú pháp Cloudflare Workers / Pages), vd.
  // "/vi/products/eath-boing-machin-ground-dill/" -> "/vi/products/eath-boing-machin-ground-dill/  /products/earth-auger-ground-drill/  301"
  eleventyConfig.addFilter("redirectRule", (oldUrl, target) => {
    // _redirects của Cloudflare không so khớp query string: bỏ qua URL dạng /index.php?ac=…&did=… của CMS cũ
    // (vẫn giữ trong redirects.json; chỉ cần khi site chạy trên tên miền cũ — lúc đó phải xử lý bằng code Worker)
    if (oldUrl.includes("?")) return "";
    // Bỏ "/" (trang chủ, không chuyển hướng) và quy tắc trỏ về chính nó
    if (oldUrl === "/" || oldUrl === target) return "";
    return `${oldUrl}  ${target}  301`;
  });

  // Một quy tắc mod_rewrite của dist/.htaccess (hosting cPanel / Apache / LiteSpeed không đọc _redirects), vd.
  // "/en/products/" -> "RewriteRule ^en/products/?$ /products/ [R=301,L]"
  // Khác _redirects: so khớp được query string, nên URL /index.php?ac=…&did=… của CMS cũ cũng được chuyển hướng
  eleventyConfig.addFilter("htaccessRule", (oldUrl, target) => {
    if (oldUrl === "/" || oldUrl === target) return "";
    const esc = (s) => s.replace(/[.*+?^$()[\]{}|\\]/g, "\\$&");
    const [path, query] = oldUrl.split("?");
    const pattern = `^${esc(path.replace(/^\//, "").replace(/\/$/, ""))}${path.endsWith("/") ? "/?" : ""}$`;
    if (query === undefined) return `RewriteRule ${pattern} ${target} [R=301,L]`;
    // Dấu "?" cuối đích: bỏ query string cũ khỏi URL mới
    return `RewriteCond %{QUERY_STRING} ^${esc(query)}$\nRewriteRule ${pattern} ${target}? [R=301,L]`;
  });

  // Mỗi phần tử là một trang danh sách (routes/lists.njk): danh mục + các mục hiển thị trên trang đó
  eleventyConfig.addCollection("categoryPages", (api) => {
    const pages = [];
    for (const cat of categories.filter((c) => c.type === "products" || c.type === "news")) {
      const tag = cat.type === "products" ? "product" : "news";
      const perPage = cat.type === "products" ? PRODUCTS_PER_PAGE : NEWS_PER_PAGE;
      const ids = new Set(descendantIds(cat.id));
      const items = api.getFilteredByTag(tag)
        .filter((item) => item.data.lang === cat.lang && ids.has(item.data.categoryId))
        .sort(byIdDesc);
      const total = Math.max(1, Math.ceil(items.length / perPage));
      const urls = Array.from({ length: total }, (_, i) => (i === 0 ? cat.url : `${cat.url}page/${i + 1}/`));
      for (let i = 0; i < total; i++) {
        pages.push({ cat, items: items.slice(i * perPage, (i + 1) * perPage), page: i + 1, total, urls, url: urls[i] });
      }
    }
    return pages;
  });

  return {
    dir: { input: "src", output: "dist", includes: "_includes", layouts: "_includes/layouts", data: "_data" },
    templateFormats: ["html", "njk"],
    // File .html trong content/ là HTML lấy từ CMS cũ: xuất nguyên văn, không chạy qua Nunjucks
    htmlTemplateEngine: false,
  };
}
