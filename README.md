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
| Font | **Montserrat** (bản variable, có subset tiếng Việt) cho toàn site — tự host trong `assets/fonts/`, giấy phép SIL OFL | Khai báo `@font-face` ở đầu `reset.css` dưới tên cũ `Fontstyle1/2/3` (Fontstyle1 = chữ thường, Fontstyle2 = tiêu đề 700, Fontstyle3 = tiêu đề phụ 400); tiêu đề có `size-adjust: 82%` vì Montserrat rộng hơn font cũ (Barlow Condensed) |

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

Trang để thử: `/` (tự chuyển sang `/vi/`), `/vi/products/`, `/vi/product/c558/`, `/vi/about-kewaqi/`, `/vi/support/`, `/vi/search/?q=g26`.

> Không mở trực tiếp file `dist/*.html` trong trình duyệt: site dùng đường dẫn tuyệt đối (`/assets/…`, `/vi/…`) nên phải xem qua server.

## 3. Cấu trúc thư mục

```
├── eleventy.config.js            # cấu hình build, filter danh mục + SEO, collection chia trang
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
    │       ├── ui.njk            # macro: banner, breadcrumb, sidebar, phân trang
    │       └── seo.njk           # thẻ SEO trong <head>: canonical, Open Graph, JSON-LD
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
    │   ├── search.njk            #   trang tìm kiếm sản phẩm
    │   ├── index.njk             #   "/" → chuyển tới ngôn ngữ mặc định
    │   ├── sitemap.njk           #   /sitemap.xml cho Google / Bing
    │   ├── robots.njk            #   /robots.txt (trỏ tới sitemap)
    │   └── _redirects.njk        #   chuyển hướng 301 từ URL cũ (định dạng Cloudflare)
    └── assets/                   # chép nguyên sang dist/assets/
        ├── css/                  #   animate, swiper, reset, main (trang con), index (trang chủ), support (trang Hỗ trợ), lightGallery
        ├── js/                   #   jquery, swiper, wow, lightGallery, main, forms, support (trang Hỗ trợ)
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
| `content/vi/index.html` | `home.njk` (khai báo trong file) | `/vi/` |
| `content/vi/products/c558.html` | `product.njk` | `/vi/product/c558/` |
| `content/vi/news/<slug>.html` | `news.njk` | `/vi/article/<slug>/` |
| `content/vi/pages/service.html` | `page.njk` | `/vi/service/` |

- Ngôn ngữ: từ `vi.json`. Layout: từ `products.json`, `news.json`, `pages.json` trong từng thư mục; hai file đầu còn gắn tag `product` / `news` để tạo collection.
- URL: tính trong `content/content.11tydata.js` theo tên file.
- File nội dung `.html` là **HTML thuần** (cấu hình `htmlTemplateEngine: false`) — không dùng được cú pháp Nunjucks `{{ }}` / `{% %}` bên trong.

### 4.2 Trang sinh từ dữ liệu (`src/routes/`)

| Template | Sinh ra | Nguồn dữ liệu |
|---|---|---|
| `lists.njk` | Trang danh mục, mỗi danh mục kiểu `products` / `news` một trang (kèm danh mục con cháu). Chia trang: 12 sản phẩm / 4 tin (lưới 2×2) mỗi trang; trang 2 trở đi ở `<url danh mục>page/2/`. Danh mục chưa có sản phẩm / bài viết hiện câu thông báo (`product.empty` / `news.empty` trong `site.json`), gắn `noindex` và không vào sitemap | collection `categoryPages` trong `eleventy.config.js` |
| `search.njk` | `/vi/search/` — liệt kê mọi sản phẩm, lọc phía trình duyệt theo `?q=` (khớp tên + mã, không phân biệt hoa thường). Gắn `noindex` | collection `product` |
| `index.njk` | `/` — chuyển tới `/<defaultLang>/` bằng meta refresh (dự phòng; trên Cloudflare dòng đầu `_redirects` chuyển 301 trước) | `site.json` |
| `sitemap.njk` | `/sitemap.xml` — mọi trang HTML trừ trang có `noindex`; tin tức kèm `<lastmod>` lấy từ `published` | `collections.all` |
| `robots.njk` | `/robots.txt` — cho phép mọi bot, trỏ tới sitemap | `site.json` |
| `_redirects.njk` | `dist/_redirects`: `/` → `/<defaultLang>/` rồi các quy tắc trong `redirects.json` | `redirects.json` |

### 4.3 Quy tắc chung

- **Sắp xếp:** sản phẩm / tin luôn xếp theo `id` **giảm dần** (id lớn đứng trước) — trong danh mục, "sản phẩm liên quan", "tin mới nhất", tìm kiếm. "Bài trước / sau" của tin tức tính theo `id` tăng dần.
- **Menu:** header và footer lấy các danh mục gốc (`parentId: null`) của ngôn ngữ, xếp theo `order`; menu thả xuống hiện một cấp con. Sidebar sản phẩm hiện hai cấp dưới danh mục gốc `products`; trang tin tức (danh sách và chi tiết) không có sidebar.
- **Tiêu đề trang (`<title>`):** `<tên trang> | <site.brand>`, vd. `6503 Máy tỉa hàng rào hai lưỡi | Kewaqi`. Sản phẩm chỉ có mã model (`C558`) hoặc trùng tên danh mục thì thêm nhóm sản phẩm: `C558 – Máy cưa xích | Kewaqi`; trang danh sách từ trang 2 thêm `– Trang 2`. Trang chủ dùng nguyên `meta.siteTitle`.
- **Meta description:** trường `description` trong front matter (sản phẩm, tin, trang tĩnh); trang danh sách theo mẫu `meta.listDescription`; còn lại `meta.description`. Bộ lọc `metaDescription` bỏ thẻ HTML và cắt ở ranh giới từ cho vừa 160 ký tự.
- **SEO trong `<head>`** (`partials/seo.njk`): `canonical` (URL đầy đủ theo `site.url`), Open Graph + Twitter Card (ảnh chia sẻ: ảnh sản phẩm → ảnh đầu bài tin → banner danh mục → `site.ogImage`), JSON-LD schema.org: `Organization` + `WebSite` ở trang chủ, `BreadcrumbList` ở trang con, `Product` ở trang sản phẩm, `NewsArticle` ở trang tin. Trang có `noindex: true` trong front matter: thẻ `robots noindex`, không canonical, không vào sitemap.
- **Thẻ tiêu đề:** mỗi trang đúng một `<h1>` — tên sản phẩm / tiêu đề tin / tên danh mục; trang không có tiêu đề hiển thị (trang chủ) dùng H1 ẩn `class="visually-hidden"`. Kiểu chữ của các khối dùng h1–h4 trong template cũ đã chuyển sang class `.h1`–`.h4` (`reset.css` + selector trong `main.css` / `index.css`), nên có thể đổi thẻ (`h2`, `h3`, `div`, `p`) theo đúng cấp tiêu đề mà giao diện không đổi.
- **Ảnh:** transform `imageAlts` gán alt = nội dung `<h1>` cho ảnh thiếu alt hoặc alt chỉ là tên file; ảnh trang trí khai báo `alt=""`. Ảnh dưới màn hình đầu tiên có `loading="lazy"` (filter `lazyImages` cho phần nội dung sản phẩm / tin); ảnh trong slider Swiper giữ tải ngay để không bị trống khi chuyển slide.
- **Script:** jQuery, Swiper, WOW, `main.js` nạp ở cuối `<body>` để không chặn hiển thị; mọi script inline (`inlineScript`, block `scripts`) chạy sau chúng.
- **CSS theo trang:** trang chủ dùng `index.css`; trang khác dùng `main.css` + `iconfont-pages.css`; trang Hỗ trợ thêm `support.css` (mọi class có tiền tố `sp-`, không ảnh hưởng CSS chung).
- **Biến giao diện chung:** `:root` ở đầu `reset.css` khai báo màu (`--c-primary`, `--c-ink`, `--c-text`, `--c-muted`, `--c-line`, `--c-soft`…), khoảng cách khối (`--section-top` / `--section-bottom` cho trang con, `--home-gap` cho trang chủ; tự đổi sang % ở màn ≤ 1280px) và bo góc (`--radius-sm`, `--radius`, `--radius-pill`). Cả 4 file CSS dùng các biến này; đổi tông màu hay khoảng cách toàn site chỉ cần sửa ở đó.
- **Breakpoint (responsive):** viết kiểu desktop-first (`max-width`), chỉ dùng 3 mốc chuẩn: `1280px` (laptop / tablet ngang, menu ngang thu gọn), `992px` (tablet dọc, menu ngang thu nhỏ), `767px` (điện thoại, chuyển sang menu ☰). Màn > 1280px là desktop (`.wrap` cố định 1280px). Slider Swiper dùng `min-width` nên khai báo mốc lệch 1: `0` / `768` / `993` / `1281`, để slider và bố cục CSS đổi cùng lúc. Chỉ thêm `480px` cho khối cụ thể bị chật ở điện thoại nhỏ. Không thêm mốc khác (`lightGallery.css` là CSS thư viện, giữ nguyên).

## 5. Hướng dẫn quản lý nội dung

Sau mỗi thay đổi: xem lại bằng `npm start`, rồi `npm run build` + `npm run check` trước khi đưa lên host.

### 5.1 Sản phẩm

Mỗi sản phẩm là một file.

1. Tạo `src/content/vi/products/<slug>.html` — `<slug>` thành URL: `/vi/product/<slug>/`.
2. Đặt ảnh vào `src/assets/media/products/<slug tiếng Anh>/` (`thumb.jpg`, `1.jpg`, `2.jpg`, `detail-1.jpg`…). Chạy `npm run images` để nén ảnh mới.
3. Viết front matter + nội dung:

```yaml
---
id: 160                       # số nguyên duy nhất trong toàn site; lớn hơn = đứng trước
title: "C558"                 # tên hiển thị (thẻ H1)
model: "C558"                 # mã sản phẩm — dùng cho tìm kiếm
categoryId: 30                # id danh mục (cùng ngôn ngữ) trong categories.json
thumb: /assets/media/products/c558/thumb.jpg      # ảnh vuông 640×640: danh sách, sidebar, liên quan
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

