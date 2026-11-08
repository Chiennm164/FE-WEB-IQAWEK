// URL suy ra từ vị trí file, không cần khai báo permalink trong từng file.
// Ngôn ngữ mặc định (site.defaultLang = vi) không có tiền tố ngôn ngữ trong URL:
//   content/vi/index.html              -> /
//   content/vi/products/c558.html      -> /product/c558/
//   content/vi/news/<slug>.html        -> /article/<slug>/
//   content/vi/pages/about-kewaqi.html -> /about-kewaqi/
// Ngôn ngữ khác (nếu thêm sau này, vd. content/en/) giữ tiền tố: /en/product/c558/
const ROUTE = { products: "product", news: "article", pages: "" };

export default {
  eleventyComputed: {
    permalink(data) {
      const m = data.page.inputPath.match(/content\/([a-z]{2})\/(?:(products|news|pages)\/)?([^/]+)\.html$/);
      // File không theo mẫu trên thì giữ permalink tự khai báo
      if (!m) return data.permalink;
      const [, lang, folder, slug] = m;
      const home = lang === data.site.defaultLang ? "/" : `/${lang}/`;
      if (!folder) return home;
      return ROUTE[folder] ? `${home}${ROUTE[folder]}/${slug}/` : `${home}${slug}/`;
    },
  },
};
