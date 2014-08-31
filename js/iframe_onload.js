// Author ： Xiaoyuze
// contact ： xiaoyuze88@gmail.com
// 
// 动态插入一个iframe，在iframe onload时触发callback
// 主要用途： 1. 需要准确判断iframe onload；
//          2. 需要在iframe onload后调用iframe中页面window对象上的函数
// 
// @param : option : {
// 			'src' : 'you iframe src',     (必须)iframe的地址
// 
//	 		'css' : {					  (可选)可以设置iframe标签的style,内部使用$iframe.css(option.css);
// 				name : 'value',
// 				name : 'value'
//	 		},
// 
//      	'key' : value,			 	  (可选)其余参数将由$.attr(key,value) 赋给iframe标签
// 		}
// 
// @param : callback    				  (可选)当iframe onload时执行的callback
// @param : parent                        (可选)iframe的父标签的选择器,默认为document.body,代码中用$(parent).append()插入iframe
// 											   可根据需要更换为$.html()或其他函数.
// 
// !!NOTICE!! : 1. 在callback函数中，this指向着iframe的window对象
//              2. 该函数需要jQuery/zepto
// 	
//    具体用法请查看demo.html
// 

(function(mod) {
  if (typeof define == "function" && define.amd)
    return define([], mod);
	else window.createIframe = mod();
})(function(){
	function createIframe(option,callback,parent) {
		if(!$) return;
		if(!option || (option && !option.src)) return false;
		var $if = $(document.createElement("iframe"));
		
		for(var i in option) {
			// 如果
			if ( i == 'css') {
				$if.css(option[i]);
			}
			else {
				void 0 !== option[i] && $if.attr(i,option[i]);
			}
		}

		$if.one("load",function(e){
			typeof callback === 'function' && callback.call(this.contentWindow);
		});

		$(parent || document.body).append($if);
	}
	return createIframe;
})