Sản phẩm mới tự xuất hiện ở: trang danh mục của nó và mọi danh mục cha, trang tìm kiếm, "Sản phẩm liên quan / Related Products" (12 sản phẩm id lớn nhất). **Không** tự xuất hiện ở trang chủ (xem 5.5) và sidebar "sản phẩm hot" (xem 5.6).

### 5.2 Tin tức

1. Tạo `src/content/vi/news/<slug>.html` → URL `/vi/article/<slug>/`.
2. Ảnh vào `src/assets/media/news/<slug>/`.

```yaml
---
id: 160                       # duy nhất; dùng để sắp xếp và tính bài trước / sau
title: "…"
categoryId: 33                # danh mục tin: công ty / ngành / triển lãm
published: "2024-01-14 09:15:00"   # hiển thị nguyên văn; sidebar lấy 10 ký tự đầu; giờ Việt Nam (UTC+7) trong JSON-LD
thumb: /assets/media/news/<slug>/thumb.jpg     # ảnh 960×480 ở trang danh sách
excerpt: "…"                  # đoạn tóm tắt ở trang danh sách
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
| Gốc sản phẩm / tin | `/<lang>/products/`, `/<lang>/news/` |
| Danh mục con sản phẩm / tin | `/<lang>/products/<slug>/`, `/<lang>/news/<slug>/` |
| Gốc giới thiệu / dịch vụ / hỗ trợ | `/<lang>/<slug>/` — cần file `content/<lang>/pages/<slug>.html` cùng tên |
| Mục con của trang giới thiệu | `/<lang>/about-kewaqi/#a<id>` (neo trong trang, trang có phần tử `id="a<id>"`) |

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

