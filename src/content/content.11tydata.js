// URL suy ra từ vị trí file, không cần khai báo permalink trong từng file:
//   content/cn/index.html              -> /cn/
//   content/cn/products/c558.html      -> /cn/product/c558/
//   content/cn/news/<slug>.html        -> /cn/article/<slug>/
//   content/cn/pages/about-kewaqi.html -> /cn/about-kewaqi/
const ROUTE = { products: "product", news: "article", pages: "" };

export default {
  eleventyComputed: {
    permalink(data) {
      const m = data.page.inputPath.match(/content\/(cn|en)\/(?:(products|news|pages)\/)?([^/]+)\.html$/);
      // File không theo mẫu trên thì giữ permalink tự khai báo
      if (!m) return data.permalink;
      const [, lang, folder, slug] = m;
      if (!folder) return `/${lang}/`;
      return ROUTE[folder] ? `/${lang}/${ROUTE[folder]}/${slug}/` : `/${lang}/${slug}/`;
    },
  },
};
