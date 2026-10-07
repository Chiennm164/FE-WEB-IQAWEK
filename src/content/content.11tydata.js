// URL suy ra từ vị trí file, không cần khai báo permalink trong từng file:
//   content/vi/index.html              -> /vi/
//   content/vi/products/c558.html      -> /vi/product/c558/
//   content/vi/news/<slug>.html        -> /vi/article/<slug>/
//   content/vi/pages/about-kewaqi.html -> /vi/about-kewaqi/
const ROUTE = { products: "product", news: "article", pages: "" };

export default {
  eleventyComputed: {
    permalink(data) {
      const m = data.page.inputPath.match(/content\/(vi|en)\/(?:(products|news|pages)\/)?([^/]+)\.html$/);
      // File không theo mẫu trên thì giữ permalink tự khai báo
      if (!m) return data.permalink;
      const [, lang, folder, slug] = m;
      if (!folder) return `/${lang}/`;
      return ROUTE[folder] ? `/${lang}/${ROUTE[folder]}/${slug}/` : `/${lang}/${slug}/`;
    },
  },
};