**Trang Hỗ trợ** (`pages/support.html`, URL `/vi/support/`) không có thân HTML: front matter khai báo `layout: support.njk`, banner + breadcrumb dùng chung như các trang khác (ảnh `media/categories/support-banner.jpg`, tên và dòng mô tả lấy từ danh mục trong `categories.json`; dòng giới thiệu, đoạn mô tả và 3 điểm nổi bật trên banner lấy từ `hero` trong `support.json`); phần câu hỏi lấy nội dung từ `src/_data/support.json` (theo ngôn ngữ, như `hot.json`). Thêm / sửa câu hỏi chỉ cần sửa mảng `items`: `question`, `topic` (id trong `topics.list` — cột "Chủ đề hỗ trợ" lọc theo trường này), `infoTitle` + `info` (khối "Dấu hiệu"), `steps` (`title`, `text`), tuỳ chọn `stepsTitle` (mặc định "Cách kiểm tra và khắc phục") và `safety: false` (ẩn khối "Lưu ý an toàn"). Cùng dữ liệu này sinh JSON-LD `FAQPage` (filter `faqLd`). Số điện thoại hiển thị lấy từ `site.hotline`, email từ `site.contactEmail`.

### 5.5 Trang chủ

`src/content/<lang>/index.html` là **HTML cố định** (banner, khối danh mục, sản phẩm, xưởng, tin tức). Khi thêm sản phẩm / tin mới, trang chủ **không tự cập nhật** — sửa tay HTML trong file này. Ảnh trang chủ ở `src/assets/media/home/`.

