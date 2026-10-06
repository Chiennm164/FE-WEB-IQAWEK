# Kewaqi — website doanh nghiệp tĩnh (dự án mẫu)

Website song ngữ **Trung / Anh** của một công ty sản xuất dụng cụ làm vườn, chuyển từ CMS PHP (ESPCMS) sang **site tĩnh** dựng bằng [Eleventy](https://www.11ty.dev/).
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
| Giao diện | jQuery 1.11.1, Swiper 5.2.1, WOW.js 0.1.6, Animate.css, lightGallery 1.6.4 | Giữ nguyên từ template "netskin" của site cũ |

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
| `npm run clean` | Xoá `dist/` |

Trang để thử: `/` (tự chuyển sang `/cn/`), `/en/`, `/cn/products/`, `/cn/product/c558/`, `/en/about-kewaqi/`, `/cn/contact-us/`, `/cn/search/?q=g26`.

> Không mở trực tiếp file `dist/*.html` trong trình duyệt: site dùng đường dẫn tuyệt đối (`/assets/…`, `/cn/…`) nên phải xem qua server.

## 3. Cấu trúc thư mục

```
├── eleventy.config.js            # cấu hình build, filter danh mục, collection chia trang
├── package.json                  # lệnh npm + phiên bản Eleventy
├── tools/
│   └── check-links.mjs           # kiểm tra link / ảnh hỏng trong dist/
└── src/                          # toàn bộ mã nguồn (Eleventy đọc từ đây)
    ├── _data/                    # dữ liệu dùng chung, mọi template đều đọc được
    │   ├── site.json             #   cấu hình chung + chữ giao diện cn/en
    │   ├── categories.json       #   cây danh mục: menu, banner, URL, cặp dịch cn↔en
    │   ├── hot.json              #   id sản phẩm "hot" ở sidebar
    │   └── redirects.json        #   URL cũ (index.php?…) → URL mới
    ├── _includes/
    │   ├── layouts/              # bố cục trang
    │   │   ├── base.njk          #   khung chung: <head>, header, menu, footer, script
    │   │   ├── home.njk          #   trang chủ
    │   │   ├── page.njk          #   trang tĩnh (giới thiệu, dịch vụ, liên hệ)
    │   │   ├── product.njk       #   chi tiết sản phẩm
    │   │   └── news.njk          #   chi tiết tin tức
    │   └── partials/
    │       └── ui.njk            # macro: banner, breadcrumb, sidebar, phân trang
    ├── content/                  # nội dung — mỗi file là một trang
    │   ├── content.11tydata.js   #   tính URL từ vị trí file
    │   └── cn/ · en/             #   một thư mục cho mỗi ngôn ngữ
    │       ├── cn.json · en.json #     gán ngôn ngữ cho mọi file bên trong
    │       ├── index.html        #     trang chủ
    │       ├── products/         #     sản phẩm (products.json: layout + tag)
    │       ├── news/             #     tin tức (news.json)
    │       └── pages/            #     giới thiệu, dịch vụ, liên hệ (pages.json)
    ├── routes/                   # trang sinh ra từ dữ liệu, không có file nội dung riêng
    │   ├── lists.njk             #   trang danh mục sản phẩm / tin (có chia trang)
    │   ├── search.njk            #   trang tìm kiếm sản phẩm
    │   ├── index.njk             #   "/" → chuyển tới ngôn ngữ mặc định
    │   └── _redirects.njk        #   chuyển hướng 301 từ URL cũ (định dạng Netlify)
    └── assets/                   # chép nguyên sang dist/assets/
        ├── css/                  #   animate, swiper, reset, main (trang con), index (trang chủ), lightGallery
        ├── js/                   #   jquery, swiper, wow, lightGallery, main, forms, mapcn / mapen (bản đồ)
        ├── fonts/                #   font chữ giao diện + font icon của lightGallery
        ├── iconfont/             #   iconfont-common (mọi trang), -pages (trang con), -contact (trang liên hệ)
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
| `content/cn/index.html` | `home.njk` (khai báo trong file) | `/cn/` |
| `content/cn/products/c558.html` | `product.njk` | `/cn/product/c558/` |
| `content/en/news/<slug>.html` | `news.njk` | `/en/article/<slug>/` |
| `content/cn/pages/service.html` | `page.njk` | `/cn/service/` |

- Ngôn ngữ: từ `cn.json` / `en.json`. Layout: từ `products.json`, `news.json`, `pages.json` trong từng thư mục; hai file đầu còn gắn tag `product` / `news` để tạo collection.
- URL: tính trong `content/content.11tydata.js` theo tên file.
- File nội dung `.html` là **HTML thuần** (cấu hình `htmlTemplateEngine: false`) — không dùng được cú pháp Nunjucks `{{ }}` / `{% %}` bên trong.

### 4.2 Trang sinh từ dữ liệu (`src/routes/`)

| Template | Sinh ra | Nguồn dữ liệu |
|---|---|---|
| `lists.njk` | Trang danh mục, mỗi danh mục kiểu `products` / `news` một trang (kèm danh mục con cháu). Chia trang: 12 sản phẩm / 10 tin mỗi trang; trang 2 trở đi ở `<url danh mục>page/2/` | collection `categoryPages` trong `eleventy.config.js` |
| `search.njk` | `/cn/search/`, `/en/search/` — liệt kê mọi sản phẩm, lọc phía trình duyệt theo `?q=` (khớp tên + mã, không phân biệt hoa thường) | collection `product` |
| `index.njk` | `/` — chuyển tới `/<defaultLang>/` | `site.json` |
| `_redirects.njk` | `dist/_redirects` | `redirects.json` |

### 4.3 Quy tắc chung

- **Sắp xếp:** sản phẩm / tin luôn xếp theo `id` **giảm dần** (id lớn đứng trước) — trong danh mục, "sản phẩm liên quan", "tin mới nhất", tìm kiếm. "Bài trước / sau" của tin tức tính theo `id` tăng dần.
- **Menu:** header và footer lấy các danh mục gốc (`parentId: null`) của ngôn ngữ, xếp theo `order`; menu thả xuống hiện một cấp con. Sidebar sản phẩm hiện hai cấp dưới danh mục gốc `products`; sidebar tin hiện các danh mục con của `news`.
- **Nút chuyển ngôn ngữ:** đang ở đúng trang danh mục → sang danh mục tương ứng (`translationId`); các trang khác → trang chủ ngôn ngữ kia.
- **Tiêu đề trang:** `<tên>-<danh mục>-<meta.siteTitle>` (sản phẩm, tin), `<tên>-<meta.siteTitle>` (trang khác), chỉ `meta.siteTitle` ở trang chủ.
- **CSS theo trang:** trang chủ dùng `index.css`; trang khác dùng `main.css` + `iconfont-pages.css` (trang liên hệ dùng `iconfont-contact.css` thay thế).

## 5. Hướng dẫn quản lý nội dung

Sau mỗi thay đổi: xem lại bằng `npm start`, rồi `npm run build` + `npm run check` trước khi đưa lên host.

### 5.1 Sản phẩm

Mỗi sản phẩm là một file; bản Trung và bản Anh là **hai file riêng** (hai `id` khác nhau).

1. Tạo `src/content/<cn|en>/products/<slug>.html` — `<slug>` thành URL: `/<lang>/product/<slug>/`.
2. Đặt ảnh vào `src/assets/media/products/<slug tiếng Anh>/` (`thumb.jpg`, `1.jpg`, `2.jpg`, `detail-1.jpg`…). Hai bản ngôn ngữ dùng chung thư mục ảnh.
3. Viết front matter + nội dung:

```yaml
---
id: 160                       # số nguyên duy nhất trong toàn site; lớn hơn = đứng trước
title: "C558"                 # tên hiển thị
model: "C558"                 # mã sản phẩm — dùng cho tìm kiếm
categoryId: 30                # id danh mục (cùng ngôn ngữ) trong categories.json
thumb: /assets/media/products/c558/thumb.jpg      # ảnh vuông 640×640: danh sách, sidebar, liên quan
images:                       # gallery ở trang chi tiết (trống thì dùng thumb)
  - /assets/media/products/c558/1.jpg
  - /assets/media/products/c558/2.png
description: "…"              # thẻ meta description (cắt còn 300 ký tự)
summary: |                    # HTML phần "简述 / Short Description"
  <p>…</p>
---
<p>HTML phần "产品详情 / Products Detail"…</p>
<img src="/assets/media/products/c558/detail-1.jpg">
```

Sản phẩm mới tự xuất hiện ở: trang danh mục của nó và mọi danh mục cha, trang tìm kiếm, "相关产品 / Related Products" (12 sản phẩm id lớn nhất). **Không** tự xuất hiện ở trang chủ (xem 5.5) và sidebar "sản phẩm hot" (xem 5.6).

### 5.2 Tin tức

1. Tạo `src/content/<cn|en>/news/<slug>.html` → URL `/<lang>/article/<slug>/`.
2. Ảnh vào `src/assets/media/news/<slug>/`.

```yaml
---
id: 160                       # duy nhất; dùng để sắp xếp và tính bài trước / sau
title: "…"
categoryId: 33                # danh mục tin: công ty / ngành / triển lãm
published: "2024-01-14 09:15:00"   # hiển thị nguyên văn; sidebar lấy 10 ký tự đầu
thumb: /assets/media/news/<slug>/thumb.jpg     # ảnh 960×480 ở trang danh sách
excerpt: "…"                  # đoạn tóm tắt ở trang danh sách
description: "…"              # meta description
---
<p>Nội dung bài…</p>
```

Có thể dùng ảnh đại diện mặc định `news/default-thumb-cn.png` / `news/default-thumb-en.jpg`.

### 5.3 Danh mục

Danh mục nằm trong `src/_data/categories.json`. Mỗi danh mục cần **một bản cho mỗi ngôn ngữ**, trỏ nhau qua `translationId`.

| Trường | Ý nghĩa |
|---|---|
| `id` | Số duy nhất (dùng chung không gian với id danh mục ngôn ngữ kia) |
| `lang` | `cn` / `en` |
| `type` | `products`, `news`, `about`, `service`, `contact` |
| `parentId` | id danh mục cha; `null` = danh mục gốc (hiện trên menu chính) |
| `order` | Thứ tự trong menu / sidebar (nhỏ đứng trước) |
| `name`, `subtitle` | Tiêu đề và dòng phụ trên banner; `subtitle` trống thì lấy của danh mục có banner |
| `banner` | Ảnh banner; trống thì lấy của danh mục cha gần nhất |
| `slug` | Phần URL, giống nhau giữa hai ngôn ngữ |
| `url` | URL đầy đủ — **tự điền theo quy tắc bên dưới** |
| `translationId` | id danh mục tương ứng ở ngôn ngữ kia |

Quy tắc `url`:

| Loại | URL |
|---|---|
| Gốc sản phẩm / tin | `/<lang>/products/`, `/<lang>/news/` |
| Danh mục con sản phẩm / tin | `/<lang>/products/<slug>/`, `/<lang>/news/<slug>/` |
| Gốc giới thiệu / dịch vụ / liên hệ | `/<lang>/<slug>/` — cần file `content/<lang>/pages/<slug>.html` cùng tên |
| Mục con của trang giới thiệu | `/<lang>/about-kewaqi/#a<id>` (neo trong trang, trang có phần tử `id="a<id>"`) |

Danh mục kiểu `products` / `news` tự có trang danh sách (mục 4.2); không cần tạo file.

### 5.4 Trang tĩnh (giới thiệu, dịch vụ, liên hệ)

File `src/content/<lang>/pages/<slug>.html`, tên file trùng `slug` của danh mục. Thân file là HTML của phần nội dung (giữa breadcrumb và footer).

```yaml
---
title: "关于科瓦崎"
categoryId: 22                # danh mục của trang: banner, breadcrumb, menu đang chọn
ownBanner: true               # (tuỳ chọn) trang tự có banner riêng → bỏ banner + breadcrumb chung
css:                          # (tuỳ chọn) CSS thêm cho riêng trang
  - /assets/css/lightGallery.css
js:                           # (tuỳ chọn) script thêm, nạp cuối trang
  - /assets/js/lightGallery.min.js
inlineScript: |               # (tuỳ chọn) JS chạy sau các script trên (khởi tạo slider…)
  $(function(){ … })
---
<section class="wrap n-about">…</section>
```

### 5.5 Trang chủ

`src/content/<lang>/index.html` là **HTML cố định** (banner, khối danh mục, sản phẩm, xưởng, tin tức). Khi thêm sản phẩm / tin mới, trang chủ **không tự cập nhật** — sửa tay HTML trong file này. Ảnh trang chủ ở `src/assets/media/home/`.

### 5.6 Sản phẩm hot (sidebar)

`src/_data/hot.json` — danh sách `id` theo từng ngôn ngữ, giữ đúng thứ tự hiển thị:

```json
{ "cn": [57, 58, 59, 61, 67, 70], "en": [105, 106, 107, 109, 115, 118] }
```

### 5.7 Chữ giao diện và thông tin công ty — `src/_data/site.json`

| Khoá | Ý nghĩa |
|---|---|
| `defaultLang`, `langs` | Ngôn ngữ mặc định (đích của `/`) và danh sách ngôn ngữ |
| `formEndpoint`, `contactEmail` | Nơi nhận form (mục 5.9) |
| `favicon` | Icon trình duyệt |
| `url` | Tên miền chính thức (dự phòng, template chưa dùng) |
| `cn` / `en` | Chữ giao diện theo nhóm (bên dưới) |

| Nhóm | Gồm |
|---|---|
| `meta` | `htmlLang`, `siteTitle` (đuôi thẻ `<title>`), `keywords`, `description` (mặc định), `company` |
| `header` | `home`, `menu`, `search`, `searchPlaceholder`, `searchShort`, `language`, `langIcon` (icon nút đổi ngôn ngữ) |
| `product` | `hot`, `categoryLabel`, `summary`, `interested`, `inquiry`, `contact`, `backList`, `detail`, `related`, `relatedMore`, `listMore`, `inquiryTitle` |
| `news` | `latest`, `dateLabel`, `prev`, `next`, `more` |
| `search` | `title`, `noResults` |
| `form` | `namePlaceholder`, `emailPlaceholder`, `messagePlaceholder`, `submit`, `thanks`, `mailtoNotice`, `required` |
| `footer` | `links`, `contact`, `share`, `contactHtml` (HTML danh sách liên hệ), `social` (`icon`, `label`, `url`), `copyrightLeft`, `copyrightRight` |

Trong template, `site[lang]` được gán vào biến `t`: `{{ t.product.backList }}`, `{{ t.form.submit }}`.

### 5.8 Ảnh

Chữ thường, tiếng Anh, nối bằng `-`, không dùng mã hash / thời gian.

| Loại | Vị trí |
|---|---|
| Sản phẩm | `media/products/<slug tiếng Anh>/`: `thumb.jpg` (640×640), `1.jpg`, `2.png`… (gallery), `detail-1.jpg`… (ảnh trong phần chi tiết) |
| Tin tức | `media/news/<slug>/1.jpg`…; ảnh đại diện mặc định `media/news/default-thumb-{cn,en}.*` |
| Trang chủ | `media/home/<khối>-<n>`: `banner`, `category`, `product`, `workshop` |
| Giới thiệu | `media/about/workshop-<n>.jpg` + `workshop-<n>-thumb.jpg` |
| Khác | `media/contact/contact-banner.jpg`, `media/categories/<slug>-banner.jpg`, `media/brand/favicon.png` |
| Ảnh giao diện | `images/`: `home-*`, `about-*`, `service-*`, `contact-*` (theo trang), `icon-*`, `footer-*`, `logo.png`, `qrcode.jpg` |

Ảnh đặt trong `src/assets/` được chép nguyên; tham chiếu bằng đường dẫn tuyệt đối `/assets/…`.

### 5.9 Form liên hệ / để lại lời nhắn

Site tĩnh không có máy chủ xử lý form. Mọi `<form data-form>` được `src/assets/js/forms.js` xử lý:

- `formEndpoint` có giá trị (vd. URL Formspree) → gửi form tới đó bằng AJAX.
- `formEndpoint` trống → mở ứng dụng email, gửi tới `contactEmail`.

### 5.10 Chuyển hướng URL cũ

`src/_data/redirects.json` ánh xạ URL của CMS cũ sang URL mới; khi build sinh `dist/_redirects` theo cú pháp Netlify:

```
/index.php  did=154  /cn/product/c558/  301!
```

Host khác Netlify cần chuyển các quy tắc này sang cấu hình của host đó (Nginx, Apache…).

## 6. Tham khảo template

### Layout

| Layout | Dùng cho | Nội dung chính |
|---|---|---|
| `base.njk` | mọi trang | `<head>`, header + menu, menu mobile, footer, script chung. Các layout khác `extends` nó và điền block `title`, `main`, `scripts` |
| `home.njk` | trang chủ | chỉ bỏ phần tên trang khỏi `<title>` |
| `page.njk` | trang tĩnh | banner + breadcrumb (trừ khi `ownBanner`) + HTML trang |
| `product.njk` | sản phẩm | banner, sidebar, gallery, thông tin, chi tiết, sản phẩm liên quan, form để lại lời nhắn |
| `news.njk` | tin tức | banner, sidebar tin, nội dung, bài trước / sau |

### Macro (`partials/ui.njk`)

| Macro | Tác dụng |
|---|---|
| `banner(categoryId)` | Banner đầu trang của danh mục |
| `path(categoryId, lang)` | Breadcrumb |
| `productsSidebar(lang, currentCatId, t, hotProducts)` | Cây danh mục sản phẩm + khối sản phẩm hot |
| `newsSidebar(lang, currentCatId, t, latestNews)` | Danh mục tin + tin mới nhất |
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
| `inCategory` | `items \| inCategory(25)` | lọc theo danh mục (gồm con cháu) |
| `pickByIds` | `items \| pickByIds(hot[lang])` | chọn theo danh sách id, giữ thứ tự |
| `latest` | `items \| latest(12)` | n mục id lớn nhất |
| `prevNext` | `items \| prevNext(id)` | `{ prev, next }` theo id |
| `redirectRule` | dùng trong `_redirects.njk` | một dòng quy tắc Netlify |

Collection: `product`, `news` (theo tag của thư mục), `categoryPages` (trang danh sách đã chia).

Dữ liệu mọi template đều đọc được: `site`, `categories`, `hot`, `redirects` (từ `_data/`), `collections`, và dữ liệu của trang (`lang`, `title`, `categoryId`, …).

Biến `base.njk` tính ở đầu file: `t`, `otherLang`, `currentCatId`, `currentCat`, `currentSection` (danh mục gốc đang chọn), `altLangUrl`; trong `<head>`: `isHome`, `hasPageIconfont`. Block của layout con (`main`, `scripts`…) dùng được các biến này. Riêng **macro** được `import` không thấy biến lẫn dữ liệu trang, nên mọi thứ macro cần (`lang`, `t`, id danh mục…) phải truyền qua tham số.

## 7. Kiểm tra và triển khai

```sh
npm run build    # tạo dist/
npm run check    # phải in "Khong co lien ket hong."
```

Đưa **toàn bộ thư mục `dist/`** lên bất kỳ host tĩnh nào (Netlify, Cloudflare Pages, Vercel, hosting có FTP…):

- Site phải chạy ở **gốc tên miền** (`https://ten-mien/`), không đặt trong thư mục con — mọi đường dẫn đều tuyệt đối.
- Host tự build (Netlify…): lệnh build `npm run build`, thư mục xuất bản `dist`, Node ≥ 18.
- `dist/_redirects` chỉ Netlify hiểu (mục 5.10).

## 8. Quy ước

- Tên file, thư mục, ảnh, slug: chữ thường, tiếng Anh, nối bằng `-` (kebab-case).
- Khoá JSON, biến template, filter: camelCase; khoá trỏ tới id kết thúc bằng `Id` (`categoryId`, `parentId`, `translationId`).
- `id` sản phẩm / tin: số nguyên, không trùng trong toàn site.
- Không sửa CSS / JS gốc trong `assets/css`, `assets/js` trừ khi cố ý đổi giao diện; JS mới viết thành file riêng (như `forms.js`).

## 9. Giới hạn đã biết

- **Không có trang quản trị**: thêm / sửa nội dung bằng cách sửa file rồi build lại.
- **Trang chủ** và **sản phẩm hot** cập nhật thủ công (mục 5.5, 5.6).
- **Form** không lưu trên máy chủ; cần cấu hình `formEndpoint` để nhận trực tiếp.
- **Tìm kiếm** chỉ lọc tên và mã sản phẩm, chạy trên trình duyệt.
- **Bản đồ trang liên hệ** dùng khoá API AMap của site cũ (`content/*/pages/contact-us.html`) — cần thay khoá riêng.
- **Thư viện giao diện cũ** (jQuery 1.11.1) giữ nguyên để không đổi giao diện.
- **Dữ liệu** lấy từ site gốc ngày 06/10/2026: thiếu bản tiếng Trung của sản phẩm "7503 单刃绿篱机"; 4 mục không có nội dung chi tiết (S262 cả hai ngôn ngữ, 2 tin tiếng Anh) — giống site gốc.
