;(function($){
    // 定义私有方法
    // 获取浏览器前缀
    var _prefix = (function(temp) {
        var aPrefix = ['webkit','moz','o','ms'];
        var props = '';

        for(var i in aPrefix) {
            props = aPrefix[i] + 'Transition';
            // 判断某个元素的CSS样式中是否存在transition属性，有则返回浏览器样式前缀
            if(temp.style[props] !== undefined) {
                return '-' + aPrefix[i].toLowerCase() + '-';
            }
            return false;
        }
    })(document.createElement(PageSwitch));

    // 自执行的匿名函数
    // 创建自定义类型PageSwitch（组合使用构造函数模式和原型模式）
    var PageSwitch = (function() {
        function PageSwitch(element,options) {
            this.settings = $.extend(true,$.fn.PageSwitch.defaults,options||{});
            this.element = element;
            this.init();
        }
        PageSwitch.prototype = {
            // 初始化插件：初始化dom结构、布局、分页、绑定事件
            init: function() {
                var me = this; // this 是 实例对象
                me.selectors = me.settings.selectors;
                // 获取的是元素,方便求元素的个数和（横屏）宽度
                me.sections = me.element.find(me.selectors.sections);
                me.section = me.sections.find(me.selectors.section);
                // 方向为 boolean
                me.direction = me.settings.direction == 'vertical' ? true : false;
                me.pagesCount = me.pagesCount();
                me.index = (me.settings.index >= 0 && me.settings.index <= me.pagesCount) ? me.settings.index : 0;
                me.canSrcoll = true;
               
                if(me.settings.pagination){
                    me._initPaging();
                }
				 // 横屏
                if(!me.direction || me.index) {
                    me._initLayout();
                }
                me._initEvent();
            },
            // 获取滑动页面数量
            pagesCount: function() {
                return this.section.length;
            },
            // 获取滑动 高度（竖屏）或 宽度（横屏）
            switchLength: function() {
                return this.direction == 1 ? this.element.height() : this.element.width();
            },
            // 上一页
            prve: function() {
                var me = this;
                if(me.index > 0) {
                    me.index -- ;
                }else if(me.settings.loop) {
                    me.index = me.pagesCount - 1;
                }
                me._scrollPage();
            },
            // 下一页
            next: function() {
                var me = this;
                if(me.index < me.pagesCount) {
                    me.index ++ ;
                }else if(me.settings.loop) {
                    me.index = 0;
                }
                me._scrollPage();
            },
            // 横屏页面布局
            _initLayout: function() {
                var me = this;
                if(!me.direction) {
                    var width = (me.pagesCount * 100) + '%';
                    var cellWidth = (100/me.pagesCount).toFixed(2) + '%';

                    me.sections.width(width);
                    me.section.width(cellWidth).css('float','left');
                }
                if(me.index) {
                    me._scrollPage(true);
                }
            },
            // 实现分页dom结构及css样式
            _initPaging: function() {
                var me = this;
                var pageClass = me.selectors.page.substring(1);
                me.activeClass = me.selectors.active.substring(1);
                // 添加dom结构
                var pageHtml = '<ul class="' + pageClass + '">';
                for(var i=0;i<me.pagesCount;i++){
                    pageHtml += '<li></li>'
                }
                pageHtml += '</ul>';
                me.element.append(pageHtml);
                // 改变样式
                var pages = me.element.find(me.selectors.page);
				me.pageItem = pages.find('li');
                me.pageItem.eq(me.index).addClass(me.activeClass);
                if(me.direction) {
                    pages.addClass('vertical');
                } else {
                    pages.addClass('horizontal');
                }
            },
            // 初始化插件事件
            _initEvent: function() {
                var me = this;
                var pages = me.element.find(me.selectors.page);
                // 事件委托
                pages.on('click','li',function() {
                    $(this).addClass(me.activeClass).siblings('li').removeClass(me.activeClass);
                    me.index = $(this).index();
                    me._scrollPage();
                });
                me.element.on('mousewheel DOMMouseScroll',function(e) {
                    // 阻止默认滚动条
                    e.preventDefault();
                    if(me.canSrcoll) {
                        var delta = e.originalEvent.wheelDelta || -e.originalEvent.detail;
                        if(delta > 0 && (me.index && !me.settings.loop || me.settings.loop)) {
                            me.prve();
                        }else if(delta < 0 && (me.index < (me.pagesCount - 1) && !me.settings.loop || me.settings.loop)) {
                            me.next();
                        }
                    }
                });
                if(me.settings.keyboard) {
                    $(window).on('keydown',function(e) {
                        var keyCode = e.keyCode;
                        if(keyCode == 37 || keyCode == 38) {
                            me.prve();
                        }else if(keyCode == 39 || keyCode == 40) {
                            me.next();
                        }
                    });
                }
                // 为了不频繁调用resize的回调方法，做了延迟（超时调用）
                var resizeTimer = null;
                $(window).resize(function() {
                    clearTimeout(resizeTimer);
                    resizeTimer = setTimeout(function() {
                        var currentLength = me.switchLength();
                        var offset = me.direction ? me.section.eq(me.index).offset().top : me.section.eq(me.index).offset().left;
                        console.log('宽度:'+ currentLength + '~~~~~~~~ 偏移量 :'+ offset);
                        if(Math.abs(offset) > currentLength/2 && me.index < (me.pagesCount - 1)) {
                            me.index ++;
                        }
                        if(me.index) {
                            me._scrollPage();
                        }
                    },500);
                });
                // 支持CSS3动画的浏览器，绑定事件transitionend（即在动画结束后 调用回调函数）
                if(_prefix) {
                    me.sections.on('transitionend webkitTransitionEnd oTransitionEnd otransitionend',function() {
                        me.canSrcoll = true;
						
                        if(me.settings.callback && $.type(me.settings.callback) == 'function') {
                            me.settings.callback();
                        }
                    })
                }
            },
            // 滑动动画
            _scrollPage: function(init) {
                var me = this;
                var dest = me.section.eq(me.index).position();
                if(!dest){
                    return;
                }
                 me.canSrcoll = false;
                if(_prefix) {
                    var translate = me.direction ? 'translateY(-'+ dest.top +'px)' : 'translateX(-' + dest.left + 'px)';
					
                    console.log('执行了_scrollPage');
                    me.sections.css(_prefix + 'transition','all ' + me.settings.duration + 'ms ' +me.settings.easing);
                    me.sections.css(_prefix + 'transform',translate);
                }else {
                    var animateCss = me.direction ? {top: -dest.top} : {left: -dest.left};
                    me.sections.animate(animateCss,me.settings.duration,function() {
                         me.canSrcoll = true;
                        if(me.settings.callback && $.type(me.settings.callback) == 'function') {
                            me.settings.callback();
                        }
                    });
                }
                if(me.settings.pagination && !init) {
                     me.pageItem.eq(me.index).addClass(me.activeClass).siblings('li').removeClass(me.activeClass);
                }
            }
        };

        return PageSwitch;
    })();

    $.fn.PageSwitch = function(options) {
        return this.each(function(){
            // 单例模式
            var me = $(this);
            var instance = me.data('PageSwitch');

            if(!instance) {
                instance = new PageSwitch(me,options);
                // 存放插件的实例
                me.data('PageSwitch',instance);
            }
            // eg: $("#container").PageSwitch("init");
            if($.type(options) === 'string'){
                return instance[options]();
            }
        });
    };
    $.fn.PageSwitch.defaults = {
        selectors:{
            sections: ".sections",
            section: ".section",
            page: ".pages",
            active: ".active"
        },
        index: 0,
        easing: "ease",
        duration: 500,
        loop: false,
        keyboard: true,
        direction: "vertical",
        pagination: true,
        callback: ""
    };
})(jQuery);