var scrollTop = 0;
var isTrue = true;
var w = $(document).width();

function isMobile() {
    var userAgentInfo = navigator.userAgent;
    var mobileAgents = [ "Android", "iPhone", "SymbianOS", "Windows Phone", "iPad","iPod"];
    var mobile_flag = false;
    //根据userAgent判断是否是手机
    for (var v = 0; v < mobileAgents.length; v++) {
        if (userAgentInfo.indexOf(mobileAgents[v]) > 0) {
            mobile_flag = true;
            break;
        }
    }
    var screen_width = window.screen.width;
    var screen_height = window.screen.height;   

    //根据屏幕分辨率判断是否是手机
    if(screen_width < 500 && screen_height < 800){
        mobile_flag = true;
    }

    return mobile_flag;
}

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

    $('.subnav .lan-box h2').click(function(){
        var that = $(this);
        var i = that.find('i.icon-xiajiantou');
        if(flag){
            flag = false;
            if(i.hasClass('active')){
                i.removeClass('active');
                that.siblings('ul').slideUp();
                flag = true;
            }else{
                i.addClass('active');
                that.siblings('ul').slideDown();
                flag = true;
            }
        }
    });
}

function Hover(obj, calssName) {
    obj.hover(function(){
        $(this).addClass(calssName);
    },function(){
        $(this).removeClass(calssName);
    })
}

function GetQueryString(name){
    var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
    var r = window.location.search.substr(1).match(reg);
    if(r!=null)return  unescape(r[2]); return null;
}

function stopScrolling(event) {
    event.preventDefault();
}

function scrollTo(element,speed) {
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