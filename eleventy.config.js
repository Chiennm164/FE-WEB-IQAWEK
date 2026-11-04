import fs from "node:fs";

// Chỉ đọc một lần khi nạp cấu hình: đang chạy `npm start` mà sửa categories.json
// thì phải khởi động lại server, nếu không menu và trang danh mục vẫn dùng dữ liệu cũ.
const categories = JSON.parse(fs.readFileSync("src/_data/categories.json", "utf8"));
const catById = new Map(categories.map((cat) => [cat.id, cat]));
const siteUrl = JSON.parse(fs.readFileSync("src/_data/site.json", "utf8")).url;

const PRODUCTS_PER_PAGE = 12;
const NEWS_PER_PAGE = 4;

const byOrder = (a, b) => a.order - b.order;
const byIdDesc = (a, b) => b.data.id - a.data.id;

// "/vi/" -> "https://www.kewaqi.com/vi/" (canonical, hreflang, og:image, sitemap, JSON-LD cần URL đầy đủ)
const absUrl = (url) => (Array.isArray(url) ? url.map(absUrl) : url && url.startsWith("/") ? siteUrl + url : url);

const ENTITIES = { "&amp;": "&", "&quot;": '"', "&#39;": "'", "&lt;": "<", "&gt;": ">", "&nbsp;": " " };

// Văn bản thuần cho thẻ meta description: bỏ thẻ HTML, gộp khoảng trắng,
// quá max ký tự thì cắt ở ranh giới từ và thêm "…" (Google chỉ hiện khoảng 150–160 ký tự)
function metaDescription(text, max = 160) {
  const clean = String(text || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(amp|quot|#39|lt|gt|nbsp);/g, (m) => ENTITIES[m])
    .replace(/\s+/g, " ")
    .trim();
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

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });

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
  // Bài trước / sau theo id tăng dần (như CMS cũ); items phải lọc sẵn theo ngôn ngữ
  eleventyConfig.addFilter("prevNext", (items, id) => {
    const sorted = [...(items || [])].sort((a, b) => a.data.id - b.data.id);
    const i = sorted.findIndex((item) => item.data.id === id);
    return { prev: sorted[i - 1], next: sorted[i + 1] };
  });

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
  // JSON-LD FAQPage của trang Hỗ trợ (_data/support.json): câu trả lời là các bước, dạng văn bản thuần
  eleventyConfig.addFilter("faqLd", (items) => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: (items || []).map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.steps.map((step) => `${step.title}: ${step.text}`).join(" ") },
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
  // "/vi/products/eath-boing-machin-ground-dill/" -> "/vi/products/eath-boing-machin-ground-dill/  /vi/products/earth-auger-ground-drill/  301"
  eleventyConfig.addFilter("redirectRule", (oldUrl, target) => {
    // _redirects của Cloudflare không so khớp query string: bỏ qua URL dạng /index.php?ac=…&did=… của CMS cũ
    // (vẫn giữ trong redirects.json; chỉ cần khi site chạy trên tên miền cũ — lúc đó phải xử lý bằng code Worker)
    if (oldUrl.includes("?")) return "";
    // Bỏ "/" (đã có quy tắc riêng ở đầu routes/_redirects.njk) và quy tắc trỏ về chính nó
    if (oldUrl === "/" || oldUrl === target) return "";
    return `${oldUrl}  ${target}  301`;
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
