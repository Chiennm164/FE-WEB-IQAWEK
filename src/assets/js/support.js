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
    question.querySelector('.sp-plus').textContent = open ? '−' : '+';
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
      toggle.querySelector('.sp-info-chevron').textContent = open ? '⌃' : '⌄';
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

  // Nút "Chat Zalo" mở khung chat nổi (partials/zalo-chat.njk); không có khung chat thì ẩn nút
  var zalo = root.querySelector('[data-open-zalo]');
  var chatButton = document.getElementById('zchat-btn');
  var chatPanel = document.getElementById('zchat-panel');
  if (zalo && chatButton && chatPanel) {
    zalo.addEventListener('click', function () {
      if (chatPanel.hidden) chatButton.click();
    });
  } else if (zalo) {
    zalo.hidden = true;
  }

  // Link thẳng tới một câu hỏi, vd. /vi/support/#cau-hoi-3: mở sẵn câu đó
  var target = location.hash && document.getElementById(location.hash.slice(1));
  if (target && items.indexOf(target) !== -1) setOpen(target, true);
})();
