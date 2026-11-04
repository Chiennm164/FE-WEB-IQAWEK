// Header cố định khi cuộn, menu ☰ trên điện thoại, hộp tìm kiếm; scrollToTarget() dùng cho link neo (#a23…) ở trang Giới thiệu
var scrollTop = 0;

function stopScroll(){
    scrollTop = document.scrollingElement.scrollTop;
    document.documentElement.style.overflow='hidden';
    document.body.style.position='fixed';
    document.body.style.top='0px';
    document.body.style.width='100%';
}

function openScroll(){
    document.documentElement.style.overflowY='scroll';
    document.body.style.position='static';
    document.scrollingElement.scrollTop = scrollTop;
}

$(function(){
    HF();

    $(window).resize(function(){
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

    $('.header-search').click(function(){
        $('.search-box').fadeIn(200);
        stopScroll();
    });

    $('.search-box .close').click(function(){
        $('.search-box').hide();
        openScroll();
    });
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