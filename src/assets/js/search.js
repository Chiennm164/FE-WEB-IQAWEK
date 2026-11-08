// Tìm kiếm: ô tìm kiếm thả xuống ở header (mọi trang, base.njk #hsearch) và trang kết quả /<lang>/search/?q=… (routes/search.njk).
// Dữ liệu: /<lang>/search/index.json (routes/search-index.njk), chỉ tải một lần khi người dùng mở ô tìm kiếm / vào trang kết quả.
// Cách so khớp:
//   - mỗi từ gõ vào phải có mặt, không cần đúng thứ tự; phải khớp nguyên từ, riêng từ cuối được khớp phần đầu từ
//     (đang gõ dở: "khoa" ra "khoan"); từ có chữ số khớp ở bất kỳ đâu ("26ls" trong "G26LS");
//   - gõ không dấu thì không phân biệt dấu ("may cat co" = "máy cắt cỏ"); từ nào gõ có dấu thì so đúng dấu
//     ("thổi" không khớp "thời"); có dấu mà không ra gì (có thể gõ sai dấu) thì tự tìm lại không phân biệt dấu;
//   - tìm trong tên, mã model, chuỗi danh mục trước ("máy cưa xích" ra C558 nhờ danh mục "Máy cưa xích"); chỉ khi không có
//     mục nào khớp mới tìm thêm trong mô tả / tóm tắt (thông số như "42.7cc"), để "cỏ" không ra máy có "động cơ" trong mô tả;
//   - "1" = "một", "2" = "hai": "tỉa hàng rào 2 lưỡi" khớp "Máy tỉa hàng rào hai lưỡi".
// Xếp hạng: trùng mã model > mã model bắt đầu bằng từ khoá > tên bắt đầu bằng / chứa nguyên cụm > số từ có trong tên;
// bằng điểm thì mục mới hơn đứng trước (thứ tự trong index.json).
(function () {
  var root = document.getElementById('hsearch');
  if (!root) return;

  var TEXT = JSON.parse(root.getAttribute('data-i18n') || '{}');
  var INDEX_URL = root.getAttribute('data-index');
  var TEL = root.getAttribute('data-tel');
  var HOTLINE = root.getAttribute('data-hotline');
  var form = root.querySelector('.hsearch-form');
  var SEARCH_URL = form.getAttribute('action');

  /* ================= So khớp ================= */

  var MARKS = /[̀-ͯ]/g;
  // Chữ thường + bỏ dấu từng ký tự: "Máy cắt cỏ" -> "may cat co".
  // Giữ nguyên độ dài chuỗi (mỗi ký tự ra đúng một ký tự) để so dấu và tô đậm đúng vị trí trên chữ gốc.
  function fold(text) {
    var s = lower(text);
    var out = '';
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i);
      var f = ch === 'đ' ? 'd' : ch.normalize('NFD').replace(MARKS, '');
      out += f.length === 1 ? f : ch;
    }
    return out;
  }
  function lower(text) {
    return String(text || '').normalize('NFC').toLowerCase();
  }

  var SPLIT = /[\s,;:!?()[\]{}\/\\|"'“”‘’+*=<>–—_-]+/;
  var ALT = { '1': 'mot', 'mot': '1', '2': 'hai', 'hai': '2' };
  // Từ khoá -> các từ. a = chữ thường có dấu, f = bỏ dấu (cùng độ dài), strict = có gõ dấu (so đúng dấu),
  // kind: 'num' (có chữ số, khớp ở bất kỳ đâu), 'prefix' (từ cuối, có thể đang gõ dở), 'word' (phải là cả một từ);
  // alt = từ tương đương ("2" ~ "hai"). loose = bỏ qua dấu cho mọi từ.
  function parse(raw, loose) {
    var parts = lower(raw).split(SPLIT)
      .map(function (t) { return t.replace(/^\.+|\.+$/g, ''); })
      .filter(Boolean);
    return parts.map(function (a, i) {
      var f = fold(a);
      var tok = {
        a: a,
        f: f,
        strict: !loose && a !== f,
        kind: f.length > 1 && /\d/.test(f) ? 'num' : i === parts.length - 1 ? 'prefix' : 'word'
      };
      if (ALT[f]) tok.alt = { a: ALT[f], f: ALT[f], strict: false, kind: 'word' };
      return tok;
    });
  }

  function wordChar(c) {
    return /[0-9a-z]/.test(c);
  }
  // Các vị trí từ tok xuất hiện trong chữ (fs = bản bỏ dấu, as = bản có dấu, cùng độ dài).
  // all = lấy hết (để tô đậm), không thì dừng ở vị trí đầu tiên (để lọc)
  function positions(fs, as, tok, all) {
    var out = [];
    var len = tok.f.length;
    for (var at = fs.indexOf(tok.f); at !== -1; at = fs.indexOf(tok.f, at + 1)) {
      if (tok.kind !== 'num' && at > 0 && wordChar(fs.charAt(at - 1))) continue; // phải ở đầu một từ
      if (tok.kind === 'word' && wordChar(fs.charAt(at + len))) continue; // phải hết từ
      if (tok.strict && as.substr(at, len) !== tok.a) continue; // gõ có dấu: phải đúng dấu
      out.push(at);
      if (!all) break;
    }
    return out;
  }
  function has(fs, as, tok) {
    return positions(fs, as, tok).length > 0 || (!!tok.alt && positions(fs, as, tok.alt).length > 0);
  }

  // primary: các trường tìm trước (tên, mã model, danh mục); secondary: mô tả / tóm tắt, chỉ dùng khi không mục nào khớp primary
  function prep(list, primary, secondary) {
    return (list || []).map(function (item, i) {
      var pick = function (fields) { return fields.map(function (f) { return item[f] || ''; }).join(' · '); };
      var p = pick(primary);
      var x = p + ' · ' + pick(secondary);
      item.order = i;
      item.pa = lower(p);
      item.pf = fold(p);
      item.xa = lower(x);
      item.xf = fold(x);
      item.ta = lower(item.t);
      item.tf = fold(item.t);
      item.fm = fold(item.m).replace(/[^0-9a-z]/g, '');
      return item;
    });
  }

  // variants = [từ cuối phải là cả một từ, từ cuối được khớp phần đầu từ]. Thử lần lượt: tên / mã / danh mục trước rồi mới tới
  // mô tả; trong mỗi phần, cả từ trước rồi mới phần đầu từ ("may cat co" không ra máy "lưỡi cong", nhưng gõ dở "khoa" vẫn ra "khoan")
  function rank(list, variants, q) {
    var found = [];
    var toks = variants[0];
    [['pf', 'pa'], ['xf', 'xa']].some(function (fields) {
      return variants.some(function (v) {
        toks = v;
        found = list.filter(function (item) {
          return v.every(function (tok) { return has(item[fields[0]], item[fields[1]], tok); });
        });
        return found.length > 0;
      });
    });
    var compact = q.replace(/[^0-9a-z]/g, '');
    return found.map(function (item) {
      var score = 0;
      if (item.fm) {
        if (item.fm === compact) score += 100;
        else if (compact.length > 1 && item.fm.indexOf(compact) === 0) score += 40;
      }
      if (item.tf.indexOf(q) === 0) score += 30;
      else if (item.tf.indexOf(q) !== -1) score += 20;
      toks.forEach(function (tok) { if (has(item.tf, item.ta, tok)) score += 5; });
      return { item: item, score: score };
    }).sort(function (a, b) {
      return b.score - a.score || a.item.order - b.item.order;
    }).map(function (r) { return r.item; });
  }

  var data = null;
  var loading = null;
  function load() {
    if (data) return Promise.resolve(data);
    if (!loading) {
      // no-cache: luôn hỏi lại máy chủ (file không đổi thì chỉ nhận 304), để thêm / sửa sản phẩm là thấy ngay
      loading = fetch(INDEX_URL, { cache: 'no-cache' })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json();
        })
        .then(function (json) {
          data = {
            products: prep(json.products, ['t', 'm', 'c'], ['k']),
            categories: prep(json.categories, ['t'], []),
            articles: prep(json.articles, ['t'], ['k']),
            faq: prep(json.faq, ['t'], ['k'])
          };
          return data;
        })
        .catch(function (err) {
          loading = null; // lần sau thử tải lại
          throw err;
        });
    }
    return loading;
  }

  // Từ khoá chưa đủ 2 chữ / số thì chưa tìm (1 ký tự ra quá nhiều kết quả, không có ích)
  function searchable(raw) {
    return fold(raw).replace(/[^0-9a-z]/g, '').length >= 2;
  }

  function variants(raw, loose) {
    var prefix = parse(raw, loose);
    var word = prefix.map(function (tok) {
      return tok.kind === 'prefix' ? Object.assign({}, tok, { kind: 'word' }) : tok;
    });
    return [word, prefix];
  }

  // toks (để tô đậm) = bản cho khớp phần đầu từ cuối: bao trùm mọi cách khớp đã dùng
  function run(v, q) {
    return {
      toks: v[1],
      products: rank(data.products, v, q),
      categories: rank(data.categories, v, q),
      articles: rank(data.articles, v, q),
      faq: rank(data.faq, v, q)
    };
  }

  function search(raw) {
    var q = fold(raw).replace(/\s+/g, ' ').trim();
    var v = variants(raw);
    if (!v[1].length) return null;
    var r = run(v, q);
    var total = r.products.length + r.categories.length + r.articles.length + r.faq.length;
    if (!total && v[1].some(function (tok) { return tok.strict; })) r = run(variants(raw, true), q);
    return r;
  }

  /* ================= Hiển thị ================= */

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; });
  }
  // "{n} sản phẩm" + {n: 5} -> "5 sản phẩm"; giá trị chèn vào phải là HTML an toàn (đã esc)
  function fmt(tpl, vars) {
    return String(tpl || '').replace(/\{(\w+)\}/g, function (m, k) { return k in vars ? vars[k] : m; });
  }
  // Tô đậm các từ đã gõ trong chữ gốc, theo đúng quy tắc khớp ở trên
  function mark(text, toks) {
    var src = String(text || '').normalize('NFC');
    var low = src.toLowerCase();
    var f = fold(src);
    if (f.length !== src.length || low.length !== src.length) return esc(src);
    var on = [];
    toks.forEach(function (tok) {
      [tok, tok.alt].forEach(function (t) {
        if (!t || t.f.length < 2) return;
        positions(f, low, t, true).forEach(function (at) {
          for (var i = at; i < at + t.f.length; i++) on[i] = true;
        });
      });
    });
    var html = '';
    var open = false;
    for (var j = 0; j < src.length; j++) {
      if (on[j] && !open) { html += '<mark>'; open = true; }
      if (!on[j] && open) { html += '</mark>'; open = false; }
      html += esc(src.charAt(j));
    }
    return html + (open ? '</mark>' : '');
  }
  function searchHref(raw) {
    return SEARCH_URL + '?q=' + encodeURIComponent(raw.trim());
  }
  function hotlineHtml() {
    return '<p class="search-call">' + esc(TEXT.hotline) + ' <a href="' + esc(TEL) + '">' + esc(HOTLINE) + '</a></p>';
  }

  /* ================= Ô tìm kiếm ở header ================= */

  var openBtn = document.getElementById('hsearch-open');
  var backdrop = document.getElementById('hsearch-backdrop');
  var input = root.querySelector('.hsearch-input');
  var clearBtn = root.querySelector('.hsearch-clear');
  var closeBtn = root.querySelector('.hsearch-close');
  var results = root.querySelector('.hsearch-results');
  var idle = root.querySelector('.hsearch-idle');
  var status = root.querySelector('.hsearch-status');
  var MAX = { products: 6, categories: 4, articles: 3, faq: 3 };

  function isOpen() {
    return !root.hidden;
  }

  function open() {
    if (isOpen()) return;
    // Menu ☰ (điện thoại) đang mở thì đóng trước
    var menu = document.querySelector('header .menu-trigger.active');
    if (menu) menu.click();
    root.hidden = false;
    backdrop.hidden = false;
    document.documentElement.classList.add('hsearch-on');
    openBtn.setAttribute('aria-expanded', 'true');
    input.focus(); // gọi ngay trong sự kiện bấm để điện thoại bật bàn phím
    load().catch(function () {}); // tải sẵn dữ liệu trong lúc người dùng gõ
    update();
  }

  function close(restoreFocus) {
    if (!isOpen()) return;
    root.hidden = true;
    backdrop.hidden = true;
    document.documentElement.classList.remove('hsearch-on');
    openBtn.setAttribute('aria-expanded', 'false');
    if (restoreFocus) openBtn.focus();
  }

  function showIdle() {
    results.hidden = true;
    results.innerHTML = '';
    idle.hidden = false;
    status.textContent = '';
  }

  function showMessage(text) {
    results.className = 'hsearch-results';
    results.innerHTML = '<p class="hsearch-msg">' + esc(text) + '</p>';
    results.hidden = false;
    idle.hidden = true;
  }

  function group(title, items, line) {
    if (!items.length) return '';
    return '<div class="hsearch-group"><div class="hsearch-label">' + esc(title) + '</div><ul class="hsearch-links">' +
      items.map(function (item) { return '<li><a href="' + esc(item.u) + '">' + line(item) + '</a></li>'; }).join('') +
      '</ul></div>';
  }

  function render(raw) {
    var r = search(raw);
    if (!r) return showIdle();
    var others = r.categories.length + r.articles.length + r.faq.length;
    var html = '<div class="hsearch-main">';
    if (r.products.length) {
      html += '<div class="hsearch-label">' + esc(TEXT.products) + ' <span>' + r.products.length + '</span></div><ul class="hsearch-products">';
      r.products.slice(0, MAX.products).forEach(function (p) {
        html += '<li><a class="hsearch-product" href="' + esc(p.u) + '">' +
          '<span class="hsearch-thumb"><img src="' + esc(p.i) + '" alt="" loading="lazy"></span>' +
          '<span class="hsearch-text"><span class="hsearch-title">' + mark(p.t, r.toks) + '</span>' +
          (p.c ? '<span class="hsearch-meta">' + esc(p.c) + '</span>' : '') + '</span></a></li>';
      });
      html += '</ul>';
      if (r.products.length > MAX.products) {
        html += '<a class="hsearch-all" href="' + esc(searchHref(raw)) + '">' + esc(fmt(TEXT.viewAll, { n: r.products.length })) +
          ' <i class="icon iconfont icon-arrowRight" aria-hidden="true"></i></a>';
      }
    } else {
      // Không có sản phẩm: lời nhắn, chip danh mục (lấy từ khối idle) và hotline
      var chips = idle.querySelector('.search-chips');
      html += '<div class="hsearch-empty"><p class="hsearch-empty-title">' + fmt(esc(TEXT.noProducts), { q: esc(raw.trim()) }) + '</p>' +
        '<p>' + esc(TEXT.tips) + '</p>' + (chips ? chips.outerHTML : '') + hotlineHtml() + '</div>';
    }
    html += '</div>';
    if (others) {
      html += '<div class="hsearch-side">' +
        group(TEXT.categories, r.categories.slice(0, MAX.categories), function (c) {
          return mark(c.t, r.toks) + ' <span class="hsearch-count">' + c.n + '</span>';
        }) +
        group(TEXT.articles, r.articles.slice(0, MAX.articles), function (a) {
          return mark(a.t, r.toks) + (a.d ? '<span class="hsearch-meta">' + esc(a.d) + '</span>' : '');
        }) +
        group(TEXT.faq, r.faq.slice(0, MAX.faq), function (f) { return mark(f.t, r.toks); }) +
        '</div>';
    }
    results.className = 'hsearch-results' + (others ? ' has-side' : '');
    results.innerHTML = html;
    results.hidden = false;
    idle.hidden = true;
    status.textContent = fmt(TEXT.status, { p: r.products.length, o: others });
  }

  var timer = null;
  function update() {
    var raw = input.value;
    clearBtn.hidden = !raw;
    if (!searchable(raw)) return showIdle();
    if (!data) showMessage(TEXT.loading);
    load().then(function () {
      if (input.value === raw) render(raw);
    }, function () {
      if (input.value === raw) showMessage(TEXT.loadError);
    });
  }

  openBtn.addEventListener('click', function () {
    if (isOpen()) close(true);
    else open();
  });
  closeBtn.addEventListener('click', function () { close(true); });
  backdrop.addEventListener('click', function () { close(false); });
  clearBtn.addEventListener('click', function () {
    input.value = '';
    update();
    input.focus();
  });
  input.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(update, 80);
  });
  form.addEventListener('submit', function (e) {
    if (!input.value.trim()) {
      e.preventDefault();
      input.focus();
    }
  });

  // Esc: đóng. ↑ / ↓: đi qua các kết quả (từ ô nhập xuống kết quả đầu tiên, từ kết quả đầu lên lại ô nhập)
  document.addEventListener('keydown', function (e) {
    if (!isOpen()) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      close(true);
      return;
    }
    if ((e.key !== 'ArrowDown' && e.key !== 'ArrowUp') || !root.contains(document.activeElement)) return;
    var links = [].slice.call(root.querySelectorAll('.hsearch-body a')).filter(function (a) { return a.offsetParent !== null; });
    if (!links.length) return;
    e.preventDefault();
    var i = links.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') links[Math.min(i + 1, links.length - 1)].focus();
    else if (i <= 0) input.focus();
    else links[i - 1].focus();
  });

  /* ================= Trang kết quả ================= */

  var page = document.getElementById('search-page');
  if (!page) return;

  var raw = (new URLSearchParams(location.search).get('q') || '').trim();
  [].forEach.call(document.querySelectorAll('input[name="q"]'), function (el) { el.value = raw; });
  clearBtn.hidden = !raw;
  if (raw) {
    document.getElementById('search-term').textContent = '“' + raw + '”';
    document.title = '“' + raw + '” – ' + document.title;
  }

  var summary = document.getElementById('search-summary');
  var cats = document.getElementById('search-cats');
  var list = document.getElementById('search-list');
  var empty = document.getElementById('search-empty');
  var related = document.getElementById('search-related');
  var card = document.getElementById('search-card').content.firstElementChild;

  load().then(function () {
    var r = raw && searchable(raw) ? search(raw) : null;
    var products = r ? r.products : data.products;

    if (r && !products.length) {
      summary.hidden = true;
      document.getElementById('search-empty-title').innerHTML = fmt(esc(TEXT.noProducts), { q: esc(raw) });
      empty.hidden = false;
    } else {
      summary.innerHTML = r
        ? fmt(esc(TEXT.found), { n: '<strong>' + products.length + '</strong>', q: '<strong>' + esc(raw) + '</strong>' })
        : esc(fmt(TEXT.allProducts, { n: products.length }));
    }

    if (r && r.categories.length) {
      cats.innerHTML = '<span>' + esc(TEXT.categories) + ':</span><ul class="search-chips">' +
        r.categories.slice(0, 5).map(function (c) {
          return '<li><a href="' + esc(c.u) + '">' + esc(c.t) + ' <span>' + c.n + '</span></a></li>';
        }).join('') + '</ul>';
      cats.hidden = false;
    }

    var frag = document.createDocumentFragment();
    products.forEach(function (p) {
      var li = card.cloneNode(true);
      var a = li.querySelector('a');
      var img = li.querySelector('img');
      a.href = p.u;
      a.title = p.t;
      img.src = p.i;
      img.alt = p.t;
      li.querySelector('.title').innerHTML = r ? mark(p.t, r.toks) : esc(p.t);
      frag.appendChild(li);
    });
    list.appendChild(frag);

    var more = r ? r.articles.map(function (a) { return { item: a, tag: TEXT.articles, meta: a.d }; })
      .concat(r.faq.map(function (f) { return { item: f, tag: TEXT.faq, meta: '' }; })) : [];
    if (more.length) {
      related.querySelector('ul').innerHTML = more.map(function (m) {
        return '<li><a href="' + esc(m.item.u) + '"><span class="search-tag">' + esc(m.tag) + '</span>' +
          '<span class="search-rel-title">' + mark(m.item.t, r.toks) + '</span>' +
          (m.meta ? '<span class="search-rel-meta">' + esc(m.meta) + '</span>' : '') + '</a></li>';
      }).join('');
      related.hidden = false;
    }
  }, function () {
    summary.textContent = TEXT.pageError;
  });
})();
