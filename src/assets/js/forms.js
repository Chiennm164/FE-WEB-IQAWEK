/* Xử lý form có thuộc tính data-form (liên hệ, để lại lời nhắn) — site tĩnh không có máy chủ nhận form.
   Cấu hình window.SITE_FORM do layouts/base.njk sinh từ src/_data/site.json:
   - endpoint có giá trị (vd. Formspree): gửi form tới đó bằng AJAX
   - endpoint trống: mở ứng dụng email, gửi tới mailto */
(function(){
var cfg = window.SITE_FORM || {};
$('form[data-form]').on('submit', function(e){
e.preventDefault();
var form = this, data = $(form).serializeArray(), filled = false, lines = [];
$.each(data, function(_, f){ if (f.value && $(form).find('[name="' + f.name + '"]').attr('type') !== 'hidden') { filled = true; lines.push(($(form).find('[name="' + f.name + '"]').attr('placeholder') || f.name) + ' ' + f.value); } });
if (!filled) { alert(cfg.required); return; }
if (cfg.endpoint) {
$.ajax({ url: cfg.endpoint, method: 'POST', data: $(form).serialize(), dataType: 'json', headers: { Accept: 'application/json' } })
.always(function(){ alert(cfg.thanks); form.reset(); });
} else {
alert(cfg.mail);
location.href = 'mailto:' + cfg.mailto + '?subject=' + encodeURIComponent(document.title.split('|')[0]) + '&body=' + encodeURIComponent(lines.join('\n') + '\n\n' + location.href);
}
});
})();