Khi sửa tay giữ các quy ước SEO đang có: một `<h1 class="visually-hidden">` ở đầu file (banner chỉ là ảnh), tiêu đề khối là `<h2 class="in-title">`, ảnh banner có `alt` mô tả sản phẩm trong ảnh, ảnh trang trí `alt=""`, ảnh dưới màn hình đầu tiên (không nằm trong slider) có `loading="lazy"`.

### 5.6 Sản phẩm hot (sidebar)

`src/_data/hot.json` — danh sách `id` theo từng ngôn ngữ, giữ đúng thứ tự hiển thị:

```json
{ "vi": [57, 58, 59, 61, 67, 70] }
```

### 5.7 Chữ giao diện và thông tin công ty — `src/_data/site.json`

| Khoá | Ý nghĩa |
|---|---|
| `defaultLang`, `langs` | Ngôn ngữ mặc định (đích của `/`) và danh sách ngôn ngữ |
| `formEndpoint`, `contactEmail` | Nơi nhận form (mục 5.9); `contactEmail` cũng là email trong JSON-LD `Organization` |
| `favicon` | Icon trình duyệt |
| `url` | Tên miền chính thức, không có `/` cuối — dùng cho canonical, sitemap, Open Graph, JSON-LD. **Đổi tên miền thì sửa ở đây** |
| `brand` | Tên thương hiệu: đuôi `<title>` (`… \| Kewaqi`), `og:site_name`, `brand` của sản phẩm |
| `logo`, `ogImage` | Logo trong JSON-LD; ảnh chia sẻ mặc định khi trang không có ảnh riêng |
| `telephone` | Số điện thoại dạng quốc tế (`+84 …`) trong JSON-LD `Organization` và link `tel:` |
| `hotline` | Số điện thoại dạng hiển thị (`0983 039 686`), dùng ở trang Hỗ trợ |
| `vi` | Chữ giao diện theo nhóm (bên dưới) |

| Nhóm | Gồm |
|---|---|
| `meta` | `htmlLang`, `ogLocale` (`vi_VN`), `siteTitle` (`<title>` trang chủ, ≤ 60 ký tự), `description` (mặc định, ≤ 160 ký tự), `company`, `page` (chữ "Trang" trong tiêu đề trang 2…), `listDescription.products` / `.news` (mẫu description trang danh sách, `{name}` = tên danh mục), `address` (địa chỉ cho JSON-LD) |
| `header` | `home`, `menu`, `search`, `searchPlaceholder`, `searchShort` |
| `product` | `hot`, `categoryLabel`, `summary`, `interested`, `inquiry`, `contact`, `backList`, `detail`, `related`, `relatedMore`, `listMore`, `inquiryTitle` |
| `news` | `latest`, `dateLabel`, `prev`, `next`, `more` |
| `search` | `title`, `noResults` |
| `form` | `namePlaceholder`, `emailPlaceholder`, `messagePlaceholder`, `submit`, `thanks`, `mailtoNotice`, `required` |
| `footer` | `links`, `contact`, `share`, `contactHtml` (HTML danh sách liên hệ), `social` (`icon`, `label`, `url` — link thật bắt đầu bằng `http` được đưa vào `sameAs` của JSON-LD), `copyrightLeft`, `copyrightRight` |

Trong template, `site[lang]` được gán vào biến `t`: `{{ t.product.backList }}`, `{{ t.form.submit }}`.

