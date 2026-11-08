# Kewaqi — website doanh nghiệp tĩnh (dự án mẫu)

Website **tiếng Việt** của Kewaqi Việt Nam (nhà phân phối máy làm vườn Kewaqi tại Việt Nam, trụ sở Thái Nguyên), chuyển từ CMS PHP (ESPCMS) sang **site tĩnh** dựng bằng [Eleventy](https://www.11ty.dev/). Bản tiếng Trung của site gốc đã được thay bằng bản tiếng Việt; bản tiếng Anh đã bỏ (URL `/en/…` cũ chuyển hướng 301 sang trang tiếng Việt tương ứng).
Giao diện gốc được giữ nguyên; nội dung (sản phẩm, tin tức, danh mục, chữ giao diện) được tách thành dữ liệu, ghép với template khi build.

Dùng làm dự án mẫu cho: site giới thiệu doanh nghiệp đa ngôn ngữ, chuyển đổi site CMS cũ sang site tĩnh mà không đổi giao diện.

## Mục lục

1. [Công nghệ](#1-công-nghệ)
2. [Bắt đầu nhanh](#2-bắt-đầu-nhanh)
3. [Cấu trúc thư mục](#3-cấu-trúc-thư-mục)
4. [Cách site được dựng](#4-cách-site-được-dựng)
5. [Hướng dẫn quản lý nội dung](#5-hướng-dẫn-quản-lý-nội-dung)
6. [Tham khảo template](#6-tham-khảo-template)
7. [Kiểm tra và triển khai](#7-kiểm-tra-và-triển-khai)
8. [Quy ước](#8-quy-ước)
9. [Giới hạn đã biết](#9-giới-hạn-đã-biết)

---

## 1. Công nghệ

| Lớp | Công nghệ | Ghi chú |
|---|---|---|
| Build | **Eleventy 3** trên **Node.js ≥ 18** | Đang dùng Node 24. Đọc dữ liệu + template, xuất HTML tĩnh ra `dist/` |
| Template | **Nunjucks** (`.njk`) | Layout kế thừa (`extends`), macro dùng chung |
| Dữ liệu | **JSON** (`src/_data/`) + **YAML front matter** | Danh mục, chữ giao diện, thông tin từng sản phẩm / tin |
| Nội dung | HTML | Phần mô tả, bảng thông số — giữ từ CMS cũ |
| Giao diện | jQuery 1.11.1, Swiper 5.2.1, WOW.js 0.1.6, Animate.css, lightGallery 1.6.4 | Giữ từ template của site cũ. `animate.css` đã rút gọn, chỉ còn các hiệu ứng site dùng (`fadeIn`, `fadeInUp/Down/Left/Right`, `bounceIn`) — cần hiệu ứng khác thì lấy thêm từ bản gốc |
| Font | **Montserrat** (bản variable, có subset tiếng Việt) cho toàn site — tự host trong `assets/fonts/`, giấy phép SIL OFL | Khai báo `@font-face` ở đầu `reset.css` dưới tên cũ `Fontstyle1/2/3` (Fontstyle1 = chữ thường, Fontstyle2 = tiêu đề 700, Fontstyle3 = tiêu đề phụ 400); tiêu đề có `size-adjust: 82%` vì Montserrat rộng hơn font cũ (Barlow Condensed). CSS dùng qua biến `--font-body` / `--font-heading` / `--font-sub` (`:root` trong `reset.css`, đã kèm dự phòng `Arial, sans-serif`), không viết `font-family: 'FontstyleN'` trực tiếp; `base.njk` preload 3 file font |

Host **không cần** Node, PHP hay cơ sở dữ liệu — chỉ phục vụ file tĩnh trong `dist/`.

## 2. Bắt đầu nhanh

```sh
npm install      # cài thư viện (lần đầu, hoặc khi chưa có node_modules/)
npm start        # chạy thử tại http://localhost:8080 — tự build lại khi sửa file trong src/
```

| Lệnh | Tác dụng |
|---|---|
| `npm start` | Server chạy thử, tự tải lại khi sửa file |
| `npm run build` | Build ra `dist/` để đưa lên host |
| `npm run check` | Kiểm tra link / ảnh nội bộ hỏng trong `dist/` (chạy sau `build`) |
| `npm run images` | Nén ảnh trong `src/assets/` tại chỗ (chạy sau khi thêm ảnh mới, xem mục 5.8) |
| `npm run clean` | Xoá `dist/` |

Trang để thử: `/` (trang chủ), `/products/`, `/product/c558/`, `/about-kewaqi/`, `/support/`, `/search/?q=may cat co` (hoặc bấm icon kính lúp ở header và gõ thử).

> Không mở trực tiếp file `dist/*.html` trong trình duyệt: site dùng đường dẫn tuyệt đối (`/assets/…`, `/product/…`) nên phải xem qua server.

## 3. Cấu trúc thư mục

```
├── eleventy.config.js            # cấu hình build, filter danh mục + SEO + tìm kiếm + sản phẩm liên quan, collection chia trang
├── package.json                  # lệnh npm + phiên bản Eleventy
├── wrangler.jsonc                # cấu hình deploy Cloudflare Workers (tên Worker, thư mục dist/)
├── tools/
│   ├── check-links.mjs           # kiểm tra link / ảnh hỏng trong dist/
│   └── optimize-images.mjs       # nén ảnh trong src/assets/ (npm run images)
└── src/                          # toàn bộ mã nguồn (Eleventy đọc từ đây)
    ├── _data/                    # dữ liệu dùng chung, mọi template đều đọc được
    │   ├── site.json             #   cấu hình chung + chữ giao diện
    │   ├── categories.json       #   cây danh mục: menu, banner, URL
    │   ├── hot.json              #   id sản phẩm "hot" ở sidebar
    │   ├── support.json          #   trang Hỗ trợ: chữ giao diện + câu hỏi thường gặp
    │   └── redirects.json        #   URL cũ (index.php?…, slug đã đổi) → URL mới
    ├── _includes/
    │   ├── layouts/              # bố cục trang
    │   │   ├── base.njk          #   khung chung: <head>, header, menu, footer, script
    │   │   ├── home.njk          #   trang chủ
    │   │   ├── page.njk          #   trang tĩnh (giới thiệu, dịch vụ)
    │   │   ├── support.njk       #   trang Hỗ trợ (câu hỏi thường gặp, dữ liệu từ support.json)
    │   │   ├── product.njk       #   chi tiết sản phẩm
    │   │   └── news.njk          #   chi tiết tin tức
    │   └── partials/
    │       ├── ui.njk            # macro: banner, breadcrumb, sidebar, phân trang, chip danh mục (tìm kiếm)
    │       ├── seo.njk           # thẻ SEO trong <head>: canonical, Open Graph, JSON-LD
    │       └── zalo-chat.njk     # nút chat Zalo nổi góc phải dưới (mã QR + hotline)
    ├── content/                  # nội dung — mỗi file là một trang
    │   ├── content.11tydata.js   #   tính URL từ vị trí file
    │   └── vi/                   #   nội dung tiếng Việt
    │       ├── vi.json           #     gán ngôn ngữ cho mọi file bên trong
    │       ├── index.html        #     trang chủ
    │       ├── products/         #     sản phẩm (products.json: layout + tag)
    │       ├── news/             #     tin tức (news.json)
    │       └── pages/            #     giới thiệu, dịch vụ, hỗ trợ (pages.json)
    ├── routes/                   # trang sinh ra từ dữ liệu, không có file nội dung riêng
    │   ├── lists.njk             #   trang danh mục sản phẩm / tin (có chia trang)
    │   ├── search.njk            #   trang kết quả tìm kiếm /search/?q=…
    │   ├── search-index.njk      #   /search/index.json: dữ liệu cho ô tìm kiếm + trang kết quả
    │   ├── sitemap.njk           #   /sitemap.xml cho Google / Bing
    │   ├── robots.njk            #   /robots.txt (trỏ tới sitemap)
    │   ├── _redirects.njk        #   chuyển hướng 301 từ URL cũ (định dạng Cloudflare)
    │   └── htaccess.njk          #   cùng các chuyển hướng đó cho hosting Apache / LiteSpeed (cPanel)
    └── assets/                   # chép nguyên sang dist/assets/
        ├── css/                  #   animate, swiper, reset, main (trang con), index (trang chủ), support (trang Hỗ trợ), lightGallery
        ├── js/                   #   jquery, swiper, wow, lightGallery, main, search (tìm kiếm), support (trang Hỗ trợ)
        ├── fonts/                #   font chữ giao diện + font icon của lightGallery
        ├── iconfont/             #   iconfont-common (mọi trang), -pages (trang con)
        ├── images/               #   ảnh giao diện: logo, nền, icon, footer
        └── media/                #   ảnh nội dung: sản phẩm, tin, trang chủ… (xem mục 5.8)
```

Không đưa vào git: `node_modules/`, `dist/` (xem `.gitignore`).

## 4. Cách site được dựng

```
src/_data/*.json  ──┐
src/content/**    ──┼──►  Eleventy + Nunjucks  ──►  dist/   (HTML tĩnh)
src/_includes/**  ──┤                                ▲
src/routes/*.njk  ──┘     src/assets/**  ────────────┘  (chép nguyên)
```

### 4.1 Vị trí file quyết định ngôn ngữ, layout và URL

Không cần khai báo `lang`, `layout`, `permalink` trong từng file nội dung:

| File | Layout | URL |
|---|---|---|
| `content/vi/index.html` | `home.njk` (khai báo trong file) | `/` |
| `content/vi/products/c558.html` | `product.njk` | `/product/c558/` |
| `content/vi/news/<slug>.html` | `news.njk` | `/article/<slug>/` |
| `content/vi/pages/service.html` | `page.njk` | `/service/` |

- Ngôn ngữ: từ `vi.json`. Layout: từ `products.json`, `news.json`, `pages.json` trong từng thư mục; hai file đầu còn gắn tag `product` / `news` để tạo collection.
- URL: tính trong `content/content.11tydata.js` theo tên file. Ngôn ngữ mặc định (`site.defaultLang` = `vi`) **không có tiền tố ngôn ngữ** trong URL (`/product/c558/`, không phải `/vi/product/c558/`); URL cũ dạng `/vi/…` chuyển 301 sang URL mới (mục 5.10). Ngôn ngữ khác nếu thêm sau này giữ tiền tố (`/en/product/c558/`). Trong template, URL ghép từ filter `langHome` (`{{ lang | langHome }}search/`), không viết `/{{ lang }}/`.
- File nội dung `.html` là **HTML thuần** (cấu hình `htmlTemplateEngine: false`) — không dùng được cú pháp Nunjucks `{{ }}` / `{% %}` bên trong.

### 4.2 Trang sinh từ dữ liệu (`src/routes/`)

| Template | Sinh ra | Nguồn dữ liệu |
|---|---|---|
| `lists.njk` | Trang danh mục, mỗi danh mục kiểu `products` / `news` một trang (kèm danh mục con cháu). Chia trang: 12 sản phẩm / 4 tin (lưới 2×2) mỗi trang; trang 2 trở đi ở `<url danh mục>page/2/`. Danh mục chưa có sản phẩm / bài viết hiện câu thông báo (`product.empty` / `news.empty` trong `site.json`), gắn `noindex` và không vào sitemap | collection `categoryPages` trong `eleventy.config.js` |
| `search.njk` | `/search/?q=…` — trang kết quả tìm kiếm; kết quả tính ở trình duyệt bằng `assets/js/search.js` (mục 4.4). Gắn `noindex` | `/search/index.json` |
| `search-index.njk` | `/search/index.json` — dữ liệu tìm kiếm: sản phẩm, danh mục có sản phẩm, bài viết, câu hỏi thường gặp | filter `searchIndex` (collection `product`, `news`, `support.json`) |
| `sitemap.njk` | `/sitemap.xml` — mọi trang HTML trừ trang có `noindex`; tin tức kèm `<lastmod>` lấy từ `published` | `collections.all` |
| `robots.njk` | `/robots.txt` — cho phép mọi bot, trỏ tới sitemap | `site.json` |
| `_redirects.njk` | `dist/_redirects`: các quy tắc trong `redirects.json`, rồi `/vi/*` → `/*` (bỏ tiền tố ngôn ngữ cũ) và `/en/*` → `/` | `redirects.json` |
| `htaccess.njk` | `dist/.htaccess`: cùng các chuyển hướng đó cho hosting Apache / LiteSpeed (mục 5.10) | `redirects.json` |

### 4.3 Quy tắc chung

- **Sắp xếp:** sản phẩm / tin trong danh mục và "tin mới nhất" xếp theo `id` **giảm dần** (id lớn đứng trước). "Sản phẩm liên quan" và tìm kiếm xếp theo độ liên quan; bằng điểm thì id lớn đứng trước.
- **Sản phẩm liên quan** (trang chi tiết sản phẩm, filter `relatedProducts`): 8 sản phẩm, không gồm chính sản phẩm đang xem. Cộng điểm khi cùng mã `model` (biến thể của cùng máy, vd. G43 đeo vai / G43 đeo lưng: +5), cùng danh mục (+4), cùng nhóm máy chính (+2). Nhóm ít sản phẩm (vd. Máy cưa xích chỉ có C558) thì phần còn thiếu là sản phẩm mới nhất của nhóm khác.
- **Menu:** header và footer lấy các danh mục gốc (`parentId: null`) của ngôn ngữ, xếp theo `order`; menu thả xuống hiện một cấp con. Sidebar sản phẩm hiện hai cấp dưới danh mục gốc `products`; trang tin tức (danh sách và chi tiết) không có sidebar.
- **Tiêu đề trang (`<title>`):** `<tên trang> | <site.brand>`, vd. `6503 Máy tỉa hàng rào hai lưỡi | Kewaqi`. Sản phẩm chỉ có mã model (`C558`) hoặc trùng tên danh mục thì thêm nhóm sản phẩm: `C558 – Máy cưa xích | Kewaqi`; trang danh sách từ trang 2 thêm `– Trang 2`. Trang chủ dùng nguyên `meta.siteTitle`.
- **Meta description:** trường `description` trong front matter (sản phẩm, tin, trang tĩnh); trang danh sách theo mẫu `meta.listDescription`; còn lại `meta.description`. Bộ lọc `metaDescription` bỏ thẻ HTML và cắt ở ranh giới từ cho vừa 160 ký tự.
- **SEO trong `<head>`** (`partials/seo.njk`): `canonical` (URL đầy đủ theo `site.url`), Open Graph + Twitter Card (ảnh chia sẻ: ảnh sản phẩm → ảnh đầu bài tin → banner danh mục → `site.ogImage`), JSON-LD schema.org: `Organization` + `WebSite` ở trang chủ, `BreadcrumbList` ở trang con, `Product` ở trang sản phẩm, `NewsArticle` ở trang tin. Tiêu đề trang con: `<tên trang> | Kewaqi Việt Nam` (`meta.company`, phân biệt với site nhà máy kewaqi.com). Trang có `noindex: true` trong front matter: thẻ `robots noindex`, không canonical, không vào sitemap.
- **Thẻ tiêu đề:** mỗi trang đúng một `<h1>` — tên sản phẩm / tiêu đề tin / tên danh mục; trang không có tiêu đề hiển thị (trang chủ) dùng H1 ẩn `class="visually-hidden"`. Kiểu chữ của các khối dùng h1–h4 trong template cũ đã chuyển sang class `.h1`–`.h4` (`reset.css` + selector trong `main.css` / `index.css`), nên có thể đổi thẻ (`h2`, `h3`, `div`, `p`) theo đúng cấp tiêu đề mà giao diện không đổi.
- **Ảnh:** transform `imageAlts` gán alt = nội dung `<h1>` cho ảnh thiếu alt hoặc alt chỉ là tên file; ảnh trang trí khai báo `alt=""`. Ảnh dưới màn hình đầu tiên có `loading="lazy"` (filter `lazyImages` cho phần nội dung sản phẩm / tin); ảnh trong slider Swiper giữ tải ngay để không bị trống khi chuyển slide.
- **Script:** jQuery, Swiper, WOW, `main.js`, `search.js` nạp ở cuối `<body>` để không chặn hiển thị; mọi script inline (`inlineScript`, block `scripts`) chạy sau chúng.
- **Phiên bản file CSS / JS:** mọi link CSS / JS trong `base.njk` (kể cả `css` / `js` khai báo trong front matter) có đuôi `?v={{ assetVersion }}` — 8 ký tự hash nội dung các file trong `assets/css`, `assets/iconfont`, `assets/js` (global data trong `eleventy.config.js`). Sửa CSS / JS thì số đổi, trình duyệt tự tải bản mới thay vì dùng bản cũ đã lưu (`.htaccess` cho giữ CSS / JS 1 tháng). Thêm file CSS / JS mới vào template thì cũng gắn đuôi này.
- **CSS theo trang:** trang chủ dùng `index.css`; trang khác dùng `main.css` + `iconfont-pages.css`; trang Hỗ trợ thêm `support.css` (mọi class có tiền tố `sp-`, không ảnh hưởng CSS chung).
- **Biến giao diện chung:** `:root` ở đầu `reset.css` khai báo:
  - màu (`--c-primary`, `--c-ink`, `--c-text`, `--c-muted`, `--c-line`, `--c-soft`…);
  - khoảng cách khối (`--section-top` / `--section-bottom` cho trang con, `--home-gap` cho trang chủ; tự đổi sang % ở màn ≤ 1280px; riêng `--home-gap` ở điện thoại cố định 40px);
  - bo góc: site theo **kiểu phẳng, vuông góc** nên `--radius-sm` / `--radius` = 0 (icon tròn dùng `50%`; riêng khung chat Zalo `.zchat` tự đặt lại hai biến này để giữ bo tròn);
  - thang cỡ chữ tiêu đề, tự thu nhỏ theo breakpoint: `--fs-hero` (H1 trên banner trang con), `--fs-h2` (tiêu đề khối lớn: trang chủ, khối nền ảnh), `--fs-h3` (tiêu đề mục trang con: Dịch vụ, Hỏi đáp, tiêu đề bài viết), `--fs-h4` (tên sản phẩm, tiêu đề cột), `--fs-label` (chữ trên thanh tiêu đề nền cam);
  - kích thước nút `--btn-h`, `--btn-px`, `--btn-fs`.

  Cả 4 file CSS dùng các biến này; đổi tông màu, cỡ chữ hay khoảng cách toàn site chỉ cần sửa ở đó.
- **Nút chung:** mọi nút hành động (Xem thêm sản phẩm, Xem chi tiết, Gọi hotline, Tìm kiếm…) dùng chung một quy tắc "Nút chung" ở đầu `reset.css`: nền cam, chữ trắng, vuông góc, hover cam đậm. Nút phụ viền cam, nền trắng ("Quay lại danh sách"). Thêm nút mới thì thêm selector vào danh sách đó; `main.css` / `index.css` / `support.css` chỉ giữ phần riêng (vị trí, bề rộng), không đặt lại màu, cỡ chữ, lề của nút.
- **Thẻ (sản phẩm, tin, cảm nhận khách hàng) luôn thẳng hàng** dù chữ dài ngắn khác nhau:
  - các thẻ trong một hàng cao bằng nhau (flex / grid giãn; slide Swiper đặt `height: auto`);
  - chữ thay đổi độ dài được giữ chỗ cố định: `line-clamp` + `min-height` = số dòng × `line-height` (vd. tên sản phẩm tối đa 2 dòng, luôn chiếm 2 dòng);
  - nút dính đáy thẻ (`margin-top: auto`);
  - khung ảnh có tỉ lệ cố định (`aspect-ratio: 1 / 1` cho ảnh sản phẩm, `16 / 9` cho ảnh tin), để ảnh `loading="lazy"` chưa tải không làm thẻ thấp đi rồi nhảy.
- **Slider (Swiper):**
  - `main.js` đặt mặc định chung `threshold: 8` (`Swiper.extendDefaults`): chuột nhích dưới 8px khi bấm vẫn tính là bấm. Mặc định của Swiper (0px) coi mọi chuyển động là kéo và chặn luôn cú bấm vào link trong slider;
  - không đặt `overflow: hidden` cho `.swiper-wrapper` (thường là `<ul>`): khi trượt sang nhóm sau, cả wrapper dịch đi nên vùng cắt dịch theo và các thẻ của nhóm đó biến mất. Phần thừa đã do `.swiper-container` cắt;
  - không đặt `padding` ngang cho `.swiper-container` (thẻ bên cạnh sẽ lộ ra trong phần lề): cần viền + lề thì bọc slider trong một khối khác, như "Sản phẩm liên quan" (`.box2 .content` > `.swiper-container`).
- **Bố cục trang sản phẩm ở màn ≤ 992px:** một cột, nội dung chính (lưới sản phẩm, chi tiết sản phẩm, kết quả tìm kiếm) đứng trước, khung danh mục + sản phẩm hot xuống dưới. Lưới sản phẩm: 3 cột đến 768px, 2 cột ở điện thoại. Vùng bấm ở điện thoại (nút ☰, nút tìm kiếm, breadcrumb, danh mục, phân trang, link footer) cao tối thiểu khoảng 32–48px.
- **Breakpoint (responsive):** viết kiểu desktop-first (`max-width`), chỉ dùng 3 mốc chuẩn: `1280px` (laptop / tablet ngang, menu ngang thu gọn), `992px` (tablet dọc, menu ngang thu nhỏ), `767px` (điện thoại, chuyển sang menu ☰). Màn > 1280px là desktop (`.wrap` cố định 1280px). Slider Swiper dùng `min-width` nên khai báo mốc lệch 1: `0` / `768` / `993` / `1281`, để slider và bố cục CSS đổi cùng lúc. Chỉ thêm `480px` cho khối cụ thể bị chật ở điện thoại nhỏ. Không thêm mốc khác (`lightGallery.css` là CSS thư viện, giữ nguyên).

### 4.4 Tìm kiếm

**Ô tìm kiếm ở header** (mọi trang; markup `#hsearch` trong `base.njk`, code `assets/js/search.js`, CSS khối "Tìm kiếm ở header" trong `reset.css`):

- Mở bằng icon kính lúp: desktop ở cuối menu, điện thoại ở góc phải header (đối xứng nút ☰). Desktop / máy tính bảng: bảng thả xuống ngay dưới header, phần trang bên dưới phủ mờ. Điện thoại: toàn màn hình.
- Chưa gõ: chip các nhóm máy chính đã có sản phẩm, kèm số sản phẩm (macro `searchChips`), và một dòng gợi ý cách gõ.
- Gõ từ 2 ký tự: gợi ý ngay sản phẩm (tối đa 6, có ảnh, tô màu chữ khớp, kèm link "Xem tất cả N sản phẩm"), danh mục (4), bài viết (3), hỏi đáp (3). Hỏi đáp mở thẳng câu đó ở trang Hỗ trợ (`/support/#cau-hoi-N`). Không có sản phẩm: lời nhắn, chip danh mục và hotline.
- Enter: sang trang kết quả. Esc, nút × hoặc bấm ra ngoài: đóng. ↑ / ↓: đi qua các kết quả. Chưa tải được JS thì form vẫn gửi tới trang kết quả.

**Dữ liệu:** `/search/index.json` (`routes/search-index.njk`, filter `searchIndex`), trình duyệt chỉ tải một lần khi mở ô tìm kiếm lần đầu. Gồm sản phẩm (tên, `model`, ảnh `thumb`, chuỗi danh mục, `description` đã bỏ câu kết chung), danh mục sản phẩm có sản phẩm, bài viết (tên, ngày, `excerpt`), câu hỏi trong `support.json` (câu hỏi, khối "Dấu hiệu"). Sản phẩm, bài viết, câu hỏi mới **tự có trong tìm kiếm** sau khi build, không cần sửa gì thêm.

**Cách so khớp** (giống nhau ở ô tìm kiếm và trang kết quả):

- Mọi từ gõ vào đều phải có mặt, không cần đúng thứ tự. Phải khớp nguyên từ; riêng từ cuối được khớp phần đầu từ khi không có kết quả khớp nguyên từ (đang gõ dở: "khoa" ra "khoan"). Từ có chữ số khớp ở bất kỳ đâu ("26ls" ra G26LS, "42.7cc" ra máy có thông số đó).
- Gõ không dấu thì không phân biệt dấu ("may cat co" = "máy cắt cỏ"). Từ nào gõ có dấu thì so đúng dấu ("cưa" không ra "cửa"); có dấu mà không ra kết quả nào thì tự tìm lại không phân biệt dấu.
- "1" = "một", "2" = "hai" ("tỉa hàng rào 2 lưỡi" ra "… hai lưỡi").
- Tìm trong tên, mã model, chuỗi danh mục trước ("máy cưa xích" ra C558 nhờ danh mục). Chỉ khi không có mục nào khớp mới tìm thêm trong mô tả / tóm tắt, để "cỏ" không ra máy có chữ "động cơ" trong mô tả.
- Xếp hạng: trùng mã model > mã model bắt đầu bằng từ khoá > tên bắt đầu bằng / chứa nguyên cụm từ khoá > số từ có trong tên.

**Trang kết quả** `/search/?q=…` (`routes/search.njk`, CSS khối "Trang kết quả tìm kiếm" trong `main.css`): ô tìm lại, dòng "Tìm thấy N sản phẩm cho …", chip danh mục khớp, lưới sản phẩm (mẫu `<template id="search-card">`, cùng markup thẻ ở trang danh sách), khối "Bài viết và hỏi đáp liên quan". Không có sản phẩm: gợi ý cách gõ, chip danh mục, hotline. Không có `q`: hiện tất cả sản phẩm.

Chữ hiển thị nằm trong `site.json` → `search` (mục 5.7).

## 5. Hướng dẫn quản lý nội dung

Sau mỗi thay đổi: xem lại bằng `npm start`, rồi `npm run build` + `npm run check` trước khi đưa lên host.

### 5.1 Sản phẩm

Mỗi sản phẩm là một file.

1. Tạo `src/content/vi/products/<slug>.html` — `<slug>` thành URL: `/product/<slug>/`.
2. Đặt ảnh vào `src/assets/media/products/<slug tiếng Anh>/` (`thumb.jpg`, `1.jpg`, `2.jpg`, `detail-1.jpg`…). Chạy `npm run images` để nén ảnh mới.
3. Viết front matter + nội dung:

```yaml
---
id: 160                       # số nguyên duy nhất trong toàn site; lớn hơn = đứng trước
title: "C558"                 # tên hiển thị (thẻ H1) — nên có cả loại máy, vd. "G43 Máy cắt cỏ đeo vai"
model: "C558"                 # mã sản phẩm: tìm kiếm (trùng mã lên đầu), sản phẩm liên quan (biến thể cùng mã đứng đầu)
categoryId: 30                # id danh mục (cùng ngôn ngữ) trong categories.json
thumb: /assets/media/products/c558/thumb.jpg      # ảnh VUÔNG 640×640: danh sách, sidebar, liên quan, gợi ý tìm kiếm (khung ảnh cố định 1:1)
images:                       # gallery ở trang chi tiết (trống thì dùng thumb); ảnh đầu = ảnh chia sẻ mạng xã hội
  - /assets/media/products/c558/1.jpg
  - /assets/media/products/c558/2.png
description: "…"              # meta description — xem lưu ý bên dưới
summary: |                    # HTML phần "Mô tả ngắn / Short Description"
  <p>…</p>
---
<p>HTML phần "Chi tiết sản phẩm / Products Detail"…</p>
<img src="/assets/media/products/c558/detail-1.jpg" alt="Kewaqi C558 – hệ thống khởi động">
```

`description` là đoạn Google hiện dưới tiêu đề trong kết quả tìm kiếm: viết **khoảng 120–160 ký tự**, mở đầu bằng thương hiệu + tên sản phẩm, rồi loại máy và 2–3 thông số chính, vd. `Kewaqi C558 – máy cưa xích chuyên nghiệp: dung tích 54.5cc, công suất 2.6 kW, nặng 4.9 kg…`. Dài hơn 160 ký tự sẽ bị cắt. Thông số nên có cả dạng chữ trong bảng (không chỉ trong ảnh) để Google đọc được.

Sản phẩm mới tự xuất hiện ở: trang danh mục của nó và mọi danh mục cha, tìm kiếm (gợi ý ở header và trang kết quả, mục 4.4), "Sản phẩm liên quan" của các sản phẩm cùng mã / cùng danh mục / cùng nhóm máy (mục 4.3). **Không** tự xuất hiện ở trang chủ (xem 5.5) và sidebar "sản phẩm hot" (xem 5.6).

**Thêm bằng Excel** (không cần viết front matter / HTML): điền file theo mẫu `exports/san-pham-moi-mau.xlsx` — sheet "Sản phẩm" (Mã model, Tên, Danh mục = tên danh mục trong `categories.json`, Mô tả SEO, Mô tả ngắn, Thư mục ảnh trong `media/products/` có `thumb.jpg`, Slug tuỳ chọn, Ẩn khỏi Google) và sheet "Thông số" (Mã model | Thông số | Giá trị) — rồi chạy `npm run import -- <file.xlsx>` (`tools/import-products.mjs`). Script kiểm tra cả file trước (thiếu tên, danh mục sai, thiếu ảnh, trùng slug, mô tả SEO quá 160 ký tự), có lỗi thì báo theo dòng và không ghi gì; hợp lệ thì tạo `src/content/vi/products/<slug>.html` với `id` tự cấp và bảng thông số dạng chữ (`class="rows"`). Bản hiện tại chỉ **thêm mới**, chưa cập nhật sản phẩm đã có.

Tên chỉ có mã (`C558`) vẫn tìm ra theo loại máy nhờ chuỗi danh mục, nhưng nên đặt tên đầy đủ "mã + loại máy" để thẻ sản phẩm và kết quả tìm kiếm dễ đọc.

### 5.2 Tin tức

1. Tạo `src/content/vi/news/<slug>.html` → URL `/article/<slug>/`.
2. Ảnh vào `src/assets/media/news/<slug>/`.

```yaml
---
id: 160                       # duy nhất; dùng để sắp xếp (lớn hơn = mới hơn, đứng trước)
title: "…"
categoryId: 32                # danh mục tin — hiện chỉ có một danh mục "Tin tức" (id 32)
published: "2024-01-14 09:15:00"   # trang tin và trang danh sách hiện 10 ký tự đầu (ngày); giờ Việt Nam (UTC+7) trong JSON-LD
thumb: /assets/media/news/<slug>/thumb.jpg     # ảnh ngang ở trang danh sách (khung 16:9, cắt bớt mép nếu khác tỉ lệ)
excerpt: "…"                  # đoạn tóm tắt ở trang danh sách; cũng dùng cho tìm kiếm
description: "…"              # meta description, 120–160 ký tự
noindex: true                 # (tuỳ chọn) chưa có nội dung: không cho Google index, không vào sitemap
---
<p>Nội dung bài…</p>
```

Có thể dùng ảnh đại diện mặc định `news/default-thumb-vi.png`. Ảnh chia sẻ mạng xã hội của bài là ảnh đầu tiên trong nội dung (không có thì dùng `thumb`).

### 5.3 Danh mục

Danh mục nằm trong `src/_data/categories.json`.

| Trường | Ý nghĩa |
|---|---|
| `id` | Số duy nhất |
| `lang` | `vi` |
| `type` | `products`, `news`, `about`, `service`, `contact` |
| `parentId` | id danh mục cha; `null` = danh mục gốc (hiện trên menu chính) |
| `order` | Thứ tự trong menu / sidebar (nhỏ đứng trước) |
| `name`, `subtitle` | Tiêu đề và dòng phụ trên banner; `subtitle` trống thì lấy của danh mục có banner |
| `banner` | Ảnh banner; trống thì lấy của danh mục cha gần nhất |
| `slug` | Phần URL |
| `url` | URL đầy đủ — **tự điền theo quy tắc bên dưới** |

Quy tắc `url`:

| Loại | URL |
|---|---|
| Gốc sản phẩm / tin | `/products/`, `/news/` |
| Danh mục con sản phẩm / tin | `/products/<slug>/`, `/news/<slug>/` |
| Gốc giới thiệu / dịch vụ / hỗ trợ | `/<slug>/` — cần file `content/vi/pages/<slug>.html` cùng tên |
| Mục con của trang giới thiệu | `/about-kewaqi/#a<id>` (neo trong trang, trang có phần tử `id="a<id>"`). "Giới thiệu" không có mục con, bấm trên menu là vào thẳng trang. "Hỗ trợ" có 2 mục con trỏ tới 2 phần của trang (id 48 "Hướng dẫn vận hành" → `/support/#van-hanh`, id 49 "Câu hỏi thường gặp" → `/support/#cau-hoi`; thứ tự theo `order`). Mở trang bằng link neo: `main.js` cuộn lại sau khi header chuyển sang cố định, `[id]` có `scroll-margin-top` (reset.css) nên tiêu đề nơi đến không bị header che; danh mục có mục con thì menu header hiện danh sách thả xuống và menu ☰ ở điện thoại chỉ mở / đóng danh sách, không vào trang |

URL trên là của ngôn ngữ mặc định (không tiền tố); danh mục của ngôn ngữ khác (nếu thêm sau này) có tiền tố `/<lang>/`.

Danh mục kiểu `products` / `news` tự có trang danh sách (mục 4.2); không cần tạo file.

### 5.4 Trang tĩnh (giới thiệu, dịch vụ, hỗ trợ)

File `src/content/<lang>/pages/<slug>.html`, tên file trùng `slug` của danh mục. Thân file là HTML của phần nội dung (giữa breadcrumb và footer).

```yaml
---
title: "Giới thiệu"
description: "…"              # meta description, 120–160 ký tự
categoryId: 22                # danh mục của trang: banner, breadcrumb, menu đang chọn
ownBanner: true               # (tuỳ chọn) trang tự có banner riêng → bỏ banner + breadcrumb chung, thêm H1 ẩn = title
css:                          # (tuỳ chọn) CSS thêm cho riêng trang
  - /assets/css/lightGallery.css
js:                           # (tuỳ chọn) script thêm, nạp cuối trang
  - /assets/js/lightGallery.min.js
inlineScript: |               # (tuỳ chọn) JS chạy sau các script trên (khởi tạo slider…)
  $(function(){ … })
---
<section class="wrap n-about">…</section>
```

**Trang Hỗ trợ** (`pages/support.html`, URL `/support/`) không có thân HTML: front matter khai báo `layout: support.njk`, banner + breadcrumb dùng chung như các trang khác (ảnh `media/categories/support-banner.jpg`, tên và dòng mô tả lấy từ danh mục trong `categories.json`; dòng giới thiệu, đoạn mô tả và 3 điểm nổi bật trên banner lấy từ `hero` trong `support.json`); phần câu hỏi lấy nội dung từ `src/_data/support.json` (theo ngôn ngữ, như `hot.json`). Thêm / sửa câu hỏi chỉ cần sửa mảng `items`: `question`, `topic` (id trong `topics.list` — cột "Chủ đề hỗ trợ" lọc theo trường này), `infoTitle` + `info` (khối "Dấu hiệu"), `steps` (`title`, `text`), tuỳ chọn `stepsTitle` (mặc định "Cách kiểm tra và khắc phục") và `safety: false` (ẩn khối "Lưu ý an toàn"). Cùng dữ liệu này sinh JSON-LD `FAQPage` (filter `faqLd`).

**Trang Hỗ trợ dạng 2 tab** (thanh tab dưới breadcrumb, dính dưới header khi cuộn; chữ trong `tabs` của `support.json`): "Câu hỏi thường gặp" (`#cau-hoi`, mặc định) và "Hướng dẫn vận hành" (`#van-hanh`). Mở trang bằng `#cau-hoi`, `#van-hanh` hoặc `#` của một câu hỏi / bước / bài thì hiện đúng tab (kể cả khi `#` đổi ngay trên trang, vd. bấm menu "Hỗ trợ ▾"); đổi tab thì `#` trên thanh địa chỉ đổi theo. Card "Cần hỗ trợ thêm?" có ở cả 2 tab. Chưa có JS thì cả 2 phần đều hiện.

**Hướng dẫn vận hành** — tab riêng, **độc lập** với cột "Chủ đề hỗ trợ" và ô tìm câu hỏi. Dữ liệu: `operation` trong `support.json` — chữ của khối (`kicker`, `title`, `text`, `jump` = link "Xem hướng dẫn…" dưới tiêu đề câu hỏi, `prev` / `next`, `doTitle` / `dontTitle`) và `groups` = các bước ① → ⑥: `id` (`van-hanh-buoc-N`), `no`, `short` (chữ trên thanh bước), `name` (tiêu đề bước), `articles` = các bài: `id` (`van-hanh-N`), `title`, `numbered` (true = các bước có số 01, 02…; false = các ý có dấu chấm), `points` (mỗi ý: `title`, `text`, tuỳ chọn `sub` = ý con), `do` / `dont` (khối Nên làm / Tuyệt đối không làm). Bố cục 2 cột như phần câu hỏi: nội dung bên trái, card "Các bước vận hành" bên phải (`stepsTitle`, `stepsText`; dính theo khi cuộn; máy tính bảng / điện thoại: card nằm giữa tiêu đề và nội dung). Mỗi lúc hiện một bước, bài trong bước mở sẵn; chưa có JS thì hiện tất cả. Link thẳng `/support/#van-hanh-N` (bài) hoặc `#van-hanh-buoc-N` (bước) mở đúng bước rồi cuộn tới. Các bài có trong ô tìm kiếm ở header (nhóm "Hỏi đáp & hướng dẫn") và JSON-LD `FAQPage`.

### 5.5 Trang chủ

`src/content/<lang>/index.html` là **HTML cố định**: banner, Danh mục sản phẩm, Sản phẩm nổi bật, giới thiệu (nền ảnh), Tại sao nên chọn Kewaqi, xưởng ("Kewaqi của chúng tôi"), Cảm nhận khách hàng. Khi thêm sản phẩm / tin mới, trang chủ **không tự cập nhật** — sửa tay HTML trong file này. Ảnh trang chủ ở `src/assets/media/home/`.

- **Sản phẩm nổi bật:** ảnh vuông (`product-<n>.jpg`, 600×600; khung ảnh cố định 1:1); chữ trên thẻ ghi theo mẫu "mã + loại máy" (vd. `143R-II Máy cắt cỏ 2 thì`), không ghi thông số.
- **Cảm nhận khách hàng:** mỗi ý kiến là một `<li class="swiper-slide">` gồm ảnh 3:2 (`testimonial-<n>.jpg`, 720×480), câu nhận xét (`.info`) và tên / vai trò (`.name`, tuỳ chọn thêm `<div class="byline">` cho địa phương). Các thẻ tự cao bằng nhau, tên luôn thẳng hàng.

Khi sửa tay giữ các quy ước SEO đang có: một `<h1 class="visually-hidden">` ở đầu file (banner chỉ là ảnh), tiêu đề khối là `<h2 class="in-title">`, ảnh banner có `alt` mô tả sản phẩm trong ảnh, ảnh trang trí `alt=""`, ảnh dưới màn hình đầu tiên (không nằm trong slider) có `loading="lazy"`.

### 5.6 Sản phẩm hot (sidebar)

`src/_data/hot.json` — danh sách `id` theo từng ngôn ngữ, giữ đúng thứ tự hiển thị:

```json
{ "vi": [57, 58, 59, 61, 67, 70] }
```

### 5.7 Chữ giao diện và thông tin công ty — `src/_data/site.json`

| Khoá | Ý nghĩa |
|---|---|
| `defaultLang`, `langs` | Ngôn ngữ mặc định (URL không có tiền tố ngôn ngữ, trang chủ là `/`) và danh sách ngôn ngữ |
| `contactEmail` | Email liên hệ (footer, trang Hỗ trợ) và email trong JSON-LD `Organization` |
| `favicon` | Icon trình duyệt |
| `url` | Tên miền chính thức, không có `/` cuối — dùng cho canonical, sitemap, Open Graph, JSON-LD. **Đổi tên miền thì sửa ở đây** |
| `googleVerification` | Mã xác minh Google Search Console theo cách "Thẻ HTML" (chỉ phần `content`, vd. `abc123…`). Để trống thì không in thẻ; xác minh bằng DNS thì không cần. Cách "Tệp HTML": đặt file `google….html` vào `src/static/` (chép nguyên văn ra gốc site) |
| `brand` | Tên thương hiệu: `og:site_name`, `brand` của sản phẩm (đuôi `<title>` dùng `meta.company` "Kewaqi Việt Nam") |
| `logo`, `ogImage` | Logo trong JSON-LD; ảnh chia sẻ mặc định khi trang không có ảnh riêng |
| `telephone` | Số điện thoại dạng quốc tế (`+84 …`) trong JSON-LD `Organization` và link `tel:` |
| `hotline` | Số điện thoại dạng hiển thị (`0983 039 686`): trang sản phẩm, trang Hỗ trợ, khung chat, ô tìm kiếm khi không có kết quả |
| `zalo` | `qr` (ảnh mã QR) và `link` (`https://zalo.me/…`) của khung chat Zalo |
| `vi` | Chữ giao diện theo nhóm (bên dưới) |

| Nhóm | Gồm |
|---|---|
| `meta` | `htmlLang`, `ogLocale` (`vi_VN`), `siteTitle` (`<title>` trang chủ, ≤ 60 ký tự), `description` (mặc định, ≤ 160 ký tự), `company`, `page` (chữ "Trang" trong tiêu đề trang 2…), `listDescription.products` / `.news` (mẫu description trang danh sách, `{name}` = tên danh mục), `address` (địa chỉ cho JSON-LD) |
| `header` | `home`, `menu`, `search`, `searchShort` (chữ của menu ☰ ở điện thoại) |
| `product` | `hot`, `categoryLabel`, `summary`, `interested`, `hotline`, `backList`, `detail`, `related`, `relatedMore`, `listMore`, `empty` (danh mục chưa có sản phẩm) |
| `news` | `latest`, `dateLabel`, `more`, `empty` |
| `search` | Ô tìm kiếm ở header và trang kết quả (mục 4.4): `title`, `placeholder`, `submit`, `open`, `close`, `clear`, `popular`, `hint`, `loading`, `loadError`, `pageError`, `products`, `categories`, `articles`, `faq`, `viewAll`, `found`, `allProducts`, `status`, `related`, `noProducts`, `tips`, `hotline`. Chỗ giữ chỗ trong chữ: `{n}` số lượng, `{q}` từ khoá, `{p}` / `{o}` số sản phẩm / số nội dung khác |
| `footer` | `links`, `contact`, `share`, `contactHtml` (HTML danh sách liên hệ), `social` (`icon`, `label`, `url` — link thật bắt đầu bằng `http` được đưa vào `sameAs` của JSON-LD), `copyrightLeft`, `copyrightRight` |
| `chat` | Khung chat Zalo: `button`, `title`, `status`, `hotline`, `greeting`, `qrAlt`, `qrHint`, `openZalo`, `close` |

Trong template, `site[lang]` được gán vào biến `t`: `{{ t.product.backList }}`, `{{ t.search.submit }}`.

### 5.8 Ảnh

Chữ thường, tiếng Anh, nối bằng `-`, không dùng mã hash / thời gian.

| Loại | Vị trí |
|---|---|
| Sản phẩm | `media/products/<slug tiếng Anh>/`: `thumb.jpg` (vuông 640×640), `1.jpg`, `2.png`… (gallery), `detail-1.jpg`… (ảnh trong phần chi tiết) |
| Tin tức | `media/news/<slug>/1.jpg`…; ảnh đại diện mặc định `media/news/default-thumb-vi.png` |
| Trang chủ | `media/home/<khối>-<n>`: `banner`, `category`, `product` (vuông 600×600), `workshop`, `testimonial` (720×480) |
| Giới thiệu | `media/about/workshop-<n>.jpg` + `workshop-<n>-thumb.jpg` |
| Khác | `media/categories/<slug>-banner.jpg`, `media/brand/favicon.png` |
| Ảnh giao diện | `images/`: `home-*`, `about-*`, `service-*`, `contact-*` (theo trang), `icon-*`, `footer-*`, `logo.png`, `zalo-qr.png` (mã QR của khung chat) |

Ảnh đặt trong `src/assets/` được chép nguyên; tham chiếu bằng đường dẫn tuyệt đối `/assets/…`.

Sau khi thêm ảnh, chạy `npm run images` (`tools/optimize-images.mjs`): ảnh JPEG / PNG trên 50 KB được thu nhỏ về tối đa 1920 px chiều ngang và nén lại tại chỗ (giữ tên file); chỉ ghi đè khi nhỏ hơn ít nhất 10%, nên chạy lại nhiều lần không làm ảnh xấu thêm. Ảnh nên có `alt` mô tả nội dung (vd. `Máy cưa xích Kewaqi C558`); ảnh thiếu alt được tự gán alt = tiêu đề H1 của trang khi build.

### 5.9 Liên hệ

Site không có form (đã bỏ form báo giá ở trang sản phẩm). Khách liên hệ qua hotline (`site.hotline` / `site.telephone`: nút "Gọi hotline" ở trang sản phẩm, trang Hỗ trợ, footer, khung chat), Zalo (`site.zalo`) và email (`site.contactEmail`).

### 5.10 Chuyển hướng URL cũ

`src/_data/redirects.json` ánh xạ URL cũ sang URL mới — URL của CMS cũ và URL đã đổi tên (vd. slug viết sai `eath-boing-machin-ground-dill` → `earth-auger-ground-drill`); khi build sinh `dist/_redirects` theo cú pháp Cloudflare Workers / Pages:

```
/vi/products/eath-boing-machin-ground-dill/  /products/earth-auger-ground-drill/  301
/vi/contact-us/  /support/  301
/vi  /  301
/vi/*  /:splat  301
/en/*  /  301
```

Trước 08/11/2026 mọi URL đều có tiền tố `/vi/` (vd. `/vi/product/t650/`). Hai quy tắc `/vi` và `/vi/*` ở cuối chuyển mọi URL cũ đó sang URL tương ứng không tiền tố (`/product/t650/`); URL cũ nào cần đích khác (đã đổi slug, trang đã bỏ) thì khai báo riêng trong `redirects.json`, được xét trước vì đứng trên.

Cloudflare không so khớp query string trong `_redirects`, nên URL dạng `/index.php?ac=Article&at=Read&did=154` của CMS cũ không được đưa vào file (vẫn giữ trong `redirects.json`). Chúng chỉ có ích khi site chạy trên tên miền cũ; khi đó cần thêm code Worker để chuyển hướng.

Cùng lúc, build sinh `dist/.htaccess` (`routes/htaccess.njk`, filter `htaccessRule`) cho hosting **Apache / LiteSpeed (cPanel)**: cùng các quy tắc trên dưới dạng `RewriteRule`. File này so khớp được cả query string, nên URL `/index.php?…` của CMS cũ cũng được chuyển hướng; URL `/en/…` chưa có quy tắc riêng về trang chủ tiếng Việt. Đoạn ép `https` đang để dạng chú thích: bật khi chứng chỉ SSL của tên miền đã cấp xong.

**Đổi slug của trang đã đưa lên mạng thì luôn thêm một dòng URL cũ → URL mới** vào `redirects.json`, để không mất thứ hạng và link từ nơi khác.

Host khác (Nginx…) cần chuyển các quy tắc này sang cấu hình của host đó.

## 6. Tham khảo template

### Layout

| Layout | Dùng cho | Nội dung chính |
|---|---|---|
| `base.njk` | mọi trang | `<head>` (tiêu đề, description, include `partials/seo.njk`), header + menu + ô tìm kiếm (`#hsearch`, mục 4.4), menu mobile, footer, khung chat Zalo, script chung. Các layout khác `extends` nó và điền block `main`, `scripts` |
| `home.njk` | trang chủ | không thêm gì; `base.njk` nhận ra layout này để dùng `meta.siteTitle` và JSON-LD công ty |
| `page.njk` | trang tĩnh | banner + breadcrumb (trừ khi `ownBanner`: thay bằng H1 ẩn) + HTML trang |
| `product.njk` | sản phẩm | banner, sidebar, gallery, thông tin + nút Gọi hotline / Quay lại danh sách, chi tiết, sản phẩm liên quan (filter `relatedProducts`) |
| `news.njk` | tin tức | banner, nội dung (một cột, căn giữa) |

### Macro (`partials/ui.njk`)

| Macro | Tác dụng |
|---|---|
| `banner(categoryId, heading = true)` | Banner đầu trang của danh mục; `heading = false` khi trang đã có H1 riêng (sản phẩm, tin) |
| `path(categoryId, lang)` | Breadcrumb |
| `productsSidebar(lang, currentCatId, t, hotProducts)` | Cây danh mục sản phẩm + khối sản phẩm hot |
| `pager(listPage)` | Phân trang |
| `hotSwiperScript()` | JS khởi tạo slider sản phẩm hot |
| `searchChips(lang, products)` | Chip các nhóm máy chính đã có sản phẩm, kèm số sản phẩm (ô tìm kiếm ở header, trang kết quả khi không tìm thấy) |

### Filter (`eleventy.config.js`)

| Filter | Ví dụ | Trả về |
|---|---|---|
| `category` | `30 \| category` | danh mục theo id |
| `catPath` / `catPathIds` | `30 \| catPath` | chuỗi danh mục từ gốc tới nó (đối tượng / id) |
| `subCats` | `25 \| subCats` | danh mục con trực tiếp, xếp theo `order` |
| `topCats` | `lang \| topCats` | danh mục gốc của ngôn ngữ |
| `sectionRoot` | `lang \| sectionRoot("products")` | danh mục gốc của một loại |
| `catBanner` | `30 \| catBanner` | danh mục gần nhất (chính nó hoặc cha) có banner |
| `langHome` | `lang \| langHome` | trang chủ của ngôn ngữ: `/` cho ngôn ngữ mặc định, `/<lang>/` cho ngôn ngữ khác — mọi URL trong template ghép từ đây |
| `byLang` | `collections.product \| byLang(lang)` | lọc theo ngôn ngữ |
| `pickByIds` | `items \| pickByIds(hot[lang])` | chọn theo danh sách id, giữ thứ tự |
| `latest` | `items \| latest(12)` | n mục id lớn nhất |
| `relatedProducts` | `collections.product \| relatedProducts(id, lang, 8)` | sản phẩm liên quan của sản phẩm có `id` (mục 4.3) |
| `productCats` | `lang \| productCats(collections.product)` | danh mục sản phẩm có ít nhất 1 sản phẩm (tính cả danh mục con), theo thứ tự cây: `name`, `url`, `depth` (1 = nhóm máy chính), `path`, `count` |
| `searchIndex` | `lang \| searchIndex(collections.product, collections.news, support[lang])` | dữ liệu của `/search/index.json` (mục 4.4) |
| `redirectRule` | dùng trong `_redirects.njk` | một dòng quy tắc Cloudflare (bỏ URL có query string) |
| `htaccessRule` | dùng trong `htaccess.njk` | quy tắc `RewriteRule` (kèm `RewriteCond` cho URL có query string) |
| `absUrl` | `page.url \| absUrl` | URL đầy đủ theo `site.url` (nhận cả mảng) |
| `metaDescription` | `description \| metaDescription` | văn bản thuần, cắt ở ranh giới từ ≤ 160 ký tự |
| `firstImage` | `content \| firstImage` | `src` của ảnh đầu tiên trong đoạn HTML |
| `isoDate` | `published \| isoDate` | `2024-01-14T09:15:00+07:00` |
| `externalUrls` | `t.footer.social \| externalUrls` | các URL `http…` (bỏ `#`), không có thì `undefined` |
| `breadcrumbLd` | `currentCatId \| breadcrumbLd(home, current)` | đối tượng JSON-LD `BreadcrumbList` |
| `faqLd` | `support[lang].items \| faqLd` | đối tượng JSON-LD `FAQPage` của trang Hỗ trợ |
| `jsonLd` | `{ … } \| jsonLd \| safe` | thẻ `<script type="application/ld+json">` |
| `lazyImages` | `content \| lazyImages \| safe` | thêm `loading="lazy" decoding="async"` cho mọi `<img>` chưa có `loading` |
| `sitemapPages` | `collections.all \| sitemapPages` | trang HTML không `noindex` (bỏ cả trang danh mục rỗng), xếp theo URL |

Transform `imageAlts`: sau khi render, gán alt = nội dung `<h1>` cho `<img>` thiếu alt hoặc có alt là tên file.

Collection: `product`, `news` (theo tag của thư mục), `categoryPages` (trang danh sách đã chia).

Dữ liệu mọi template đều đọc được: `site`, `categories`, `hot`, `support`, `redirects` (từ `_data/`), `collections`, và dữ liệu của trang (`lang`, `title`, `categoryId`, …).

Biến `base.njk` tính ở đầu file: `t`, `isHome`, `currentCatId`, `currentCat`, `currentSection` (danh mục gốc đang chọn), `pageTitle`, `fullTitle`, `metaDesc`, `shareImage`. Block của layout con (`main`, `scripts`…) dùng được các biến này. Riêng **macro** được `import` không thấy biến lẫn dữ liệu trang, nên mọi thứ macro cần (`lang`, `t`, id danh mục…) phải truyền qua tham số.

## 7. Kiểm tra và triển khai

```sh
npm run build    # tạo dist/
npm run check    # phải in "Khong co lien ket hong."
```

Site đang deploy lên **Cloudflare Workers** (Worker `fe-web-iqawek`, build tự động từ GitHub): Cloudflare chạy `npm run build` rồi `npx wrangler deploy`. Cấu hình ở `wrangler.jsonc`: `name` phải trùng tên Worker trên dashboard, `assets.directory` là `./dist` (không có file này Wrangler tự đoán thư mục `_site` mặc định của Eleventy và báo lỗi thư mục không tồn tại). Thử trước trên máy: `npx wrangler dev` (chạy như trên Cloudflare, kể cả `_redirects`).

Cũng có thể đưa **toàn bộ thư mục `dist/`** lên host tĩnh khác (Vercel, hosting có FTP / cPanel…):

- Eleventy **không xoá file cũ** trong `dist/` (trang đã bỏ, file tự đặt vào như file zip…). Trước khi tự upload, build sạch: `npm run clean && npm run build && npm run check`.
- Site phải chạy ở **gốc tên miền** (`https://ten-mien/`), không đặt trong thư mục con — mọi đường dẫn đều tuyệt đối.
- Hosting Apache / LiteSpeed (cPanel) đọc `dist/.htaccess` (chuyển hướng 301, mục 5.10); nhớ upload cả file ẩn này.
- Host tự build: lệnh build `npm run build`, thư mục xuất bản `dist`, Node ≥ 18.
- `dist/_redirects` dùng cú pháp Cloudflare (Netlify cũng đọc được); host khác phải cấu hình lại (mục 5.10).
- Tên miền phải khớp `site.url` (`https://www.kewaqi.com.vn`); bản không `www` và `http://` nên chuyển 301 về đúng địa chỉ này (cấu hình ở host).
- File xác minh Google Search Console (`google….html`) nằm trong `src/static/`, được chép ra gốc site ở mỗi lần build — không xoá trên host.

**Kiểm tra site đang chạy bản nào:** mở `https://www.kewaqi.com.vn/version.json` (hoặc Ctrl+U, tìm `<meta name="build">`):

```json
{ "version": "1.0.0", "commit": "3e99b4b", "time": "2026-11-08 19:00:03 (GMT+7)" }
```

- `version`: trường `version` trong `package.json` — tăng khi bàn giao một đợt thay đổi (1.0.0 → 1.1.0…).
- `commit`: mã commit git lúc build; có đuôi `-dirty` nghĩa là build khi còn file sửa chưa commit (nên commit trước rồi mới build để deploy).
- `time`: giờ build (giờ Việt Nam). So với `dist/version.json` trên máy để biết đã upload đúng bản vừa build chưa.

Sau khi site chạy trên tên miền thật:

1. Đăng ký **Google Search Console** (và Bing Webmaster Tools), xác minh tên miền, gửi `https://www.kewaqi.com.vn/sitemap.xml`. Nếu Google đã index URL cũ dạng `/vi/…`, gửi lại sitemap để Google chuyển sang URL mới nhanh hơn (URL cũ vẫn chuyển 301 nên không mất thứ hạng).
2. Theo dõi mục *Trang* (trang chưa được index) và *Trải nghiệm* (tốc độ). Mục *Đoạn trích sản phẩm* sẽ báo thiếu `offers` (giá) vì site không công bố giá — bình thường, không ảnh hưởng thứ hạng.
3. Kiểm tra dữ liệu có cấu trúc của một trang bất kỳ tại <https://search.google.com/test/rich-results>.

## 8. Quy ước

- Tên file, thư mục, ảnh, slug: chữ thường, tiếng Anh, nối bằng `-` (kebab-case).
- Khoá JSON, biến template, filter: camelCase; khoá trỏ tới id kết thúc bằng `Id` (`categoryId`, `parentId`).
- `id` sản phẩm / tin: số nguyên, không trùng trong toàn site.
- Không sửa JS gốc trong `assets/js` trừ khi cố ý đổi giao diện; JS mới viết thành file riêng (như `support.js`, `search.js`). Thiết lập dùng chung cho mọi slider đặt ở `main.js` (`Swiper.extendDefaults`), không lặp trong từng trang.
- CSS (chi tiết ở mục 4.3):
  - không viết mã màu, khoảng cách khối, bo góc hay cỡ chữ tiêu đề trực tiếp — dùng biến trong `:root` (`reset.css`); chỉ dùng breakpoint 1280 / 992 / 767. Màu riêng không có trong bộ biến (Zalo, ô cảnh báo) ghi kèm chú thích;
  - kiểu phẳng, vuông góc: không thêm `border-radius` (trừ icon tròn `50%`);
  - nút mới thêm vào danh sách "Nút chung" trong `reset.css`, không tự đặt màu / cỡ / lề;
  - thẻ có chữ dài ngắn khác nhau: giữ chỗ bằng `line-clamp` + `min-height`, nút `margin-top: auto`, khung ảnh `aspect-ratio`;
  - slider: không đặt `overflow: hidden` cho `.swiper-wrapper`, không đặt `padding` ngang cho `.swiper-container`;
  - không dùng `style="…"` trong template; ẩn / hiện phần tử bằng thuộc tính `hidden` (`reset.css` luôn ẩn `[hidden]`).
- Nội dung HTML (mô tả, bảng thông số): không dán kèm `style` copy từ trình duyệt / Word — kiểu chữ, màu, viền bảng do CSS lo. Bảng thông số chỉ kẻ ngang thì thêm `class="rows"` vào `<table>` (mặc định kẻ ô đầy đủ).

## 9. Giới hạn đã biết

- **Không có trang quản trị**: thêm / sửa nội dung bằng cách sửa file rồi build lại.
- **Trang chủ** và **sản phẩm hot** cập nhật thủ công (mục 5.5, 5.6).
- **Tìm kiếm** chạy trên trình duyệt (cần JavaScript), so khớp theo quy tắc ở mục 4.4: không tự sửa lỗi chính tả (gõ sai "may cat co" thành "may cta co" sẽ không ra) và chỉ coi "1 / một", "2 / hai" là tương đương.
- **Trang Hỗ trợ** (thay trang Liên hệ cũ, `/contact-us/` chuyển 301 sang `/support/`) không có bản đồ và form; site không có form nào. Khách liên hệ qua hotline, Zalo, email (footer, cột phải trang Hỗ trợ, khung chat).
- **Thư viện giao diện cũ** (jQuery 1.11.1) giữ nguyên để không đổi giao diện.
- **Dữ liệu** lấy từ site gốc ngày 06/10/2026: S262 không có nội dung chi tiết — giống site gốc. 3 tin của site gốc nói về Trung Quốc (Hội chợ Canton, n152, n153) đã xoá; URL cũ chuyển 301 về `/news/`. Tin tức chỉ còn một danh mục "Tin tức" (URL các danh mục tin cũ chuyển 301 về `/news/`). Bản tiếng Việt dịch từ bản tiếng Trung (riêng 7503 dịch từ bản tiếng Anh); thuật ngữ kỹ thuật nên được người am hiểu rà lại. Chữ Trung còn sót trong bản tiếng Anh đã được dịch (mô tả, bảng thông số); alt ảnh là tên file tiếng Trung được thay khi build (transform `imageAlts`).
- **Nội dung cần người am hiểu bổ sung (SEO):**
  - Phần lớn trang sản phẩm chỉ có ảnh, không có bảng thông số dạng chữ → Google không đọc được thông số; `description` của các sản phẩm này là câu chung (tên + loại máy).
  - Một số bảng thông số mâu thuẫn với nhau trên cùng trang (vd. G43 đeo lưng: phần tóm tắt ghi 41.5cc, bảng chi tiết ghi 42.7cc).
  - 11 sản phẩm chỉ có mã trong tên (C558, G53, S500, T400, K450A…); vài tên dễ nhầm (T500 / T500 đeo lưng / T500 Máy khoan đất). Nên đặt tên "mã + loại máy" (mục 5.1).
  - Tin tức có 12 bài (2 bài từ site gốc + 10 bài hướng dẫn), cả 12 bài đang dùng ảnh đại diện mặc định (logo) — nên thay bằng ảnh thật của từng bài.
  - Hai danh mục chưa có sản phẩm nhưng vẫn hiện trên menu: "Máy thổi lá" và "Máy xới mini" (trang của chúng hiện "Chưa có sản phẩm…" và gắn `noindex`).
  - Trang Dịch vụ: cột "Sửa chữa" lặp lại nguyên một câu ("Chúng tôi sẽ trở thành đối tác lý tưởng…").
  - Số Zalo chính thức cho khung chat chưa có (đang chờ bổ sung): khung chat đang dùng số hotline — sửa `site.zalo.link` (và ảnh `site.zalo.qr`) trong `site.json` khi có. Mạng xã hội ở footer (Facebook, YouTube, TikTok, Shopee) đã có link thật; icon TikTok, Shopee vẽ bằng SVG trong `iconfont-common.css` vì font icon không có.
- **Ảnh của nhà máy gốc, có chữ Trung** — sẽ thay bằng ảnh của Kewaqi Việt Nam: màn hình máy đo `media/about/workshop-12..14`, biển gian hội chợ `media/home/workshop-7`; các ảnh xưởng sản xuất ở trang Giới thiệu và khối "Kewaqi của chúng tôi" trên trang chủ cũng là ảnh nhà máy gốc. Logo và banner trang chủ đã là bản tiếng Việt.
- **Tên miền**: `site.url` là `https://www.kewaqi.com.vn` — canonical, sitemap, Open Graph và JSON-LD đều lấy từ đây; đổi tên miền thì chỉ sửa ở đó (mục 7).
