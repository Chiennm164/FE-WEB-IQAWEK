import fs from "node:fs";

// Chỉ đọc một lần khi nạp cấu hình: đang chạy `npm start` mà sửa categories.json
// thì phải khởi động lại server, nếu không menu và trang danh mục vẫn dùng dữ liệu cũ.
const categories = JSON.parse(fs.readFileSync("src/_data/categories.json", "utf8"));
const catById = new Map(categories.map((cat) => [cat.id, cat]));

const PRODUCTS_PER_PAGE = 12;
const NEWS_PER_PAGE = 10;

const byOrder = (a, b) => a.order - b.order;
const byIdDesc = (a, b) => b.data.id - a.data.id;

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
  // Gồm cả các mục thuộc danh mục con cháu
  eleventyConfig.addFilter("inCategory", (items, id) => {
    const ids = new Set(descendantIds(id));
    return (items || []).filter((item) => ids.has(item.data.categoryId));
  });
  eleventyConfig.addFilter("pickByIds", (items, ids) =>
    (ids || []).map((id) => (items || []).find((item) => item.data.id === id)).filter(Boolean));
  eleventyConfig.addFilter("latest", (items, n) => [...(items || [])].sort(byIdDesc).slice(0, n));
  // Bài trước / sau theo id tăng dần (như CMS cũ); items phải lọc sẵn theo ngôn ngữ
  eleventyConfig.addFilter("prevNext", (items, id) => {
    const sorted = [...(items || [])].sort((a, b) => a.data.id - b.data.id);
    const i = sorted.findIndex((item) => item.data.id === id);
    return { prev: sorted[i - 1], next: sorted[i + 1] };
  });

  // Một dòng của dist/_redirects (cú pháp Netlify), vd.
  // "/index.php?ac=Article&at=Read&did=154" -> "/index.php  did=154  /cn/product/c558/  301!"
  eleventyConfig.addFilter("redirectRule", (oldUrl, target) => {
    const [path, query] = oldUrl.split("?");
    // Bỏ "/" (đã do routes/index.njk xử lý) và quy tắc trỏ về chính nó
    if (path === "/" || path === target) return "";
    const param = (query || "").match(/\b(did|tid)=\d+/);
    return param ? `${path}  ${param[0]}  ${target}  301!` : `${path}  ${target}  301!`;
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