### 5.8 Ảnh

Chữ thường, tiếng Anh, nối bằng `-`, không dùng mã hash / thời gian.

| Loại | Vị trí |
|---|---|
| Sản phẩm | `media/products/<slug tiếng Anh>/`: `thumb.jpg` (640×640), `1.jpg`, `2.png`… (gallery), `detail-1.jpg`… (ảnh trong phần chi tiết) |
| Tin tức | `media/news/<slug>/1.jpg`…; ảnh đại diện mặc định `media/news/default-thumb-vi.png` |
| Trang chủ | `media/home/<khối>-<n>`: `banner`, `category`, `product`, `workshop` |
| Giới thiệu | `media/about/workshop-<n>.jpg` + `workshop-<n>-thumb.jpg` |
| Khác | `media/categories/<slug>-banner.jpg`, `media/brand/favicon.png` |
| Ảnh giao diện | `images/`: `home-*`, `about-*`, `service-*`, `contact-*` (theo trang), `icon-*`, `footer-*`, `logo.png`, `qrcode.jpg` |

Ảnh đặt trong `src/assets/` được chép nguyên; tham chiếu bằng đường dẫn tuyệt đối `/assets/…`.

Sau khi thêm ảnh, chạy `npm run images` (`tools/optimize-images.mjs`): ảnh JPEG / PNG trên 50 KB được thu nhỏ về tối đa 1920 px chiều ngang và nén lại tại chỗ (giữ tên file); chỉ ghi đè khi nhỏ hơn ít nhất 10%, nên chạy lại nhiều lần không làm ảnh xấu thêm. Ảnh nên có `alt` mô tả nội dung (vd. `Máy cưa xích Kewaqi C558`); ảnh thiếu alt được tự gán alt = tiêu đề H1 của trang khi build.

### 5.9 Form liên hệ / để lại lời nhắn

Site tĩnh không có máy chủ xử lý form. Mọi `<form data-form>` được `src/assets/js/forms.js` xử lý:

- `formEndpoint` có giá trị (vd. URL Formspree) → gửi form tới đó bằng AJAX.
- `formEndpoint` trống → mở ứng dụng email, gửi tới `contactEmail`.

Form báo giá ở trang sản phẩm (`#inquiry`) gửi các trường `product` (tên sản phẩm, ẩn), `name`, `email`, `message`.

### 5.10 Chuyển hướng URL cũ

`src/_data/redirects.json` ánh xạ URL cũ sang URL mới — URL của CMS cũ và URL đã đổi tên (vd. slug viết sai `eath-boing-machin-ground-dill` → `earth-auger-ground-drill`); khi build sinh `dist/_redirects` theo cú pháp Cloudflare Workers / Pages:

```
/  /vi/  301
/vi/products/eath-boing-machin-ground-dill/  /vi/products/earth-auger-ground-drill/  301
/en/*  /vi/  301
```

Cloudflare không so khớp query string trong `_redirects`, nên URL dạng `/index.php?ac=Article&at=Read&did=154` của CMS cũ không được đưa vào file (vẫn giữ trong `redirects.json`). Chúng chỉ có ích khi site chạy trên tên miền cũ; khi đó cần thêm code Worker để chuyển hướng.

**Đổi slug của trang đã đưa lên mạng thì luôn thêm một dòng URL cũ → URL mới** vào `redirects.json`, để không mất thứ hạng và link từ nơi khác.

Host khác (Nginx, Apache…) cần chuyển các quy tắc này sang cấu hình của host đó.

## 6. Tham khảo template

### Layout

| Layout | Dùng cho | Nội dung chính |
|---|---|---|
| `base.njk` | mọi trang | `<head>` (tiêu đề, description, include `partials/seo.njk`), header + menu, menu mobile, footer, script chung. Các layout khác `extends` nó và điền block `main`, `scripts` |
| `home.njk` | trang chủ | không thêm gì; `base.njk` nhận ra layout này để dùng `meta.siteTitle` và JSON-LD công ty |
| `page.njk` | trang tĩnh | banner + breadcrumb (trừ khi `ownBanner`: thay bằng H1 ẩn) + HTML trang |
| `product.njk` | sản phẩm | banner, sidebar, gallery, thông tin, chi tiết, sản phẩm liên quan, form để lại lời nhắn |
| `news.njk` | tin tức | banner, nội dung (một cột, căn giữa), bài trước / sau |

