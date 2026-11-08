// Header cố định khi cuộn, menu ☰ trên điện thoại; scrollToTarget() cuộn mượt tới phần tử (link neo trong trang).
// Ô tìm kiếm ở header nằm riêng trong search.js

// Mọi slider Swiper của site (banner, danh mục, sản phẩm liên quan / nổi bật, ảnh sản phẩm…), đặt một lần trước khi các trang
// khởi tạo slider: mặc định Swiper (threshold 0) coi chuột nhích dù 1px giữa lúc nhấn và nhả là kéo slider và chặn luôn cú bấm,
// nên bấm vào link trong slider lúc được lúc không. Chỉ coi là kéo khi chuột / ngón tay đi quá 8px.
if (window.Swiper && Swiper.extendDefaults) {
    Swiper.extendDefaults({ threshold: 8 });
}

var scrollTop = 0;
var scrollLocked = false;

// Khoá cuộn trang khi mở menu ☰, nhớ vị trí để trả lại khi đóng
function stopScroll(){
    scrollTop = document.scrollingElement.scrollTop;
    scrollLocked = true;
    document.documentElement.style.overflow='hidden';
    document.body.style.position='fixed';
    document.body.style.top='0px';
    document.body.style.width='100%';
}

function openScroll(){
    // Chỉ trả lại vị trí khi trang đang bị khoá, nếu không sẽ kéo trang về vị trí cũ (mặc định là đầu trang)
    if(!scrollLocked) return;
    scrollLocked = false;
    document.documentElement.style.overflowY='scroll';
    document.body.style.position='static';
    document.scrollingElement.scrollTop = scrollTop;
}

$(function(){
    HF();

    // Trên điện thoại, thanh địa chỉ ẩn / hiện khi cuộn (nhất là ở cuối trang) cũng gây resize nhưng chỉ đổi chiều cao:
    // bỏ qua, chỉ đóng menu khi chiều rộng đổi (xoay màn hình, đổi cửa sổ)
    var lastWidth = window.innerWidth;
    $(window).resize(function(){
        if(window.innerWidth === lastWidth) return;
        lastWidth = window.innerWidth;
        openScroll();
        $('header').removeClass('on');
        $('header .menu-trigger').removeClass('active');
        $('.subnav').removeClass('active');
        $('.overlay').hide();
    });

    $(window).scroll(function() {
        var scrolls = $(this).scrollTop();
        if(scrolls > 50){
            if(!$('header').hasClass('fixed')){
                $('header').addClass('fixed');
            }
        }else{
            $('header').removeClass('fixed');
        }
    });

    // Mở trang bằng link neo (vd. /support/#cau-hoi): trình duyệt cuộn tới nơi đến khi header còn nằm trong trang (cao 88px),
    // rồi header chuyển sang cố định (khi đã cuộn quá 50px) và rút khỏi luồng trang → nội dung bị kéo lên, header che tiêu đề.
    // Cuộn lại một lần sau khi header đã cố định (scroll-margin-top ở reset.css chừa chỗ cho header).
    if (location.hash.length > 1) {
        $(window).on('load', function(){
            var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
            if (target) setTimeout(function(){ target.scrollIntoView({ block: 'start' }); }, 60);
        });
    }

    // Ô tìm kiếm ở header: assets/js/search.js
});

function HF(){
    var flag = true;

    $('header .menu-trigger').click(function(event){
        var that = $(this);
        if(flag){
            flag = false;
            if(that.hasClass('active')){
                that.removeClass('active');
                $('.overlay').hide();
                $('header').removeClass('on');
                $('.subnav').removeClass('active');
                openScroll();
                flag = true;
            }else{
                that.addClass('active');
                $('header').addClass('on');
                $('.subnav').addClass('active');
                $('.overlay').show();
                stopScroll();
                flag = true;
            }
        }
    });

    $('.subnav .menu-box > ul > li > .nav-a').click(function(){
        var that = $(this);
        if(flag){
            flag = false;
            if(that.hasClass('active')){
                that.removeClass('active');
                that.find('i').addClass('icon-zengjia').removeClass('icon-jianhao');
                that.siblings('ul').slideUp();
                flag = true;
            }else{
                that.addClass('active');
                that.find('i').addClass('icon-jianhao').removeClass('icon-zengjia');
                that.siblings('ul').slideDown();
                flag = true;
            }
        }
    });
}

// Cuộn mượt tới phần tử (đặt tên khác window.scrollTo để không đè hàm có sẵn của trình duyệt mà jQuery dùng)
function scrollToTarget(element,speed) {
    if(!speed){
      speed = 300;
    }
    var that = $(element);
    if(!that){
      $("html,body").animate({scrollTop: 0}, speed);
    }else{
      if(that.length > 0){
        $("html,body").animate({scrollTop: that.offset().top - 70}, speed);
      }
    }
}