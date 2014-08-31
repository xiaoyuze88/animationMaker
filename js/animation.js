/*	
** Author : Xiaoyuze
*  contact : xiaoyuze88@gmail.com
*  Version : 0.4
*  Description : 为animationString根据prefixList增加前缀
*				 
*/
;(function($,window) {
	'use strict';

	

	function makeError(obj) {
		var newerr = new Error();
		obj.name && (newerr.name = obj.name);
		obj.message && (newerr.message = obj.message);

		return newerr;
	}

	// Animation 对象
	//@param config [Object] : {
	// 	prefixList : ['-webkit-','-moz-','-ms-'],  //默认['-webkit-']
	// 	useTranslate3d : true/false,   //默认false
	// 	animationName : 'test',
	// 	animationDelay : 1000,   //单位毫秒
	// 	animationTimeFunction : 'linear',
	// 	animationRepeat : 'infinite',
	// 	animationDirection : 'normal',
	//  animationFillMode : 'forwards | backwards | both';
	//     prefix : ['-webkit-']
	// }

	function Animation(config) {
		if(!config) return false;
		this.prefixList = config.prefix || ['-webkit-'];
		this.prefixList.push("");
		this.animationList = [];
		this.useTranslate3d = config.useTranslate3d || false;
		this.units = 'top left right bottom margin padding width height';
		this.animationName = config.animationName;
		this.animationDelay = config.animationDelay || '';
		this.animationTimeFunction = config.animationTimeFunction || '';
		this.animationRepeat = config.animationRepeat || '';
		this.animationDirection = config.animationDirection || '';
		this.animationFillMode = config.animationFillMode || '';
		return this;
	}
	Animation.prototype.transform = function(prefix,xAxis, yAxis, scale, rotate, skew) {
		// console.log(arguments);
		if(void 0 === xAxis && void 0 === !yAxis && void 0 === !scale && void 0 === !rotate && void 0 === !skew) return '';

		var style = prefix + 'transform : ';
		// 如果支持translate3d就使用3d启用gpu，否则用translate
		if (void 0 !== xAxis || void 0 !== yAxis) {
			xAxis = void 0 !== xAxis ? xAxis : 0;
			yAxis = void 0 !== yAxis ? yAxis : 0;
			style += this.useTranslate3d ? "translate3d(" + xAxis + "px," + yAxis + "px,0px)" : "translate(" + xAxis + "px," + yAxis + "px)";
		}
		
		// 如果有设置scale，添加scale
		void 0 !== scale && (style += " scale(" + scale + ")");
		void 0 !== rotate && (style += " rotate(" + rotate + "deg)");
		void 0 !== skew && (style += " skew(" + skew + "deg)");

		style += ';'
		// dom.style[transformString] = style;
		return style;
	}
	// then方法
	// @param : 
	// obj为需要执行的动画参数对象
	// duration为延时,Number，单位毫秒
	// easing 为time function ，String,格式同transition内写法
	// 该函数将生成动画函数，插入任务队列
	Animation.prototype.to = function(obj,duration,easing) {

		this.animationList.push({
			obj : obj,
			duration : duration,
			action : 'moving'
		});
		return this;
		// 根据传入是动画参数还是一个函数，判断push进animationList list的函数体
	}
	Animation.prototype.startWith = function(obj) {
		this.animationList.push({
			obj : obj,
			action : 'start'
		});
		return this;
	}

	// 延时参数，duration : 单位毫秒
	// setTimeout延时后trigger transitionEnd
	Animation.prototype.wait = function(duration) {
		if(duration > 0) {
			var that = this;
			this.animationList.push({
				obj : function(){
					
				},
				duration : duration,
				action : 'delay'
			});
			return this;
		}
	}

	// 调用start，开始执行animationList list中的函数
	Animation.prototype.start = function () {
		this.totalTime = this.sumTime();
		this.totalFrames = this.animationList.length;
		var processList = this.process();
		this.keyFrameString = this.processKeyFrames(processList).join("\r");
		var animationArr = [];
		this.animationName && animationArr.push(this.animationName);
		this.totalTime && animationArr.push(this.totalTime/1000 + 's');
		this.animationDelay && animationArr.push(this.animationDelay/1000 + 's');
		this.animationTimeFunction && animationArr.push(this.animationTimeFunction);
		this.animationRepeat && animationArr.push(this.animationRepeat);
		this.animationDirection && animationArr.push(this.animationDirection);
		this.animationFillMode && animationArr.push(this.animationFillMode);
		var outputStr = '';
		this.prefixList.forEach(function (o,i) {
			outputStr += o + 'animation : ' + animationArr.join(" ") + ";\n";
		})
		this.animationString = outputStr;
		return this;
	}

	Animation.prototype.process = function() {
		var nowFrame = 0;
		var processList = [];
		var that = this;
		this.animationList.forEach(function(o,i) {
			switch ( o.action ) {
				// action == start 说明这是开始帧数，keyframe为0
				case 'start' : 
					processList.push({
						keyframe : 0,
						movement : o.obj
					});
					break;
				// action == moving 说明这是动作帧，keyframe为 duration/total + nowFrame
				case 'moving' : 
					if( i == that.totalFrames - 1) nowFrame = 100; 
					else {
						nowFrame += Math.floor((o.duration/that.totalTime) * 100*10)/10;
					}

					processList.push({
						keyframe : nowFrame,
						movement : o.obj
					});
					break;
				// action == delay  说明这是delay帧，keyframe为duration/total + nowFrame, movment为上一帧的动作
				case 'delay' : 
					if( i == that.totalFrames - 1) nowFrame = 100; 
					else { 
						// nowFrame += (o.duration/that.totalTime) * 100;
						nowFrame += Math.floor((o.duration/that.totalTime) * 100*10)/10;
					}

					processList.push({
						keyframe : nowFrame,
						movement : that.animationList[i-1].obj
					});
					break;
			}
		});
		return processList;
	}

	// 遍历前缀数组，依次生成css代码
	Animation.prototype.processKeyFrames = function(list) {
		var that = this;
		var res = [];
		this.prefixList.forEach(function(prefix,index) {
			res.push(that.renderKeyFrames(list,prefix));
		})
		return res;
	}

	// 遍历每一帧数，依据前缀生成每一帧的css
	Animation.prototype.renderKeyFrames = function(list,prefix) {
		prefix = prefix || '';
		var res = '@' + prefix + 'keyframes ' + this.animationName + ' {\r';
		var that = this;
		list.forEach(function(singleFrame,index) {
			res += that.makeCss(singleFrame.keyframe,singleFrame.movement,prefix);
		});
		res += '\r}\r';
		return res;
	}

	// 生成每一帧css
	Animation.prototype.makeCss = function(frame,movement,prefix) {
		var res = '',
			resArr = [],
			unitPx;

		prefix = prefix || '';

		res += '\t' + frame + '% {\r\t\t'

			!movement && ( movement = {} );

			// 如果4有1 ，调用transform函数
			if(void 0 !== movement.rotate || void 0 !== movement.scale || void 0 !== movement.skew || void 0 !== movement.translate) {
				// 如果需要加前缀，内部transform函数要同时使用带prefix和不带prefix的
				if(prefix) {
					if(!movement.translate) movement.translate = {};
					resArr.push(this.transform(prefix,movement.translate['x'],movement.translate['y'],movement.scale,movement.rotate,movement.skew));
					resArr.push(this.transform('',movement.translate['x'],movement.translate['y'],movement.scale,movement.rotate,movement.skew));
				} else {
					resArr.push(this.transform('',movement.translate['x'],movement.translate['y'],movement.scale,movement.rotate,movement.skew));
				}
			}

			for( var i in movement) {
				if(i == 'rotate' || i == 'scale' || i == 'translate' || i == 'skew') continue;
				else {

					for ( var j = 0, arr = this.units.split(" "),l = arr.length; j < l; j++) {
						// 如果该属性在需要单位的数组内，且这个属性的值是纯数字，加上单位
						if (i.indexOf(arr[j]) > -1 && typeof movement[i] === 'number') {
							unitPx = 'px';
							break;
						} else {
							unitPx = '';
						}
					}
					// console.log(unitPx);
					resArr.push( i + ' : ' + movement[i] + unitPx + ';')
				}
			}
		res += resArr.join("\r\t\t");
		// });

		res += '\r\t}\r';
		return res;
	}

	Animation.prototype.sumTime = function() {
		var getTime = 0;
		this.animationList.forEach(function(o){
			!o.duration && (o.duration = 0);
			getTime += o.duration;
		});
		return getTime;
	}
	$.fn.newAnimation = function(config) {
		var animation = new Animation(config);
		animation.$dom = this;
		return animation;
	}
	window.Animation = Animation;


})($,window)