### Macro (`partials/ui.njk`)

| Macro | Tác dụng |
|---|---|
| `banner(categoryId, heading = true)` | Banner đầu trang của danh mục; `heading = false` khi trang đã có H1 riêng (sản phẩm, tin) |
| `path(categoryId, lang)` | Breadcrumb |
| `productsSidebar(lang, currentCatId, t, hotProducts)` | Cây danh mục sản phẩm + khối sản phẩm hot |
| `pager(listPage)` | Phân trang |
| `hotSwiperScript()` | JS khởi tạo slider sản phẩm hot |

### Filter (`eleventy.config.js`)

| Filter | Ví dụ | Trả về |
|---|---|---|
| `category` | `30 \| category` | danh mục theo id |
| `catPath` / `catPathIds` | `30 \| catPath` | chuỗi danh mục từ gốc tới nó (đối tượng / id) |
| `subCats` | `25 \| subCats` | danh mục con trực tiếp, xếp theo `order` |
| `topCats` | `lang \| topCats` | danh mục gốc của ngôn ngữ |
| `sectionRoot` | `lang \| sectionRoot("products")` | danh mục gốc của một loại |
| `catBanner` | `30 \| catBanner` | danh mục gần nhất (chính nó hoặc cha) có banner |
| `byLang` | `collections.product \| byLang(lang)` | lọc theo ngôn ngữ |
| `pickByIds` | `items \| pickByIds(hot[lang])` | chọn theo danh sách id, giữ thứ tự |
| `latest` | `items \| latest(12)` | n mục id lớn nhất |
| `prevNext` | `items \| prevNext(id)` | `{ prev, next }` theo id |
| `redirectRule` | dùng trong `_redirects.njk` | một dòng quy tắc Cloudflare (bỏ URL có query string) |
| `absUrl` | `page.url \| absUrl` | URL đầy đủ theo `site.url` (nhận cả mảng) |
| `metaDescription` | `description \| metaDescription` | văn bản thuần, cắt ở ranh giới từ ≤ 160 ký tự |
| `firstImage` | `content \| firstImage` | `src` của ảnh đầu tiên trong đoạn HTML |
| `isoDate` | `published \| isoDate` | `2024-01-14T09:15:00+07:00` |
| `externalUrls` | `t.footer.social \| externalUrls` | các URL `http…` (bỏ `#`), không có thì `undefined` |
| `breadcrumbLd` | `currentCatId \| breadcrumbLd(home, current)` | đối tượng JSON-LD `BreadcrumbList` |
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

Cũng có thể đưa **toàn bộ thư mục `dist/`** lên host tĩnh khác (Vercel, hosting có FTP…):

- Site phải chạy ở **gốc tên miền** (`https://ten-mien/`), không đặt trong thư mục con — mọi đường dẫn đều tuyệt đối.
- Host tự build: lệnh build `npm run build`, thư mục xuất bản `dist`, Node ≥ 18.
- `dist/_redirects` dùng cú pháp Cloudflare (Netlify cũng đọc được); host khác phải cấu hình lại (mục 5.10).
- Tên miền phải khớp `site.url` (`https://www.kewaqi.com`); bản không `www` và `http://` nên chuyển 301 về đúng địa chỉ này (cấu hình ở host).

Sau khi site chạy trên tên miền thật:

1. Đăng ký **Google Search Console** (và Bing Webmaster Tools), xác minh tên miền, gửi `https://www.kewaqi.com/sitemap.xml`.
2. Theo dõi mục *Trang* (trang chưa được index) và *Trải nghiệm* (tốc độ). Mục *Đoạn trích sản phẩm* sẽ báo thiếu `offers` (giá) vì site không công bố giá — bình thường, không ảnh hưởng thứ hạng.
3. Kiểm tra dữ liệu có cấu trúc của một trang bất kỳ tại <https://search.google.com/test/rich-results>.

## 8. Quy ước

