// Trang Hỗ trợ (layouts/support.njk): mở / đóng câu hỏi, thu gọn khối "Dấu hiệu",
// tìm kiếm (gõ có dấu hay không dấu đều được), lọc theo chủ đề, nút mở khung chat Zalo.
(function () {
  var root = document.querySelector('.n-support');
  if (!root) return;
  var items = [].slice.call(root.querySelectorAll('.sp-item'));
  var form = document.getElementById('sp-search');
  var input = document.getElementById('sp-search-input');
  var empty = document.getElementById('sp-empty');
  var topicButtons = [].slice.call(root.querySelectorAll('.sp-topics button'));
  var topic = '';

  // Chữ thường, gộp khoảng trắng; NFC để chữ gõ bằng bộ gõ tổ hợp vẫn so khớp được
  function norm(text) {
    return text.normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim();
  }
  // Bỏ dấu: "không nổ" -> "khong no"
  function plain(text) {
    return text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
  }

  function setOpen(item, open) {
    var question = item.querySelector('.sp-q');
    question.setAttribute('aria-expanded', String(open));
    item.querySelector('.sp-answer').hidden = !open;
  }

  items.forEach(function (item) {
    // Chữ để tìm: câu hỏi, dấu hiệu và các bước (bỏ khối "Lưu ý an toàn" lặp lại ở mọi câu), bản có dấu và bản bỏ dấu
    var parts = item.querySelectorAll('.sp-q-text, .sp-info-list, .sp-step');
    item.searchText = norm([].map.call(parts, function (el) { return el.textContent; }).join(' '));
    item.plainText = plain(item.searchText);

    // Mở một câu thì đóng các câu khác
    item.querySelector('.sp-q').addEventListener('click', function () {
      var open = this.getAttribute('aria-expanded') !== 'true';
      items.forEach(function (other) {
        if (other !== item) setOpen(other, false);
      });
      setOpen(item, open);
    });

    var toggle = item.querySelector('.sp-info-toggle');
    var list = item.querySelector('.sp-info-list');
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      list.hidden = !open;
    });
  });

  // Hiện câu thuộc chủ đề đang chọn và chứa cụm từ đã gõ; trả về số câu còn hiện.
  // Gõ có dấu thì so đúng dấu, gõ không dấu thì so với bản bỏ dấu.
  function filter() {
    var query = norm(input.value);
    var accented = query !== plain(query);
    var visible = 0;
    items.forEach(function (item) {
      var match = (!topic || item.getAttribute('data-topic') === topic) &&
        (accented ? item.searchText : item.plainText).indexOf(query) !== -1;
      item.hidden = !match;
      if (match) visible++;
    });
    empty.hidden = visible !== 0;
    return visible;
  }

  input.addEventListener('input', filter);
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!filter()) return;
    var first = items.filter(function (item) { return !item.hidden; })[0];
    first.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });

  topicButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      topic = button.getAttribute('data-topic');
      topicButtons.forEach(function (other) {
        other.classList.toggle('on', other === button);
        other.setAttribute('aria-pressed', String(other === button));
      });
      filter();
      // Màn hình hẹp: cột chủ đề nằm dưới danh sách, cuộn lên để thấy kết quả
      if (window.matchMedia('(max-width: 850px)').matches) {
        root.querySelector('.sp-main').scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // ---- Hướng dẫn vận hành (#van-hanh): card các bước ① → ⑥ bên phải, mỗi lúc hiện một bước ----
  var tabs = [].slice.call(root.querySelectorAll('.sp-op-tab'));
  var panels = tabs.map(function (tab) { return document.getElementById(tab.getAttribute('aria-controls')); });
  function showStep(id, focus) {
    tabs.forEach(function (tab, i) {
      var on = panels[i].id === id;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      panels[i].hidden = !on;
      if (on && focus) tab.focus();
    });
  }
  if (tabs.length) {
    showStep(panels[0].id);
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { showStep(panels[i].id); });
      // ↑ / ↓ (hoặc ← / →) chuyển bước khi đang ở card các bước
      tab.addEventListener('keydown', function (e) {
        var step = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1 : (e.key === 'ArrowUp' || e.key === 'ArrowLeft') ? -1 : 0;
        if (!step) return;
        e.preventDefault();
        showStep(panels[(i + step + panels.length) % panels.length].id, true);
      });
    });
    // Nút "Bước trước / Bước tiếp theo" cuối mỗi bước: chuyển bước rồi cuộn về đầu khối hướng dẫn
    [].forEach.call(root.querySelectorAll('.sp-op-nav button'), function (button) {
      button.addEventListener('click', function () {
        showStep(button.getAttribute('data-go'));
        document.getElementById('van-hanh').scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  // ---- Thanh tab của trang: Câu hỏi thường gặp (#cau-hoi, mặc định) / Hướng dẫn vận hành (#van-hanh) ----
  var pageTabs = [].slice.call(root.querySelectorAll('.sp-tab'));
  var pagePanels = pageTabs.map(function (tab) { return document.getElementById(tab.getAttribute('aria-controls')); });
  function showTab(id, focus) {
    pageTabs.forEach(function (tab, i) {
      var on = pagePanels[i].id === id;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      pagePanels[i].hidden = !on;
      if (on && focus) tab.focus();
    });
  }
  // Đổi tab thì đổi luôn # trên thanh địa chỉ (copy link gửi người khác vẫn mở đúng tab), không cuộn trang
  function selectTab(i, focus) {
    showTab(pagePanels[i].id, focus);
    if (window.history && history.replaceState) history.replaceState(null, '', '#' + pagePanels[i].id);
  }
  pageTabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { selectTab(i); });
    tab.addEventListener('keydown', function (e) {
      var step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!step) return;
      e.preventDefault();
      selectTab((i + step + pageTabs.length) % pageTabs.length, true);
    });
  });

  // Mở theo # trên địa chỉ: #cau-hoi / #van-hanh = tab; #cau-hoi-3 = câu hỏi (mở sẵn); #van-hanh-buoc-3 = bước; #van-hanh-5 = bài.
  // Hiện đúng tab (và đúng bước), rồi cuộn tới. Chạy khi tải trang và khi # đổi (bấm menu / kết quả tìm kiếm ngay trên trang này)
  function openFromHash(scroll) {
    var target = location.hash.length > 1 && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (!pageTabs.length) {
      if (target && items.indexOf(target) !== -1) setOpen(target, true);
      return;
    }
    var panel = target && target.closest && target.closest('.sp-tabpanel');
    showTab(panel ? panel.id : pagePanels[0].id);
    if (!target) return;
    if (items.indexOf(target) !== -1) setOpen(target, true);
    var step = target.closest('.sp-op-panel');
    if (step) showStep(step.id);
    if (scroll) setTimeout(function () { target.scrollIntoView({ block: 'start' }); }, 50);
  }
  openFromHash(true);
  window.addEventListener('hashchange', function () { openFromHash(true); });
})();
