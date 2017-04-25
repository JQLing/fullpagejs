;(function($){
	// 定义私有方法
	/*获取浏览器前缀*/
	/*判断某个元素的CSS样式中是否存在transition属性*/
	/*参数：dom元素*/
	/*返回值：boolean,有则返回浏览器样式前缀，否则返回false*/
    var _prefix = (function(temp){
        var aPrefix = ['webkit','Moz','o','ms'];
		var props = '';
		
		for(var i in aPrefix){
			props = aPrefix[i]+'Transition';
			if(temp.style[props]!==undefined){
				return '-'+aPrefix[i].toLowerCase()+'-';
			}
		}
		return false;
		
    })(document.createElement(PageSwitch));
	
	
   //step3  自执行的匿名函数
//	定义PageSwitch的构造函数
    var PageSwitch = (function(){
        function PageSwitch(element,options){
        /* 存放配置参数   */
//			extend:将用户的自定义的插件参数 与 插件的默认参数加以合并
			
			this.settings=$.extend(true,$.fn.PageSwitch.defaults,options||{});
            this.element=element;
			
        // step5     调用初始化插件init方法
            this.init();
        }
		
		//step4,7
		// 定义PageSwitch（公共）方法
        PageSwitch.prototype={
            /*说明：初始化插件*/
            /*实现：初始化dom结构，布局，分页及绑定事件*/
            init:function(){
                var me=this;   //this 是PageSwitch
//                setTimeout(function(){
//                    console.log(this);   // this 是 window
//                },50);
				me.selectors = me.settings.selectors;
                me.sections =  me.element.find(me.selectors.sections);
				me.section = me.sections.find(me.selectors.section);
				
				me.direction = (me.settings.direction == "vertical")?true:false;
				me.pagesCount = me.pageCount();
				me.index = (me.settings.index>=0 && me.settings.index< me.pagesCount)?me.settings.index:0;
				me.canScroll = true;
				
				if(!me.direction || me.index){
					me._initLayout();
				}
				if(me.settings.pagination){
					me._initPaging();
				}
				
				me._initEvent();
            },
            /*获取滑动页面数量*/
            pageCount:function(){
				return this.section.length;
			},
            /*获取滑动的宽度(横屏)或高度(竖屏)*/
            switchLength:function(){
				return this.direction == 1 ?this.element.height():this.element.width();
			},
			/*向前滑动即上一页面*/
			prve:function(){
				var me = this;
				if(me.index>0){
					me.index --;
				}else if(me.settings.loop){
					me.index = me.pagesCount -1;
				}
				me._scrollPage();
			},
			/*向后滑动即下一页面*/
			next:function(){
				var me = this;
				if(me.index< me.pagesCount){
					me.index ++;
				}else if(me.settings.loop){
					me.index = 0;
				}
				me._scrollPage();
			},
            /*横屏页面布局*/
            _initLayout:function(){
				var me=this;
				if(!me.direction){
					var width = (me.pagesCount*100)+'%';
					var cellWidth = (100/me.pagesCount).toFixed(2)+'%';
					me.sections.width(width);
					me.section.width(cellWidth).css('float','left');
				}
				if(me.index){
					me._scrollPage(true);
				}
			},
            /*实现分页的dom结构及CSS样式*/
            _initPaging:function(){
				var me=this;
				var pageClass = me.selectors.page.substring(1);
				me.activeClass = me.selectors.active.substring(1);
				var pageHtml = '<ul class="'+ pageClass + '">';
				for(var i=0;i<me.pagesCount;i++){
					pageHtml += '<li></li>';
				}
				pageHtml +='</ul>';
				me.element.append(pageHtml);
				
				var pages = me.element.find(me.selectors.page);
				me.pageItem = pages.find('li');
				me.pageItem.eq(me.index).addClass(me.activeClass);
				if(me.direction){
					pages.addClass('vertical');
				}else{
					pages.addClass('horizontal');
				}
				
			},
            /*初始化插件事件*/
            _initEvent:function(){
				var me=this;
				var pages = me.element.find(me.selectors.page);
//				点击事件
				pages.on('click', 'li',function(){
					$(this).addClass('active').siblings('li').removeClass('active');
					me.index = $(this).index();
					me._scrollPage();
				});
//				鼠标滚轮事件
				me.element.on('mousewheel DOMMouseScroll',function(e){
					e.preventDefault();
					if(me.canScroll){
						var delta = e.originalEvent.wheelDelta || -e.originalEvent.detail;
						if(delta>0 && (me.index && !me.settings.loop ||me.settings.loop)){
							me.prve();   //上一页
						}else if(delta<0 && (me.index<(me.pagesCount-1) && !me.settings.loop ||me.settings.loop)){
							me.next();   //下一页
						}
						me.canScroll = true;
					} 
				});
//				键盘事件
				if(me.settings.keyboard){
					$(window).on('keydown',function(e){
						var keyCode = e.keyCode;
						if(keyCode == 37 ||keyCode == 38){
							me.prve();
						}else if(keyCode == 39 ||keyCode == 40){
							me.next();
						}
					});
				}
//				绑定窗口改变事件				
				/*为了不频繁调用resize的回调方法，做了延迟*/
				var resizeId = null;
				$(window).resize(function(){
					clearTimeout(resizeId);
					
					resizeId = setTimeout(function(){
						var currentLength = me.switchLength();
						var offset = me.settings.direction?me.section.eq(me.index).offset().top:me.section.eq(me.index).offset().left;
						
						if(Math.abs(offset)>currentLength/2 && me.index <(me.pagesCount-1)){
							me.index ++;
						}
						if(me.index){
							me._scrollPage();
						}
					},500);
				});
				/*支持CSS3动画的浏览器，绑定transitionend事件(即在动画结束后调用起回调函数)*/
				if(_prefix){
					me.sections.on('transitionend webkitTransitionEnd oTransitionEnd otransitionend',function(){
						me.canScroll = true;
						if(me.settings.callback && $.type(me.settings.callback) == 'function'){
							me.settings.callback();
						}
					});
				}
			},
//			滑动动画
			_scrollPage : function(init){
				var me = this;
				var dest = me.section.eq(me.index).position();
				
				if(!dest) return;
				
				me.canScroll = false;
				if(_prefix){
					var translate = me.direction? 'translateY(-'+dest.top+'px)':'translateX(-'+dest.left+'px)';
					
					me.sections.css(_prefix+'transition','all ' + me.settings.duration+'ms'+me.settings.easing);
					me.sections.css(_prefix+'transform',translate);
					
					
				}else{
					var animateCss = me.direction?{top:-dest.top}:{left:-dest.left};
					me.sections.animate(animateCss,me.settings.duration,function(){
						
						me.canScroll = true;
		
						if(me.settings.callback && $.type(me.settings.callback) == 'function'){
							me.settings.callback();
						}
					});
				}
				if(me.settings.pagination && !init ){
					me.pageItem.eq(me.index).addClass(me.activeClass).siblings('li').removeClass(me.activeClass);
				}
			}
			
			
        };
		return PageSwitch;
    })();
		
    // step1
    $.fn.PageSwitch=function(options){
        /*实现链式调用*/
        return this.each(function(){
			//单例模式
            var me=$(this),
                instance=me.data("PageSwitch");  // 存放插件的实例
            if(!instance){
                instance =new PageSwitch(me,options); // (对象，用户配置的参数)
                me.data("PageSwitch",instance);
            }
//            step6
			// 在外部配置变量，实现方法的调用
            if($.type(options)==="string") {return instance[options]();}
//           eg: $("#container").PageSwitch("init");
        });
    }
    // step2
    $.fn.PageSwitch.defaults={
        selectors:{
            sections:".sections",
            section:".section",
            page:".pages",
            active:".active"
        },
        index:0,            /*页面开始的索引*/
        easing:"ease",		/*动画效果*/
        duration:500,       /*滑动动画多执行的时间*/
        loop:false,		   /*是否循环播放*/
        pagination:true,  /*是否进行分页处理*/
        keyboard:true,		/*是否触发键盘事件*/
        direction:"vertical",  /*竖屏滑动   horizontal:横屏滑动*/
        callback:""          /*实现动画之后调用的回调函数*/
    };
	
	
	
/*  以这样的方式调用，（不配置参数）
		<script>
        	$("#container").PageSwitch({});
		</script>
	
	如果 在这个元素上添加 data-PageSwitch，
	则以这样的方式调用
	
	所有拥有 data-PageSwitch 的对象来初始化插件
    $(function(){
        $("[data-PageSwitch]").PageSwitch();
    })
*/
	
	

	
	
})(jQuery);