- Tên file, thư mục, ảnh, slug: chữ thường, tiếng Anh, nối bằng `-` (kebab-case).
- Khoá JSON, biến template, filter: camelCase; khoá trỏ tới id kết thúc bằng `Id` (`categoryId`, `parentId`).
- `id` sản phẩm / tin: số nguyên, không trùng trong toàn site.
- Không sửa JS gốc trong `assets/js` trừ khi cố ý đổi giao diện; JS mới viết thành file riêng (như `forms.js`).
- CSS: không viết mã màu, khoảng cách khối hay bo góc trực tiếp — dùng biến trong `:root` (`reset.css`, mục 4.3); chỉ dùng breakpoint 1280 / 992 / 767. Màu riêng không có trong bộ biến (Zalo, ô cảnh báo) ghi kèm chú thích. Không dùng `style="…"` trong template; ẩn / hiện phần tử bằng thuộc tính `hidden` (`reset.css` luôn ẩn `[hidden]`).
- Nội dung HTML (mô tả, bảng thông số): không dán kèm `style` copy từ trình duyệt / Word — kiểu chữ, màu, viền bảng do CSS lo. Bảng thông số chỉ kẻ ngang thì thêm `class="rows"` vào `<table>` (mặc định kẻ ô đầy đủ).

## 9. Giới hạn đã biết

- **Không có trang quản trị**: thêm / sửa nội dung bằng cách sửa file rồi build lại.
- **Trang chủ** và **sản phẩm hot** cập nhật thủ công (mục 5.5, 5.6).
- **Form** không lưu trên máy chủ; cần cấu hình `formEndpoint` để nhận trực tiếp.
- **Tìm kiếm** chỉ lọc tên và mã sản phẩm, chạy trên trình duyệt.
- **Trang Hỗ trợ** (thay trang Liên hệ cũ, `/vi/contact-us/` chuyển 301 sang `/vi/support/`) không có bản đồ và form; form để lại lời nhắn nằm ở trang chi tiết sản phẩm, thông tin liên hệ ở footer và cột phải trang Hỗ trợ.
- **Thư viện giao diện cũ** (jQuery 1.11.1) giữ nguyên để không đổi giao diện.
- **Dữ liệu** lấy từ site gốc ngày 06/10/2026: S262 không có nội dung chi tiết — giống site gốc. 3 tin của site gốc nói về Trung Quốc (Hội chợ Canton, n152, n153) đã xoá; URL cũ chuyển 301 về `/vi/news/`. Danh mục tin "Tin công ty" và "Triển lãm" hiện chưa có bài. Bản tiếng Việt dịch từ bản tiếng Trung (riêng 7503 dịch từ bản tiếng Anh); thuật ngữ kỹ thuật nên được người am hiểu rà lại. Chữ Trung còn sót trong bản tiếng Anh đã được dịch (mô tả, bảng thông số); alt ảnh là tên file tiếng Trung được thay khi build (transform `imageAlts`).
- **Nội dung cần người am hiểu bổ sung (SEO):**
  - Phần lớn trang sản phẩm chỉ có ảnh, không có bảng thông số dạng chữ → Google không đọc được thông số; `description` của các sản phẩm này là câu chung (tên + loại máy).
  - Một số bảng thông số mâu thuẫn với nhau trên cùng trang (vd. G43 đeo lưng: phần tóm tắt ghi 41.5cc, bảng chi tiết ghi 42.7cc).
  - Tin tức còn 2 bài (tin ngành); nên viết thêm bài riêng của Kewaqi Việt Nam (hướng dẫn chọn / bảo dưỡng máy, hoạt động đại lý…).
  - Link mạng xã hội trong footer đang là `#` — điền link thật vào `site.json` (`footer.social`).
- **Ảnh của nhà máy gốc, có chữ Trung** — sẽ thay bằng ảnh của Kewaqi Việt Nam: màn hình máy đo `media/about/workshop-12..14`, biển gian hội chợ `media/home/workshop-7`; các ảnh xưởng sản xuất ở trang Giới thiệu và khối "Kewaqi của chúng tôi" trên trang chủ cũng là ảnh nhà máy gốc. Logo và banner trang chủ đã là bản tiếng Việt.
- **Tên miền**: `site.url` vẫn là `https://www.kewaqi.com` (tên miền của site gốc) — đổi sang tên miền thật trước khi đưa lên, vì canonical, sitemap, Open Graph và JSON-LD đều lấy từ đây (mục 7).
