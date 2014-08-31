require.config({
	paths: {
		"jquery": "jquery.min",
		"jquery.bootstrap": "bootstrap.min",
		"animation" : "animation",
		'iframe_onload' : 'iframe_onload'
	},
	packages : [
		{
			name : 'codemirror',
			location : '../lib/codemirror',
			main : 'main'
		}
	],
    shim: {
        "jquery.bootstrap": {
            deps: ["jquery"]
        },
        "iframe_onload" : {
        	deps : ["jquery"],
        	exports : "iframe_onload"
        },
        "animation" : {
        	deps:["jquery"]
        }
    }
});

require(['jquery','codemirror','iframe_onload','jquery.bootstrap',"animation"],function($,CodeMirror,iframe_onload) {
	$(function(){
		'use strict';

	/********************************\
		  Initialize static param
	\********************************/

		var UA = navigator.userAgent.toLowerCase(),
			// 根据ua判断mac显示commond，windows显示ctrl
			SYS_STRING = UA.indexOf("mac os") > -1 ? 'Commond' : 'Ctrl',
			// 按钮下面默认显示的文字
			DEFAULT_INFO = '( '+ SYS_STRING +' + s  保存你的代码 )',
			// 缓存按钮下面显示文字的父容器
			BTN_INFO_DOM = $("#running_info"),
			// select的父容器
			SELECT_PDOM = $("#animation_select"),
			// 
			STORAGE_KEY = 'animationKeyframes',
			_CACHE_STR = 'last_code_select',
			// 设置为true，则插入dom内的script不会被删除
			DEBUG_MODE = false;


	/********************************\
			Initialize code mirror
	\********************************/

		window.input = CodeMirror($("#codemirror")[0], {
			// value: value,
			lineNumbers: true,
			mode: "javascript",
			keyMap: "sublime",
			autoCloseBrackets: true,
			matchBrackets: true,
			showCursorWhenSelecting: true,
			theme: "monokai"
		});
		
		window.output = CodeMirror($("#keyframe_output")[0], {
			// value: value,
			lineNumbers: true,
			mode: "javascript",
			keyMap: "sublime",
			autoCloseBrackets: true,
			matchBrackets: true,
			showCursorWhenSelecting: true,
			theme: "monokai"
		});

	/********************************\
			Initialize cache codes
	\********************************/

		if(checkLocalstorage()) {
			// 缓存的animation list
			var data = json_get_parse();
			// 上一次查看的animation name
			var isSelected;
			var lastChoose = localStorage.getItem(_CACHE_STR);
			for (var i in data) {
				isSelected = i == lastChoose ? true : false;
				appendOption(i,isSelected);
			}
			
			lastChoose && data[lastChoose] && window.input.setValue(data[lastChoose]);
		}




	/********************************\
				   UI
	\********************************/

		// 点击打开网站
		$('#header_url_btn').on("click",function(){
			var url = 'http://' + $("#header_url").val();
			checkLocalstorage() && localStorage.setItem("lastUrl",url);
			if(url && $(".iframe").length == 0) {
				$(".row-right").attr("iframe_isshown","true");
				toggleRow();
				_showInfo("Iframe加载中...","warning",true);
			}
			if($(".iframe").length > 0) {
				$(".iframe").remove();
			}
			require(['iframe_onload'],function(iframe_onload) {
				iframe_onload({
					src : url,
					class : 'iframe'
				},function(){
					$("#clear_btn").css({display : "inline-block"});
					window._showInfo("Iframe 已经onload,你可以执行你的代码了!",'success');
					if($(".close-btn").length == 0) {
						$(".iframe-container").append('<span class="glyphicon glyphicon-remove close-btn"></span>');
					}
					setTimeout(function(){
						$(".close-btn").addClass("in");
					},0)
					window.iframe_window = this;
					window.iframe = this.document;
				},".iframe-container")
			});
		});

		$('#header_url').on("keydown",function(e) {
			if(e.keyCode === 13) {
				$('#header_url_btn').trigger("click");
			}
		});

		$(".iframe-container").on('click','.close-btn',function(e){
			$(".iframe").remove();
			$(".close-btn").remove();
			$(".row-right").attr("iframe_isshown","false");
			toggleRow();
		});

		$("#hide_btn").on("click",function(e) {
			var isShow = $(this).hasClass("glyphicon-chevron-right");
			if(isShow) {
				toggleWebsiteRow("hide");
			} else {
				toggleWebsiteRow("show");
			}
			$(this).toggleClass("glyphicon-chevron-right").toggleClass('glyphicon-chevron-left');
		});

		var documentation_dom;
		$("#documentation_btn").on("click",function() {
			!documentation_dom && ( documentation_dom = $("#documentation") );
			documentation_dom.modal("show");
		});

		var tutorial_dom;
		$("#tutorial_btn").on("click",function() {
			!tutorial_dom && ( tutorial_dom = $("#tutorial") );
			tutorial_dom.modal("show");
		});

		// 添加新animation code
		$(".addAnimationList .glyphicon-plus").on("click",function(e) {
			var newName = window.prompt("输入你的新动画代码名称:");
			if(newName) {
				// var nowname = SELECT_PDOM.find("option[selected]").attr("value");
				// str = 
				// setItem(newName,str);
				appendOption(newName,true);
				// SELECT_PDOM.find("option[value="+newName+"]").prop("selected",true).attr("selected",true);
				// 存入缓存
				if( checkLocalstorage() ) {
					localStorage.setItem(_CACHE_STR,newName);
					setItem(newName,'');
				}
				// window.input.setValue('');
				window.input.focus();
				
			} else {
				// alert("Name's empty!");
			}

		});

		// 删除该条animation
		$(".addAnimationList .glyphicon-minus").on("click",function(e) {
			if(confirm('你确定要删除这段代码吗?')) {
				var nowValue = SELECT_PDOM.val();
				if(nowValue) {
					var nowDom = SELECT_PDOM.find("option[value="+nowValue+"]");
					removeItem(nowValue);
					nowDom.remove();

					setTimeout(function(){
						var leftOption = SELECT_PDOM.find("option");
						if(leftOption.length > 0) {
							leftOption = $(leftOption[leftOption.length-1]);

							var value = leftOption.prop("selected",true).attr("value");

							var newCode = getItem(value);
							newCode && window.input.setValue(newCode);
							if( checkLocalstorage() ) {
								localStorage.setItem(_CACHE_STR,value);
							}
						} else {
							// 说明已经删完了
							window.input.setValue("");
						}
					},0)

				}
				return;
			}
		});
		// 改名
		$(".addAnimationList .glyphicon-edit").on("click",function(e) {
			var newName;

			var oldName = SELECT_PDOM.val();
			// 拿到新名字，先将localstorage中的key改名，然后改option与setValue,最后更改_CACHE_STR
			if(newName = prompt("输入新名称:",oldName)) {
				if(newName == oldName) {
					alert("请勿设置成相同的名称!");
					return;
				}
				var allData = json_get_parse();
				if(newName in allData ) {
					alert("该名称已经存在!");
					return;
				}

				var oldData = getItem(oldName);
				setItem(newName,oldData);
				removeItem(oldName);
				SELECT_PDOM.find('option').each(function(){
					if( $(this).attr("value") == oldName) {
						$(this).attr("value",newName).html(newName);
					}
				})
				checkLocalstorage() && localStorage.setItem(_CACHE_STR,newName);
			}
		});

		// 转换select
		SELECT_PDOM.on("change",function(e) {
			var value = $(this).val();
			// 转换后，将当前激活的value缓存
			if(value) {
				localStorage.setItem(_CACHE_STR,value);
				var newData = getItem(value);
				( void 0 !== newData ) && window.input.setValue(newData);
			} else {
				// 说明选择空
				window.input.setValue("");
			}


		});

	/********************************\
			Deal with coding
	\********************************/
			// window.callbackIndex = 0;
		// 点击开始运行代码
		// var getSelector = /start\(([^\)]*)\)/;
		$("#run_btn").on("click",function(){
			autoSave();
			var nowName = SELECT_PDOM.val();

			// 如果当前没有命名动画，则命名为当前时间戳
			nowName = '__animation' + ( nowName || Date.now() );

			var value = 'window["'+nowName+'"] = ';
				
			value += input.getValue();
			value += ';window.output.setValue(window["'+nowName+'"].animationString + window["'+nowName+'"].keyFrameString);' ;
				
			$("body").append('<script id="insert">'+value+'</script>');
			// window.callbackIndex++;

			if(!DEBUG_MODE) {
				setTimeout(function(){
					$("#insert").remove();
				},0);
			}

			// 当插入了iframe，但是未onload
			if($(".iframe").length > 0 && !window.iframe_window) {

				window._showInfo("Iframe仍在加载中!");
				
			} else if(window.iframe_window){
				// iframe dom ready
				var if_doc = $(window.iframe_window.document),
					style_dom = if_doc.find("#insert_style");

				// $(window.iframe_window.document.body).find(selector).attr("style",'');
				// if( style_dom.length > 0 ) {
				// 	style_dom.remove();
				// 	// style_dom.html(localStorage.getItem("keyframes"));
				// }
				// 第一次添加style
				if(style_dom.length == 0) {
					if_doc.find("head").append("<style id='insert_style'>" +window[nowName].keyFrameString +"</style>");
				} else {
					// 往后append style
					if_doc.find("#insert_style").html(if_doc.find("#insert_style").html() + '\n' + window[nowName].keyFrameString)
				}
				
				
				setTimeout(function(){
					window[nowName].$dom.attr('style','');
					setTimeout(function(){
						window[nowName].$dom.attr('style','-webkit-animation : ' + window[nowName].animationString);
					})
				},0);

				// window.d_body = $(window.iframe_window.document.body);
				// window.match_1 = match[1];
			}
		});
	
		// 清楚所有已插入的动画
		$("#clear_btn").on("click",function(){

			if($(".iframe").length > 0 && !window.iframe_window) {

				// window._showInfo("Iframe's not ready!");
				
			} else if(window.iframe_window){
				// iframe dom ready

				var if_doc = $(window.iframe_window.document),
					style_dom = if_doc.find("#insert_style");


				// $(window.iframe_window.document.body).find(selector).attr("style",'');
				if( style_dom.length > 0 ) {
					style_dom.remove();
				}
			}
		})


	/********************************\
				common function
	\********************************/

		function toggleRow() {
			var right = $(".row-right"),
				left = $(".row-left"),
				classW = "col-md-8",
				classN = "col-md-4";

				right.toggleClass(classW).toggleClass(classN);
				left.toggleClass(classN).toggleClass(classW);
		}

		function toggleWebsiteRow(status) {

			var right = $(".row-right"),
				left = $(".row-left"),
				leftClassName = $(".row-right").attr("iframe_isshown") == "true" ? 'col-md-4' : 'col-md-8';

				if(status == 'hide') {

					left.removeClass(leftClassName).addClass("col-md-12");
					right.addClass("hide");
				} else {

					left.removeClass("col-md-12").addClass(leftClassName);
					right.removeClass("hide");
				}
				
		}

		function checkLocalstorage() {
			if( void 0 === window.localStorage) return false;
			else return true;
		}
		

		

		function setItem(key,value) {
			if(!checkLocalstorage() || void 0 === key || void 0 === value) return false;
			var dataStr = json_get_parse();
			dataStr && ( dataStr[key] = value );
			json_save(dataStr)
		}

		function removeItem(key) {
			if( !checkLocalstorage() || void 0 === key ) return false;
			var dataStr = json_get_parse();
			if(dataStr && key in dataStr) delete dataStr[key];
			json_save(dataStr);
		}

		function getItem(key) {
			if( !checkLocalstorage() || void 0 === key ) return false;
			var dataStr = json_get_parse();
			return dataStr[key];
		}

		// 从localStorage中读取STORAGE_KEY的json，转为对象后返回
		function json_get_parse() {
			if( !checkLocalstorage() ) return false;
			var dataStr = localStorage.getItem(STORAGE_KEY);
			if(!dataStr) return {};
			dataStr = JSON.parse(dataStr);
			return dataStr;
		}

		// 将传入的对象转为json字符串并存入STORAGE_KEY
		function json_save(data) {
			if( !checkLocalstorage() || !data ) return false;
			localStorage.setItem(STORAGE_KEY,JSON.stringify(data));
		}

		function autoSave() {
			if(!checkLocalstorage()) window._showInfo("Your browser don't support localStorage , we can't cache your code!",'danger');
			// var option;
			var data,animationName,
				value = SELECT_PDOM.val();

			data = window.input.getValue();
			if(value) setItem(value,data);
		}

		function showCache() {
			var _cache;
			if(!checkLocalstorage()) return;
			// if(_cache = get('input')) input.setValue(_cache);
			if(_cache = localStorage.getItem('lastUrl')) $("#header_url").val(_cache.replace("http://",''));
		}
		var _timeout;

		// type included : primary, success,info,warning,danger
		window._showInfo = function (text,type,wait) {
			type = type || '';
			wait = wait || false;
			// wait表示是否自动返回原始字样
			if(!wait) {
				try {
					clearTimeout(_timeout)
				} catch(e) {}
				BTN_INFO_DOM.addClass('text-' + type);
				BTN_INFO_DOM.html('( ' + text + ' )');
				_timeout = setTimeout(function(){
					recoverInfo()
				},3000);
			} else {
				// wait为true表示不自动返回，需手动调用recoverInfo设置提示
				BTN_INFO_DOM.addClass('text-' + type);
				BTN_INFO_DOM.html('( ' + text + ' )');
			}
		}
		recoverInfo();
		function recoverInfo() {
			BTN_INFO_DOM[0].className = 'text-muted';
			BTN_INFO_DOM.html(DEFAULT_INFO);
		}
		
		function appendOption(newName,selected) {
			selected = selected ? "selected" : '';
			return SELECT_PDOM.append('<option value=' + newName + ' '+selected+'>'+newName+'</option>');

		}

		setTimeout(function(){
			showCache();
		},0)

		;(function(){
			var map = CodeMirror.keyMap.sublime = {fallthrough: "default"};
			var mac = CodeMirror.keyMap["default"] == CodeMirror.keyMap.macDefault;
			var ctrl = mac ? "Cmd-" : "Ctrl-";
			CodeMirror.commands[map[ctrl + "s"] = "save"] = function(cm) {
				autoSave();
				window._showInfo("保存成功!",'success');
			}
			// CodeMirror.commands[map[ctrl + "n"] = "newAnimation"] = function(cm) {
			// 	$(".addAnimationList .glyphicon-plus").trigger("click");
			// }
			CodeMirror.commands[map[ctrl + "/"] = "comment"] = CodeMirror.commands.toggleComment
		})();
	})

})
