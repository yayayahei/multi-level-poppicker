/**
 * 选择列表插件
 * varstion 2.0.0
 * by Houfeng
 * Houfeng@DCloud.io
 */

(function($, window, document, undefined) {

	var MAX_EXCEED = 30;
	var VISIBLE_RANGE = 90;
	var DEFAULT_ITEM_HEIGHT = 40;
	var BLUR_WIDTH = 10;

	var rad2deg = $.rad2deg = function(rad) {
		return rad / (Math.PI / 180);
	};

	var deg2rad = $.deg2rad = function(deg) {
		return deg * (Math.PI / 180);
	};

	var platform = navigator.platform.toLowerCase();
	var userAgent = navigator.userAgent.toLowerCase();
	var isIos = (userAgent.indexOf('iphone') > -1 ||
			userAgent.indexOf('ipad') > -1 ||
			userAgent.indexOf('ipod') > -1) &&
		(platform.indexOf('iphone') > -1 ||
			platform.indexOf('ipad') > -1 ||
			platform.indexOf('ipod') > -1);
	//alert(isIos);

	var Picker = $.Picker = function(holder, options) {
		var self = this;
		self.holder = holder;
		self.options = options || {};
		self.init();
		self.initInertiaParams();
		self.calcElementItemPostion(true);
		self.bindEvent();
	};

	Picker.prototype.findElementItems = function() {
		var self = this;
		self.elementItems = [].slice.call(self.holder.querySelectorAll('li'));
		return self.elementItems;
	};

	Picker.prototype.init = function() {
		var self = this;
		self.list = self.holder.querySelector('ul');
		self.findElementItems();
		self.height = self.holder.offsetHeight;
		self.r = self.height / 2 - BLUR_WIDTH;
		self.d = self.r * 2;
		self.itemHeight = self.elementItems.length > 0 ? self.elementItems[0].offsetHeight : DEFAULT_ITEM_HEIGHT;
		self.itemAngle = parseInt(self.calcAngle(self.itemHeight * 0.8));
		self.hightlightRange = self.itemAngle / 2;
		self.visibleRange = VISIBLE_RANGE;
		self.beginAngle = 0;
		self.beginExceed = self.beginAngle - MAX_EXCEED;
		self.list.angle = self.beginAngle;
		if (isIos) {
			self.list.style.webkitTransformOrigin = "center center " + self.r + "px";
		}
	};

	Picker.prototype.calcElementItemPostion = function(andGenerateItms) {
		var self = this;
		if (andGenerateItms) {
			self.items = [];
		}
		self.elementItems.forEach(function(item) {
			var index = self.elementItems.indexOf(item);
			self.endAngle = self.itemAngle * index;
			item.angle = self.endAngle;
			item.style.webkitTransformOrigin = "center center -" + self.r + "px";
			item.style.webkitTransform = "translateZ(" + self.r + "px) rotateX(" + (-self.endAngle) + "deg)";
			if (andGenerateItms) {
				var dataItem = {};
				dataItem.text = item.innerHTML || '';
				dataItem.value = item.getAttribute('data-value') || dataItem.text;
				self.items.push(dataItem);
			}
		});
		self.endExceed = self.endAngle + MAX_EXCEED;
		self.calcElementItemVisibility(self.beginAngle);
	};

	Picker.prototype.calcAngle = function(c) {
		var self = this;
		var a = b = parseFloat(self.r);
		//直径的整倍数部分直接乘以 180
		c = Math.abs(c); //只算角度不关心正否值
		var intDeg = parseInt(c / self.d) * 180;
		c = c % self.d;
		//余弦
		var cosC = (a * a + b * b - c * c) / (2 * a * b);
		var angleC = intDeg + rad2deg(Math.acos(cosC));
		return angleC;
	};

	Picker.prototype.calcElementItemVisibility = function(angle) {
		var self = this;
		self.elementItems.forEach(function(item) {
			var difference = Math.abs(item.angle - angle);
			if (difference < self.hightlightRange) {
				item.classList.add('highlight');
			} else if (difference < self.visibleRange) {
				item.classList.add('visible');
				item.classList.remove('highlight');
			} else {
				item.classList.remove('highlight');
				item.classList.remove('visible');
			}
		});
	};

	Picker.prototype.setAngle = function(angle) {
		var self = this;
		self.list.angle = angle;
		self.list.style.webkitTransform = "perspective(1000px) rotateY(0deg) rotateX(" + angle + "deg)";
		self.calcElementItemVisibility(angle);
	};

	Picker.prototype.bindEvent = function() {
		var self = this;
		var lastAngle = 0;
		var startY = null;
		var isPicking = false;
		self.holder.addEventListener($.EVENT_START, function(event) {
			isPicking = true;
			event.preventDefault();
			self.list.style.webkitTransition = '';
			startY = (event.changedTouches ? event.changedTouches[0] : event).pageY;
			lastAngle = self.list.angle;
			self.updateInertiaParams(event, true);
		}, false);
		self.holder.addEventListener($.EVENT_END, function(event) {
			isPicking = false;
			event.preventDefault();
			self.startInertiaScroll(event);
		}, false);
		self.holder.addEventListener($.EVENT_CANCEL, function(event) {
			isPicking = false;
			event.preventDefault();
			self.startInertiaScroll(event);
		}, false);
		self.holder.addEventListener($.EVENT_MOVE, function(event) {
			if (!isPicking) {
				return;
			}
			event.preventDefault();
			var endY = (event.changedTouches ? event.changedTouches[0] : event).pageY;
			var dragRange = endY - startY;
			var dragAngle = self.calcAngle(dragRange);
			var newAngle = dragRange > 0 ? lastAngle - dragAngle : lastAngle + dragAngle;
			if (newAngle > self.endExceed) {
				newAngle = self.endExceed
			}
			if (newAngle < self.beginExceed) {
				newAngle = self.beginExceed
			}
			self.setAngle(newAngle);
			self.updateInertiaParams(event);
		}, false);
		//--
		self.list.addEventListener('tap', function(event) {
			elementItem = event.target;
			if (elementItem.tagName == 'LI') {
				self.setSelectedIndex(self.elementItems.indexOf(elementItem), 200);
			}
		}, false);
	};

	Picker.prototype.initInertiaParams = function() {
		var self = this;
		self.lastMoveTime = 0;
		self.lastMoveStart = 0;
		self.stopInertiaMove = false;
	};

	Picker.prototype.updateInertiaParams = function(event, isStart) {
		var self = this;
		var point = event.changedTouches ? event.changedTouches[0] : event;
		if (isStart) {
			self.lastMoveStart = point.pageY;
			self.lastMoveTime = event.timeStamp || Date.now();
			self.startAngle = self.list.angle;
		} else {
			var nowTime = event.timeStamp || Date.now();
			if (nowTime - self.lastMoveTime > 300) {
				self.lastMoveTime = nowTime;
				self.lastMoveStart = point.pageY;
			}
		}
		self.stopInertiaMove = true;
	};

	Picker.prototype.startInertiaScroll = function(event) {
		var self = this;
		var point = event.changedTouches ? event.changedTouches[0] : event;
		/** 
		 * 缓动代码
		 */
		var nowTime = event.timeStamp || Date.now();
		var v = (point.pageY - self.lastMoveStart) / (nowTime - self.lastMoveTime); //最后一段时间手指划动速度  
		var dir = v > 0 ? -1 : 1; //加速度方向  
		var deceleration = dir * 0.0006 * -1;
		var duration = Math.abs(v / deceleration); // 速度消减至0所需时间  
		var dist = v * duration / 2; //最终移动多少 
		var startAngle = self.list.angle;
		var distAngle = self.calcAngle(dist) * dir;
		//----
		var srcDistAngle = distAngle;
		if (startAngle + distAngle < self.beginExceed) {
			distAngle = self.beginExceed - startAngle;
			duration = duration * (distAngle / srcDistAngle) * 0.6;
		}
		if (startAngle + distAngle > self.endExceed) {
			distAngle = self.endExceed - startAngle;
			duration = duration * (distAngle / srcDistAngle) * 0.6;
		}
		//----
		if (distAngle == 0) {
			self.endScroll();
			return;
		}
		self.scrollDistAngle(nowTime, startAngle, distAngle, duration);
	};

	Picker.prototype.scrollDistAngle = function(nowTime, startAngle, distAngle, duration) {
		var self = this;
		self.stopInertiaMove = false;
		(function(nowTime, startAngle, distAngle, duration) {
			var frameInterval = 13;
			var stepCount = duration / frameInterval;
			var stepIndex = 0;
			(function inertiaMove() {
				if (self.stopInertiaMove) return;
				var newAngle = self.quartEaseOut(stepIndex, startAngle, distAngle, stepCount);
				self.setAngle(newAngle);
				stepIndex++;
				if (stepIndex > stepCount - 1 || newAngle < self.beginExceed || newAngle > self.endExceed) {
					self.endScroll();
					return;
				}
				setTimeout(inertiaMove, frameInterval);
			})();
		})(nowTime, startAngle, distAngle, duration);
	};

	Picker.prototype.quartEaseOut = function(t, b, c, d) {
		return -c * ((t = t / d - 1) * t * t * t - 1) + b;
	};

	Picker.prototype.endScroll = function() {
		var self = this;
		if (self.list.angle < self.beginAngle) {
			self.list.style.webkitTransition = "150ms ease-out";
			self.setAngle(self.beginAngle);
		} else if (self.list.angle > self.endAngle) {
			self.list.style.webkitTransition = "150ms ease-out";
			self.setAngle(self.endAngle);
		} else {
			var index = parseInt((self.list.angle / self.itemAngle).toFixed(0));
			self.list.style.webkitTransition = "100ms ease-out";
			self.setAngle(self.itemAngle * index);
		}
		self.triggerChange();
	};

	Picker.prototype.triggerChange = function(force) {
		var self = this;
		setTimeout(function() {
			var index = self.getSelectedIndex();
			var item = self.items[index];
			if ($.trigger && (index != self.lastIndex || force === true)) {
				$.trigger(self.holder, 'change', {
					"index": index,
					"item": item
				});
				//console.log('change:' + index);
			}
			self.lastIndex = index;
			typeof force === 'function' && force();
		}, 0);
	};

	Picker.prototype.correctAngle = function(angle) {
		var self = this;
		if (angle < self.beginAngle) {
			return self.beginAngle;
		} else if (angle > self.endAngle) {
			return self.endAngle;
		} else {
			return angle;
		}
	};

	Picker.prototype.setItems = function(items) {
		var self = this;
		self.items = items || [];
		var buffer = [];
		self.items.forEach(function(item) {
			if (item !== null && item !== undefined) {
				buffer.push('<li>' + (item.text || item) + '</li>');
			}
		});
		self.list.innerHTML = buffer.join('');
		self.findElementItems();
		self.calcElementItemPostion();
		self.setAngle(self.correctAngle(self.list.angle));
		self.triggerChange(true);
	};

	Picker.prototype.getItems = function() {
		var self = this;
		return self.items;
	};

	Picker.prototype.getSelectedIndex = function() {
		var self = this;
		return parseInt((self.list.angle / self.itemAngle).toFixed(0));
	};

	Picker.prototype.setSelectedIndex = function(index, duration, callback) {
		var self = this;
		self.list.style.webkitTransition = '';
		var angle = self.correctAngle(self.itemAngle * index);
		if (duration && duration > 0) {
			var distAngle = angle - self.list.angle;
			self.scrollDistAngle(Date.now(), self.list.angle, distAngle, duration);
		} else {
			self.setAngle(angle);
		}
		self.triggerChange(callback);
	};

	Picker.prototype.getSelectedItem = function() {
		var self = this;
		return self.items[self.getSelectedIndex()];
	};

	Picker.prototype.getSelectedValue = function() {
		var self = this;
		return (self.items[self.getSelectedIndex()] || {}).value;
	};

	Picker.prototype.getSelectedText = function() {
		var self = this;
		return (self.items[self.getSelectedIndex()] || {}).text;
	};

	Picker.prototype.setSelectedValue = function(value, duration, callback) {
		var self = this;
		for (var index in self.items) {
			var item = self.items[index];
			if (item.value == value) {
				self.setSelectedIndex(index, duration, callback);
				return;
			}
		}
	};

	if ($.fn) {
		$.fn.picker = function(options) {
			//遍历选择的元素
			this.each(function(i, element) {
				if (element.picker) return;
				if (options) {
					element.picker = new Picker(element, options);
				} else {
					var optionsText = element.getAttribute('data-picker-options');
					var _options = optionsText ? JSON.parse(optionsText) : {};
					element.picker = new Picker(element, _options);
				}
			});
			return this[0] ? this[0].picker : null;
		};

		//自动初始化
		$.ready(function() {
			$('.mui-picker').picker();
		});
	}

})(window.mui || window, window, document, undefined);
//end
/*!
 * better-normal-scroll v1.8.0
 * (c) 2016-2018 ustbhuangyi
 * Released under the MIT License.
 */
!function(t,i){"object"==typeof exports&&"undefined"!=typeof module?module.exports=i():"function"==typeof define&&define.amd?define(i):t.BScroll=i()}(this,function(){"use strict";function t(){return window.performance&&window.performance.now?window.performance.now()+window.performance.timing.navigationStart:+new Date}function i(t){for(var i=arguments.length,e=Array(i>1?i-1:0),s=1;s<i;s++)e[s-1]=arguments[s];for(var o=0;o<e.length;o++){var n=e[o];for(var r in n)t[r]=n[r]}return t}function e(t){return!1!==_&&("standard"===_?"transitionEnd"===t?"transitionend":t:_+t.charAt(0).toUpperCase()+t.substr(1))}function s(t,i,e,s){t.addEventListener(i,e,{passive:!1,capture:!!s})}function o(t,i,e,s){t.removeEventListener(i,e,{passive:!1,capture:!!s})}function n(t){for(var i=0,e=0;t;)i-=t.offsetLeft,e-=t.offsetTop,t=t.offsetParent;return{left:i,top:e}}function r(t){if(t instanceof window.SVGElement){var i=t.getBoundingClientRect();return{top:i.top,left:i.left,width:i.width,height:i.height}}return{top:t.offsetTop,left:t.offsetLeft,width:t.offsetWidth,height:t.offsetHeight}}function h(t,i){for(var e in i)if(i[e].test(t[e]))return!0;return!1}function a(t,i){var e=document.createEvent("Event");e.initEvent(i,!0,!0),e.pageX=t.pageX,e.pageY=t.pageY,t.target.dispatchEvent(e)}function l(t){var e=void 0;"mouseup"===t.type||"mousecancel"===t.type?e=t:"touchend"!==t.type&&"touchcancel"!==t.type||(e=t.changedTouches[0]);var s={};e&&(s.screenX=e.screenX||0,s.screenY=e.screenY||0,s.clientX=e.clientX||0,s.clientY=e.clientY||0);var o=void 0;"undefined"!=typeof MouseEvent?o=new MouseEvent("click",i({bubbles:!0,cancelable:!1},s)):((o=document.createEvent("Event")).initEvent("click",!0,!1),i(o,s)),o._constructed=!0,t.target.dispatchEvent(o)}function c(t,i){i.firstChild?p(t,i.firstChild):i.appendChild(t)}function p(t,i){i.parentNode.insertBefore(t,i)}function u(t,i){t.removeChild(i)}function d(t,i,e,s,o,n){var r=t-i,h=Math.abs(r)/e,a=n.deceleration,l=n.itemHeight,c=n.swipeBounceTime,p=n.wheel,u=n.swipeTime,d=p?4:15,m=t+h/a*(r<0?-1:1);return p&&l&&(m=Math.round(m/l)*l),m<s?(m=o?s-o/d*h:s,u=c):m>0&&(m=o?o/d*h:0,u=c),{destination:Math.round(m),duration:u}}function m(t){console.error("[BScroll warn]: "+t)}function f(t){var i=document.createElement("div"),e=document.createElement("div");return i.style.cssText="position:absolute;z-index:9999;pointerEvents:none",e.style.cssText="box-sizing:border-box;position:absolute;background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.9);border-radius:3px;",e.className="bscroll-indicator","horizontal"===t?(i.style.cssText+=";height:7px;left:2px;right:2px;bottom:0",e.style.height="100%",i.className="bscroll-horizontal-scrollbar"):(i.style.cssText+=";width:7px;bottom:2px;top:2px;right:1px",e.style.width="100%",i.className="bscroll-vertical-scrollbar"),i.style.cssText+=";overflow:hidden",i.appendChild(e),i}function g(t,i){this.wrapper=i.el,this.wrapperStyle=this.wrapper.style,this.indicator=this.wrapper.children[0],this.indicatorStyle=this.indicator.style,this.scroller=t,this.direction=i.direction,i.fade?(this.visible=0,this.wrapperStyle.opacity="0"):this.visible=1,this.sizeRatioX=1,this.sizeRatioY=1,this.maxPosX=0,this.maxPosY=0,this.x=0,this.y=0,i.interactive&&this._addDOMEvents()}function v(t,i){this.wrapper="string"==typeof t?document.querySelector(t):t,this.wrapper||m("can not resolve the wrapper dom"),this.scroller=this.wrapper.children[0],this.scroller||m("the wrapper need at least one child element to be scroller"),this.scrollerStyle=this.scroller.style,this._init(t,i)}var y=function(){function t(t,i){var e=[],s=!0,o=!1,n=void 0;try{for(var r,h=t[Symbol.iterator]();!(s=(r=h.next()).done)&&(e.push(r.value),!i||e.length!==i);s=!0);}catch(t){o=!0,n=t}finally{try{!s&&h.return&&h.return()}finally{if(o)throw n}}return e}return function(i,e){if(Array.isArray(i))return i;if(Symbol.iterator in Object(i))return t(i,e);throw new TypeError("Invalid attempt to destructure non-iterable instance")}}(),w=function(t){if(Array.isArray(t)){for(var i=0,e=Array(t.length);i<t.length;i++)e[i]=t[i];return e}return Array.from(t)},x=navigator.userAgent.toLowerCase(),T=/wechatdevtools/.test(x),b=x.indexOf("android")>0,S=document.createElement("div").style,_=function(){var t={webkit:"webkitTransform",Moz:"MozTransform",O:"OTransform",ms:"msTransform",standard:"transform"};for(var i in t)if(void 0!==S[t[i]])return i;return!1}(),M=e("transform"),P=e("perspective")in S,X="ontouchstart"in window||T,Y=!1!==M,D=e("transition")in S,E={transform:M,transitionTimingFunction:e("transitionTimingFunction"),transitionDuration:e("transitionDuration"),transitionProperty:e("transitionProperty"),transitionDelay:e("transitionDelay"),transformOrigin:e("transformOrigin"),transitionEnd:e("transitionEnd")},k=1,W={touchstart:k,touchmove:k,touchend:k,mousedown:2,mousemove:2,mouseup:2},H={startX:0,startY:0,scrollX:!1,scrollY:!0,freeScroll:!1,directionLockThreshold:5,eventPassthrough:"",click:!1,tap:!1,bounce:!0,bounceTime:700,momentum:!0,momentumLimitTime:300,momentumLimitDistance:15,swipeTime:2500,swipeBounceTime:500,deceleration:.001,flickLimitTime:200,flickLimitDistance:100,resizePolling:60,probeType:0,preventDefault:!0,preventDefaultException:{tagName:/^(INPUT|TEXTAREA|BUTTON|SELECT)$/},HWCompositing:!0,useTransition:!0,useTransform:!0,bindToWrapper:!1,disableMouse:X,disableTouch:!X,observeDOM:!0,autoBlur:!0,wheel:!1,snap:!1,scrollbar:!1,pullDownRefresh:!1,pullUpLoad:!1,mouseWheel:!1},O={swipe:{style:"cubic-bezier(0.23, 1, 0.32, 1)",fn:function(t){return 1+--t*t*t*t*t}},swipeBounce:{style:"cubic-bezier(0.25, 0.46, 0.45, 0.94)",fn:function(t){return t*(2-t)}},bounce:{style:"cubic-bezier(0.165, 0.84, 0.44, 1)",fn:function(t){return 1- --t*t*t*t}}},L=window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||window.oRequestAnimationFrame||function(t){return window.setTimeout(t,(t.interval||100/60)/2)},z=window.cancelAnimationFrame||window.webkitCancelAnimationFrame||window.mozCancelAnimationFrame||window.oCancelAnimationFrame||function(t){window.clearTimeout(t)},C=1,A=-1,I=1,F=-1;return g.prototype.handleEvent=function(t){switch(t.type){case"touchstart":case"mousedown":this._start(t);break;case"touchmove":case"mousemove":this._move(t);break;case"touchend":case"mouseup":case"touchcancel":case"mousecancel":this._end(t)}},g.prototype.refresh=function(){this.transitionTime(),this._calculate(),this.updatePosition()},g.prototype.fade=function(t,i){var e=this;if(!i||this.visible){var s=t?250:500;t=t?"1":"0",this.wrapperStyle[E.transitionDuration]=s+"ms",clearTimeout(this.fadeTimeout),this.fadeTimeout=setTimeout(function(){e.wrapperStyle.opacity=t,e.visible=+t},0)}},g.prototype.updatePosition=function(){if("vertical"===this.direction){var t=Math.round(this.sizeRatioY*this.scroller.y);if(t<0){this.transitionTime(500);var i=Math.max(this.indicatorHeight+3*t,8);this.indicatorStyle.height=i+"px",t=0}else if(t>this.maxPosY){this.transitionTime(500);var e=Math.max(this.indicatorHeight-3*(t-this.maxPosY),8);this.indicatorStyle.height=e+"px",t=this.maxPosY+this.indicatorHeight-e}else this.indicatorStyle.height=this.indicatorHeight+"px";this.y=t,this.scroller.options.useTransform?this.indicatorStyle[E.transform]="translateY("+t+"px)"+this.scroller.translateZ:this.indicatorStyle.top=t+"px"}else{var s=Math.round(this.sizeRatioX*this.scroller.x);if(s<0){this.transitionTime(500);var o=Math.max(this.indicatorWidth+3*s,8);this.indicatorStyle.width=o+"px",s=0}else if(s>this.maxPosX){this.transitionTime(500);var n=Math.max(this.indicatorWidth-3*(s-this.maxPosX),8);this.indicatorStyle.width=n+"px",s=this.maxPosX+this.indicatorWidth-n}else this.indicatorStyle.width=this.indicatorWidth+"px";this.x=s,this.scroller.options.useTransform?this.indicatorStyle[E.transform]="translateX("+s+"px)"+this.scroller.translateZ:this.indicatorStyle.left=s+"px"}},g.prototype.transitionTime=function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:0;this.indicatorStyle[E.transitionDuration]=t+"ms"},g.prototype.transitionTimingFunction=function(t){this.indicatorStyle[E.transitionTimingFunction]=t},g.prototype.destroy=function(){this._removeDOMEvents(),this.wrapper.parentNode.removeChild(this.wrapper)},g.prototype._start=function(i){var e=i.touches?i.touches[0]:i;i.preventDefault(),i.stopPropagation(),this.transitionTime(),this.initiated=!0,this.moved=!1,this.lastPointX=e.pageX,this.lastPointY=e.pageY,this.startTime=t(),this._handleMoveEvents(s),this.scroller.trigger("beforeScrollStart")},g.prototype._move=function(t){var i=t.touches?t.touches[0]:t;t.preventDefault(),t.stopPropagation(),this.moved||this.scroller.trigger("scrollStart"),this.moved=!0;var e=i.pageX-this.lastPointX;this.lastPointX=i.pageX;var s=i.pageY-this.lastPointY;this.lastPointY=i.pageY;var o=this.x+e,n=this.y+s;this._pos(o,n)},g.prototype._end=function(t){if(this.initiated){this.initiated=!1,t.preventDefault(),t.stopPropagation(),this._handleMoveEvents(o);var i=this.scroller.options.snap;if(i){var e=i.speed,s=i.easing,n=void 0===s?O.bounce:s,r=this.scroller._nearestSnap(this.scroller.x,this.scroller.y),h=e||Math.max(Math.max(Math.min(Math.abs(this.scroller.x-r.x),1e3),Math.min(Math.abs(this.scroller.y-r.y),1e3)),300);this.scroller.x===r.x&&this.scroller.y===r.y||(this.scroller.directionX=0,this.scroller.directionY=0,this.scroller.currentPage=r,this.scroller.scrollTo(r.x,r.y,h,n))}this.moved&&this.scroller.trigger("scrollEnd",{x:this.scroller.x,y:this.scroller.y})}},g.prototype._pos=function(t,i){t<0?t=0:t>this.maxPosX&&(t=this.maxPosX),i<0?i=0:i>this.maxPosY&&(i=this.maxPosY),t=Math.round(t/this.sizeRatioX),i=Math.round(i/this.sizeRatioY),this.scroller.scrollTo(t,i),this.scroller.trigger("scroll",{x:this.scroller.x,y:this.scroller.y})},g.prototype._calculate=function(){if("vertical"===this.direction){var t=this.wrapper.clientHeight;this.indicatorHeight=Math.max(Math.round(t*t/(this.scroller.scrollerHeight||t||1)),8),this.indicatorStyle.height=this.indicatorHeight+"px",this.maxPosY=t-this.indicatorHeight,this.sizeRatioY=this.maxPosY/this.scroller.maxScrollY}else{var i=this.wrapper.clientWidth;this.indicatorWidth=Math.max(Math.round(i*i/(this.scroller.scrollerWidth||i||1)),8),this.indicatorStyle.width=this.indicatorWidth+"px",this.maxPosX=i-this.indicatorWidth,this.sizeRatioX=this.maxPosX/this.scroller.maxScrollX}},g.prototype._addDOMEvents=function(){var t=s;this._handleDOMEvents(t)},g.prototype._removeDOMEvents=function(){var t=o;this._handleDOMEvents(t),this._handleMoveEvents(t)},g.prototype._handleMoveEvents=function(t){this.scroller.options.disableTouch||t(window,"touchmove",this),this.scroller.options.disableMouse||t(window,"mousemove",this)},g.prototype._handleDOMEvents=function(t){this.scroller.options.disableTouch||(t(this.indicator,"touchstart",this),t(window,"touchend",this)),this.scroller.options.disableMouse||(t(this.indicator,"mousedown",this),t(window,"mouseup",this))},function(t){t.prototype._init=function(t,i){this._handleOptions(i),this._events={},this.x=0,this.y=0,this.directionX=0,this.directionY=0,this._addDOMEvents(),this._initExtFeatures(),this._watchTransition(),this.options.observeDOM&&this._initDOMObserver(),this.options.autoBlur&&this._handleAutoBlur(),this.refresh(),this.options.snap||this.scrollTo(this.options.startX,this.options.startY),this.enable()},t.prototype._handleOptions=function(t){this.options=i({},H,t),this.translateZ=this.options.HWCompositing&&P?" translateZ(0)":"",this.options.useTransition=this.options.useTransition&&D,this.options.useTransform=this.options.useTransform&&Y,this.options.preventDefault=!this.options.eventPassthrough&&this.options.preventDefault,this.options.scrollX="horizontal"!==this.options.eventPassthrough&&this.options.scrollX,this.options.scrollY="vertical"!==this.options.eventPassthrough&&this.options.scrollY,this.options.freeScroll=this.options.freeScroll&&!this.options.eventPassthrough,this.options.directionLockThreshold=this.options.eventPassthrough?0:this.options.directionLockThreshold,!0===this.options.tap&&(this.options.tap="tap")},t.prototype._addDOMEvents=function(){var t=s;this._handleDOMEvents(t)},t.prototype._removeDOMEvents=function(){var t=o;this._handleDOMEvents(t)},t.prototype._handleDOMEvents=function(t){var i=this.options.bindToWrapper?this.wrapper:window;t(window,"orientationchange",this),t(window,"resize",this),this.options.click&&t(this.wrapper,"click",this,!0),this.options.disableMouse||(t(this.wrapper,"mousedown",this),t(i,"mousemove",this),t(i,"mousecancel",this),t(i,"mouseup",this)),X&&!this.options.disableTouch&&(t(this.wrapper,"touchstart",this),t(i,"touchmove",this),t(i,"touchcancel",this),t(i,"touchend",this)),t(this.scroller,E.transitionEnd,this)},t.prototype._initExtFeatures=function(){this.options.snap&&this._initSnap(),this.options.scrollbar&&this._initScrollbar(),this.options.pullUpLoad&&this._initPullUp(),this.options.pullDownRefresh&&this._initPullDown(),this.options.wheel&&this._initWheel(),this.options.mouseWheel&&this._initMouseWheel()},t.prototype._watchTransition=function(){if("function"==typeof Object.defineProperty){var t=this,i=!1;Object.defineProperty(this,"isInTransition",{get:function(){return i},set:function(e){i=e;for(var s=t.scroller.children.length?t.scroller.children:[t.scroller],o=i&&!t.pulling?"none":"auto",n=0;n<s.length;n++)s[n].style.pointerEvents=o}})}},t.prototype._handleAutoBlur=function(){this.on("beforeScrollStart",function(){var t=document.activeElement;!t||"INPUT"!==t.tagName&&"TEXTAREA"!==t.tagName||t.blur()})},t.prototype._initDOMObserver=function(){var t=this;if("undefined"!=typeof MutationObserver){var i=void 0,e=new MutationObserver(function(e){if(!t._shouldNotRefresh()){for(var s=!1,o=!1,n=0;n<e.length;n++){var r=e[n];if("attributes"!==r.type){s=!0;break}if(r.target!==t.scroller){o=!0;break}}s?t.refresh():o&&(clearTimeout(i),i=setTimeout(function(){t._shouldNotRefresh()||t.refresh()},60))}}),s={attributes:!0,childList:!0,subtree:!0};e.observe(this.scroller,s),this.on("destroy",function(){e.disconnect()})}else this._checkDOMUpdate()},t.prototype._shouldNotRefresh=function(){var t=this.x>0||this.x<this.maxScrollX||this.y>0||this.y<this.maxScrollY;return this.isInTransition||this.stopFromTransition||t},t.prototype._checkDOMUpdate=function(){function t(){if(!this.destroyed){var t=(e=r(this.scroller)).width,n=e.height;s===t&&o===n||this.refresh(),s=t,o=n,i.call(this)}}function i(){var i=this;setTimeout(function(){t.call(i)},1e3)}var e=r(this.scroller),s=e.width,o=e.height;i.call(this)},t.prototype.handleEvent=function(t){switch(t.type){case"touchstart":case"mousedown":this._start(t);break;case"touchmove":case"mousemove":this._move(t);break;case"touchend":case"mouseup":case"touchcancel":case"mousecancel":this._end(t);break;case"orientationchange":case"resize":this._resize();break;case"transitionend":case"webkitTransitionEnd":case"oTransitionEnd":case"MSTransitionEnd":this._transitionEnd(t);break;case"click":this.enabled&&!t._constructed&&(h(t.target,this.options.preventDefaultException)||(t.preventDefault(),t.stopPropagation()));break;case"wheel":case"DOMMouseScroll":case"mousewheel":this._onMouseWheel(t)}},t.prototype.refresh=function(){var t=r(this.wrapper);this.wrapperWidth=t.width,this.wrapperHeight=t.height;var i=r(this.scroller);this.scrollerWidth=i.width,this.scrollerHeight=i.height;var e=this.options.wheel;e?(this.items=this.scroller.children,this.options.itemHeight=this.itemHeight=this.items.length?this.scrollerHeight/this.items.length:0,void 0===this.selectedIndex&&(this.selectedIndex=e.selectedIndex||0),this.options.startY=-this.selectedIndex*this.itemHeight,this.maxScrollX=0,this.maxScrollY=-this.itemHeight*(this.items.length-1)):(this.maxScrollX=this.wrapperWidth-this.scrollerWidth,this.maxScrollY=this.wrapperHeight-this.scrollerHeight),this.hasHorizontalScroll=this.options.scrollX&&this.maxScrollX<0,this.hasVerticalScroll=this.options.scrollY&&this.maxScrollY<0,this.hasHorizontalScroll||(this.maxScrollX=0,this.scrollerWidth=this.wrapperWidth),this.hasVerticalScroll||(this.maxScrollY=0,this.scrollerHeight=this.wrapperHeight),this.endTime=0,this.directionX=0,this.directionY=0,this.wrapperOffset=n(this.wrapper),this.trigger("refresh"),this.resetPosition()},t.prototype.enable=function(){this.enabled=!0},t.prototype.disable=function(){this.enabled=!1}}(v),function(i){i.prototype._start=function(i){var e=W[i.type];if((e===k||0===i.button)&&!(!this.enabled||this.destroyed||this.initiated&&this.initiated!==e)){this.initiated=e,this.options.preventDefault&&!h(i.target,this.options.preventDefaultException)&&i.preventDefault(),this.moved=!1,this.distX=0,this.distY=0,this.directionX=0,this.directionY=0,this.movingDirectionX=0,this.movingDirectionY=0,this.directionLocked=0,this._transitionTime(),this.startTime=t(),this.options.wheel&&(this.target=i.target),this.stop();var s=i.touches?i.touches[0]:i;this.startX=this.x,this.startY=this.y,this.absStartX=this.x,this.absStartY=this.y,this.pointX=s.pageX,this.pointY=s.pageY,this.trigger("beforeScrollStart")}},i.prototype._move=function(i){if(this.enabled&&!this.destroyed&&W[i.type]===this.initiated){this.options.preventDefault&&i.preventDefault();var e=i.touches?i.touches[0]:i,s=e.pageX-this.pointX,o=e.pageY-this.pointY;this.pointX=e.pageX,this.pointY=e.pageY,this.distX+=s,this.distY+=o;var n=Math.abs(this.distX),r=Math.abs(this.distY),h=t();if(!(h-this.endTime>this.options.momentumLimitTime&&r<this.options.momentumLimitDistance&&n<this.options.momentumLimitDistance)){if(this.directionLocked||this.options.freeScroll||(n>r+this.options.directionLockThreshold?this.directionLocked="h":r>=n+this.options.directionLockThreshold?this.directionLocked="v":this.directionLocked="n"),"h"===this.directionLocked){if("vertical"===this.options.eventPassthrough)i.preventDefault();else if("horizontal"===this.options.eventPassthrough)return void(this.initiated=!1);o=0}else if("v"===this.directionLocked){if("horizontal"===this.options.eventPassthrough)i.preventDefault();else if("vertical"===this.options.eventPassthrough)return void(this.initiated=!1);s=0}s=this.hasHorizontalScroll?s:0,o=this.hasVerticalScroll?o:0,this.movingDirectionX=s>0?F:s<0?I:0,this.movingDirectionY=o>0?A:o<0?C:0;var a=this.x+s,l=this.y+o;(a>0||a<this.maxScrollX)&&(a=this.options.bounce?this.x+s/3:a>0?0:this.maxScrollX),(l>0||l<this.maxScrollY)&&(l=this.options.bounce?this.y+o/3:l>0?0:this.maxScrollY),this.moved||(this.moved=!0,this.trigger("scrollStart")),this._translate(a,l),h-this.startTime>this.options.momentumLimitTime&&(this.startTime=h,this.startX=this.x,this.startY=this.y,1===this.options.probeType&&this.trigger("scroll",{x:this.x,y:this.y})),this.options.probeType>1&&this.trigger("scroll",{x:this.x,y:this.y});var c=document.documentElement.scrollLeft||window.pageXOffset||document.body.scrollLeft,p=document.documentElement.scrollTop||window.pageYOffset||document.body.scrollTop,u=this.pointX-c,d=this.pointY-p;(u>document.documentElement.clientWidth-this.options.momentumLimitDistance||u<this.options.momentumLimitDistance||d<this.options.momentumLimitDistance||d>document.documentElement.clientHeight-this.options.momentumLimitDistance)&&this._end(i)}}},i.prototype._end=function(i){if(this.enabled&&!this.destroyed&&W[i.type]===this.initiated){this.initiated=!1,this.options.preventDefault&&!h(i.target,this.options.preventDefaultException)&&i.preventDefault(),this.trigger("touchEnd",{x:this.x,y:this.y}),this.isInTransition=!1;var e=Math.round(this.x),s=Math.round(this.y),o=e-this.absStartX,n=s-this.absStartY;if(this.directionX=o>0?F:o<0?I:0,this.directionY=n>0?A:n<0?C:0,!this.options.pullDownRefresh||!this._checkPullDown())if(this._checkClick(i))this.trigger("scrollCancel");else if(!this.resetPosition(this.options.bounceTime,O.bounce)){this.scrollTo(e,s),this.endTime=t();var r=this.endTime-this.startTime,a=Math.abs(e-this.startX),l=Math.abs(s-this.startY);if(this._events.flick&&r<this.options.flickLimitTime&&a<this.options.flickLimitDistance&&l<this.options.flickLimitDistance)this.trigger("flick");else{var c=0;if(this.options.momentum&&r<this.options.momentumLimitTime&&(l>this.options.momentumLimitDistance||a>this.options.momentumLimitDistance)){var p=this.hasHorizontalScroll?d(this.x,this.startX,r,this.maxScrollX,this.options.bounce?this.wrapperWidth:0,this.options):{destination:e,duration:0},u=this.hasVerticalScroll?d(this.y,this.startY,r,this.maxScrollY,this.options.bounce?this.wrapperHeight:0,this.options):{destination:s,duration:0};e=p.destination,s=u.destination,c=Math.max(p.duration,u.duration),this.isInTransition=!0}else this.options.wheel&&(s=Math.round(s/this.itemHeight)*this.itemHeight,c=this.options.wheel.adjustTime||400);var m=O.swipe;if(this.options.snap){var f=this._nearestSnap(e,s);this.currentPage=f,c=this.options.snapSpeed||Math.max(Math.max(Math.min(Math.abs(e-f.x),1e3),Math.min(Math.abs(s-f.y),1e3)),300),e=f.x,s=f.y,this.directionX=0,this.directionY=0,m=this.options.snap.easing||O.bounce}if(e!==this.x||s!==this.y)return(e>0||e<this.maxScrollX||s>0||s<this.maxScrollY)&&(m=O.swipeBounce),void this.scrollTo(e,s,c,m);this.options.wheel&&(this.selectedIndex=Math.round(Math.abs(this.y/this.itemHeight))),this.trigger("scrollEnd",{x:this.x,y:this.y})}}}},i.prototype._checkClick=function(t){var i=this.stopFromTransition&&!this.pulling;if(this.stopFromTransition=!1,!this.moved){if(this.options.wheel){if(this.target&&this.target.className===this.options.wheel.wheelWrapperClass){var e=Math.abs(Math.round(this.y/this.itemHeight)),s=Math.round((this.pointY+n(this.target).top-this.itemHeight/2)/this.itemHeight);this.target=this.items[e+s]}return this.scrollToElement(this.target,this.options.wheel.adjustTime||400,!0,!0,O.swipe),!0}return!i&&(this.options.tap&&a(t,this.options.tap),this.options.click&&!h(t.target,this.options.preventDefaultException)&&l(t),!0)}return!1},i.prototype._resize=function(){var t=this;this.enabled&&(b&&(this.wrapper.scrollTop=0),clearTimeout(this.resizeTimeout),this.resizeTimeout=setTimeout(function(){t.refresh()},this.options.resizePolling))},i.prototype._startProbe=function(){function t(){var e=i.getComputedPosition();i.trigger("scroll",e),i.isInTransition?i.probeTimer=L(t):i.trigger("scrollEnd",e)}z(this.probeTimer),this.probeTimer=L(t);var i=this},i.prototype._transitionProperty=function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"transform";this.scrollerStyle[E.transitionProperty]=t},i.prototype._transitionTime=function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:0;if(this.scrollerStyle[E.transitionDuration]=t+"ms",this.options.wheel)for(var i=0;i<this.items.length;i++)this.items[i].style[E.transitionDuration]=t+"ms";if(this.indicators)for(var e=0;e<this.indicators.length;e++)this.indicators[e].transitionTime(t)},i.prototype._transitionTimingFunction=function(t){if(this.scrollerStyle[E.transitionTimingFunction]=t,this.options.wheel)for(var i=0;i<this.items.length;i++)this.items[i].style[E.transitionTimingFunction]=t;if(this.indicators)for(var e=0;e<this.indicators.length;e++)this.indicators[e].transitionTimingFunction(t)},i.prototype._transitionEnd=function(t){t.target===this.scroller&&this.isInTransition&&(this._transitionTime(),this.pulling||this.resetPosition(this.options.bounceTime,O.bounce)||(this.isInTransition=!1,3!==this.options.probeType&&this.trigger("scrollEnd",{x:this.x,y:this.y})))},i.prototype._translate=function(t,i){if(this.options.useTransform?this.scrollerStyle[E.transform]="translate("+t+"px,"+i+"px)"+this.translateZ:(t=Math.round(t),i=Math.round(i),this.scrollerStyle.left=t+"px",this.scrollerStyle.top=i+"px"),this.options.wheel)for(var e=this.options.wheel.rotate,s=void 0===e?25:e,o=0;o<this.items.length;o++){var n=s*(i/this.itemHeight+o);this.items[o].style[E.transform]="rotateX("+n+"deg)"}if(this.x=t,this.y=i,this.indicators)for(var r=0;r<this.indicators.length;r++)this.indicators[r].updatePosition()},i.prototype._animate=function(i,e,s,o){function n(){var p=t();if(p>=c)return r.isAnimating=!1,r._translate(i,e),void(r.pulling||r.resetPosition(r.options.bounceTime)||r.trigger("scrollEnd",{x:r.x,y:r.y}));var u=o(p=(p-l)/s),d=(i-h)*u+h,m=(e-a)*u+a;r._translate(d,m),r.isAnimating&&(r.animateTimer=L(n)),3===r.options.probeType&&r.trigger("scroll",{x:r.x,y:r.y})}var r=this,h=this.x,a=this.y,l=t(),c=l+s;this.isAnimating=!0,z(this.animateTimer),n()},i.prototype.scrollBy=function(t,i){var e=arguments.length>2&&void 0!==arguments[2]?arguments[2]:0,s=arguments.length>3&&void 0!==arguments[3]?arguments[3]:O.bounce;t=this.x+t,i=this.y+i,this.scrollTo(t,i,e,s)},i.prototype.scrollTo=function(t,i){var e=arguments.length>2&&void 0!==arguments[2]?arguments[2]:0,s=arguments.length>3&&void 0!==arguments[3]?arguments[3]:O.bounce;this.isInTransition=this.options.useTransition&&e>0&&(t!==this.x||i!==this.y),!e||this.options.useTransition?(this._transitionProperty(),this._transitionTimingFunction(s.style),this._transitionTime(e),this._translate(t,i),e&&3===this.options.probeType&&this._startProbe(),this.options.wheel&&(i>0?this.selectedIndex=0:i<this.maxScrollY?this.selectedIndex=this.items.length-1:this.selectedIndex=Math.round(Math.abs(i/this.itemHeight)))):this._animate(t,i,e,s.fn)},i.prototype.scrollToElement=function(t,i,e,s,o){if(t&&(t=t.nodeType?t:this.scroller.querySelector(t),!this.options.wheel||t.className===this.options.wheel.wheelItemClass)){var r=n(t);r.left-=this.wrapperOffset.left,r.top-=this.wrapperOffset.top,!0===e&&(e=Math.round(t.offsetWidth/2-this.wrapper.offsetWidth/2)),!0===s&&(s=Math.round(t.offsetHeight/2-this.wrapper.offsetHeight/2)),r.left-=e||0,r.top-=s||0,r.left=r.left>0?0:r.left<this.maxScrollX?this.maxScrollX:r.left,r.top=r.top>0?0:r.top<this.maxScrollY?this.maxScrollY:r.top,this.options.wheel&&(r.top=Math.round(r.top/this.itemHeight)*this.itemHeight),this.scrollTo(r.left,r.top,i,o)}},i.prototype.resetPosition=function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:0,i=arguments.length>1&&void 0!==arguments[1]?arguments[1]:O.bounce,e=this.x,s=Math.round(e);!this.hasHorizontalScroll||s>0?e=0:s<this.maxScrollX&&(e=this.maxScrollX);var o=this.y,n=Math.round(o);return!this.hasVerticalScroll||n>0?o=0:n<this.maxScrollY&&(o=this.maxScrollY),(e!==this.x||o!==this.y)&&(this.scrollTo(e,o,t,i),!0)},i.prototype.getComputedPosition=function(){var t=window.getComputedStyle(this.scroller,null),i=void 0,e=void 0;return this.options.useTransform?(i=+((t=t[E.transform].split(")")[0].split(", "))[12]||t[4]),e=+(t[13]||t[5])):(i=+t.left.replace(/[^-\d.]/g,""),e=+t.top.replace(/[^-\d.]/g,"")),{x:i,y:e}},i.prototype.stop=function(){if(this.options.useTransition&&this.isInTransition){this.isInTransition=!1;var t=this.getComputedPosition();this._translate(t.x,t.y),this.options.wheel?this.target=this.items[Math.round(-t.y/this.itemHeight)]:this.trigger("scrollEnd",{x:this.x,y:this.y}),this.stopFromTransition=!0}else!this.options.useTransition&&this.isAnimating&&(this.isAnimating=!1,this.trigger("scrollEnd",{x:this.x,y:this.y}),this.stopFromTransition=!0)},i.prototype.destroy=function(){this.destroyed=!0,this.trigger("destroy"),this._removeDOMEvents(),this._events={}}}(v),function(t){t.prototype.on=function(t,i){var e=arguments.length>2&&void 0!==arguments[2]?arguments[2]:this;this._events[t]||(this._events[t]=[]),this._events[t].push([i,e])},t.prototype.once=function(t,i){function e(){this.off(t,e),i.apply(s,arguments)}var s=arguments.length>2&&void 0!==arguments[2]?arguments[2]:this;e.fn=i,this.on(t,e)},t.prototype.off=function(t,i){var e=this._events[t];if(e)for(var s=e.length;s--;)(e[s][0]===i||e[s][0]&&e[s][0].fn===i)&&(e[s][0]=void 0)},t.prototype.trigger=function(t){var i=this._events[t];if(i)for(var e=i.length,s=[].concat(w(i)),o=0;o<e;o++){var n=s[o],r=y(n,2),h=r[0],a=r[1];h&&h.apply(a,[].slice.call(arguments,1))}}}(v),function(t){t.prototype._initSnap=function(){var t=this;this.currentPage={};var i=this.options.snap;if(i.loop){var e=this.scroller.children;e.length>0&&(c(e[e.length-1].cloneNode(!0),this.scroller),this.scroller.appendChild(e[1].cloneNode(!0)))}var s=i.el;"string"==typeof s&&(s=this.scroller.querySelectorAll(s)),this.on("refresh",function(){if(t.pages=[],t.wrapperWidth&&t.wrapperHeight&&t.scrollerWidth&&t.scrollerHeight){var e=i.stepX||t.wrapperWidth,o=i.stepY||t.wrapperHeight,n=0,h=void 0,a=void 0,l=void 0,c=0,p=void 0,u=0,d=void 0,m=void 0;if(s)for(p=s.length,d=-1;c<p;c++)m=r(s[c]),(0===c||m.left<=r(s[c-1]).left)&&(u=0,d++),t.pages[u]||(t.pages[u]=[]),n=Math.max(-m.left,t.maxScrollX),h=Math.max(-m.top,t.maxScrollY),a=n-Math.round(m.width/2),l=h-Math.round(m.height/2),t.pages[u][d]={x:n,y:h,width:m.width,height:m.height,cx:a,cy:l},n>t.maxScrollX&&u++;else for(a=Math.round(e/2),l=Math.round(o/2);n>-t.scrollerWidth;){for(t.pages[c]=[],p=0,h=0;h>-t.scrollerHeight;)t.pages[c][p]={x:Math.max(n,t.maxScrollX),y:Math.max(h,t.maxScrollY),width:e,height:o,cx:n-a,cy:h-l},h-=o,p++;n-=e,c++}var f=i.loop?1:0;t._goToPage(t.currentPage.pageX||f,t.currentPage.pageY||0,0);var g=i.threshold;g%1==0?(t.snapThresholdX=g,t.snapThresholdY=g):(t.snapThresholdX=Math.round(t.pages[t.currentPage.pageX][t.currentPage.pageY].width*g),t.snapThresholdY=Math.round(t.pages[t.currentPage.pageX][t.currentPage.pageY].height*g))}}),this.on("scrollEnd",function(){i.loop&&(0===t.currentPage.pageX&&t._goToPage(t.pages.length-2,t.currentPage.pageY,0),t.currentPage.pageX===t.pages.length-1&&t._goToPage(1,t.currentPage.pageY,0))}),!1!==i.listenFlick&&this.on("flick",function(){var e=i.speed||Math.max(Math.max(Math.min(Math.abs(t.x-t.startX),1e3),Math.min(Math.abs(t.y-t.startY),1e3)),300);t._goToPage(t.currentPage.pageX+t.directionX,t.currentPage.pageY+t.directionY,e)}),this.on("destroy",function(){if(i.loop){var e=t.scroller.children;e.length>2&&(u(t.scroller,e[e.length-1]),u(t.scroller,e[0]))}})},t.prototype._nearestSnap=function(t,i){if(!this.pages.length)return{x:0,y:0,pageX:0,pageY:0};var e=0;if(Math.abs(t-this.absStartX)<=this.snapThresholdX&&Math.abs(i-this.absStartY)<=this.snapThresholdY)return this.currentPage;t>0?t=0:t<this.maxScrollX&&(t=this.maxScrollX),i>0?i=0:i<this.maxScrollY&&(i=this.maxScrollY);for(var s=this.pages.length;e<s;e++)if(t>=this.pages[e][0].cx){t=this.pages[e][0].x;break}s=this.pages[e].length;for(var o=0;o<s;o++)if(i>=this.pages[0][o].cy){i=this.pages[0][o].y;break}return e===this.currentPage.pageX&&((e+=this.directionX)<0?e=0:e>=this.pages.length&&(e=this.pages.length-1),t=this.pages[e][0].x),o===this.currentPage.pageY&&((o+=this.directionY)<0?o=0:o>=this.pages[0].length&&(o=this.pages[0].length-1),i=this.pages[0][o].y),{x:t,y:i,pageX:e,pageY:o}},t.prototype._goToPage=function(t){var i=arguments.length>1&&void 0!==arguments[1]?arguments[1]:0,e=arguments[2],s=arguments[3],o=this.options.snap;if(o&&this.pages&&(s=s||o.easing||O.bounce,t>=this.pages.length?t=this.pages.length-1:t<0&&(t=0),this.pages[t])){i>=this.pages[t].length?i=this.pages[t].length-1:i<0&&(i=0);var n=this.pages[t][i].x,r=this.pages[t][i].y;e=void 0===e?o.speed||Math.max(Math.max(Math.min(Math.abs(n-this.x),1e3),Math.min(Math.abs(r-this.y),1e3)),300):e,this.currentPage={x:n,y:r,pageX:t,pageY:i},this.scrollTo(n,r,e,s)}},t.prototype.goToPage=function(t,i,e,s){var o=this.options.snap;if(o){if(o.loop){var n=this.pages.length-2;t>=n?t=n-1:t<0&&(t=0),t+=1}this._goToPage(t,i,e,s)}},t.prototype.next=function(t,i){var e=this.currentPage.pageX,s=this.currentPage.pageY;++e>=this.pages.length&&this.hasVerticalScroll&&(e=0,s++),this._goToPage(e,s,t,i)},t.prototype.prev=function(t,i){var e=this.currentPage.pageX,s=this.currentPage.pageY;--e<0&&this.hasVerticalScroll&&(e=0,s--),this._goToPage(e,s,t,i)},t.prototype.getCurrentPage=function(){var t=this.options.snap;return t?t.loop?i({},this.currentPage,{pageX:this.currentPage.pageX-1}):this.currentPage:null}}(v),function(t){t.prototype.wheelTo=function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:0;this.options.wheel&&(this.y=-t*this.itemHeight,this.scrollTo(0,this.y))},t.prototype.getSelectedIndex=function(){return this.options.wheel&&this.selectedIndex},t.prototype._initWheel=function(){var t=this.options.wheel;t.wheelWrapperClass||(t.wheelWrapperClass="wheel-scroll"),t.wheelItemClass||(t.wheelItemClass="wheel-item"),void 0===t.selectedIndex&&(t.selectedIndex=0,m("wheel option selectedIndex is required!"))}}(v),function(t){t.prototype._initScrollbar=function(){var t=this,i=this.options.scrollbar,e=i.fade,s=void 0===e||e,o=i.interactive,n=void 0!==o&&o;this.indicators=[];var r=void 0;this.options.scrollX&&(r={el:f("horizontal"),direction:"horizontal",fade:s,interactive:n},this._insertScrollBar(r.el),this.indicators.push(new g(this,r))),this.options.scrollY&&(r={el:f("vertical"),direction:"vertical",fade:s,interactive:n},this._insertScrollBar(r.el),this.indicators.push(new g(this,r))),this.on("refresh",function(){for(var i=0;i<t.indicators.length;i++)t.indicators[i].refresh()}),s&&(this.on("scrollEnd",function(){for(var i=0;i<t.indicators.length;i++)t.indicators[i].fade()}),this.on("scrollCancel",function(){for(var i=0;i<t.indicators.length;i++)t.indicators[i].fade()}),this.on("scrollStart",function(){for(var i=0;i<t.indicators.length;i++)t.indicators[i].fade(!0)}),this.on("beforeScrollStart",function(){for(var i=0;i<t.indicators.length;i++)t.indicators[i].fade(!0,!0)})),this.on("destroy",function(){t._removeScrollBars()})},t.prototype._insertScrollBar=function(t){this.wrapper.appendChild(t)},t.prototype._removeScrollBars=function(){for(var t=0;t<this.indicators.length;t++)this.indicators[t].destroy()}}(v),function(t){t.prototype._initPullDown=function(){this.options.probeType=3},t.prototype._checkPullDown=function(){var t=this.options.pullDownRefresh,i=t.threshold,e=void 0===i?90:i,s=t.stop,o=void 0===s?40:s;return!(this.directionY!==A||this.y<e)&&(this.pulling||(this.pulling=!0,this.trigger("pullingDown")),this.scrollTo(this.x,o,this.options.bounceTime,O.bounce),this.pulling)},t.prototype.finishPullDown=function(){this.pulling=!1,this.resetPosition(this.options.bounceTime,O.bounce)}}(v),function(t){t.prototype._initPullUp=function(){this.options.probeType=3,this.pullupWatching=!1,this._watchPullUp()},t.prototype._watchPullUp=function(){function t(i){var s=this;this.movingDirectionY===C&&i.y<=this.maxScrollY+e&&(this.once("scrollEnd",function(){s.pullupWatching=!1}),this.trigger("pullingUp"),this.off("scroll",t))}this.pullupWatching=!0;var i=this.options.pullUpLoad.threshold,e=void 0===i?0:i;this.on("scroll",t)},t.prototype.finishPullUp=function(){var t=this;this.pullupWatching?this.once("scrollEnd",function(){t._watchPullUp()}):this._watchPullUp()}}(v),function(t){t.prototype._initMouseWheel=function(){var t=this;this._handleMouseWheelEvent(s),this.on("destroy",function(){clearTimeout(t.mouseWheelTimer),t._handleMouseWheelEvent(o)}),this.firstWheelOpreation=!0},t.prototype._handleMouseWheelEvent=function(t){t(this.wrapper,"wheel",this),t(this.wrapper,"mousewheel",this),t(this.wrapper,"DOMMouseScroll",this)},t.prototype._onMouseWheel=function(t){var i=this;if(this.enabled){t.preventDefault(),this.firstWheelOpreation&&this.trigger("scrollStart"),this.firstWheelOpreation=!1,clearTimeout(this.mouseWheelTimer),this.mouseWheelTimer=setTimeout(function(){i.options.snap||i.trigger("scrollEnd",{x:i.x,y:i.y}),i.firstWheelOpreation=!0},400);var e=this.options.mouseWheel,s=e.speed,o=void 0===s?20:s,n=e.invert,r=void 0!==n&&n,h=void 0,a=void 0;switch(!0){case"deltaX"in t:1===t.deltaMode?(h=-t.deltaX*o,a=-t.deltaY*o):(h=-t.deltaX,a=-t.deltaY);break;case"wheelDeltaX"in t:h=t.wheelDeltaX/120*o,a=t.wheelDeltaY/120*o;break;case"wheelDelta"in t:h=a=t.wheelDelta/120*o;break;case"detail"in t:h=a=-t.detail/3*o;break;default:return}var l=r?-1:1;h*=l,a*=l,this.hasVerticalScroll||(h=a,a=0);var c=void 0,p=void 0;if(this.options.snap)return c=this.currentPage.pageX,p=this.currentPage.pageY,h>0?c--:h<0&&c++,a>0?p--:a<0&&p++,void this._goToPage(c,p);c=this.x+Math.round(this.hasHorizontalScroll?h:0),p=this.y+Math.round(this.hasVerticalScroll?a:0),this.directionX=h>0?-1:h<0?1:0,this.directionY=a>0?-1:a<0?1:0,c>0?c=0:c<this.maxScrollX&&(c=this.maxScrollX),p>0?p=0:p<this.maxScrollY&&(p=this.maxScrollY),this.scrollTo(c,p),this.trigger("scroll",{x:this.x,y:this.y})}}}(v),v.Version="1.8.0",v});
/**
 * 选择列表插件
 * varstion 1.0.0
 * by yayayahei
 * mmwcbz@msn.cn
 */

(function ($, window, document, undefined) {

    var MAX_EXCEED = 30;
    var VISIBLE_RANGE = 90;
    var DEFAULT_ITEM_HEIGHT = 40;
    var BLUR_WIDTH = 10;

    var rad2deg = $.rad2deg = function (rad) {
        return rad / (Math.PI / 180);
    };

    var deg2rad = $.deg2rad = function (deg) {
        return deg * (Math.PI / 180);
    };

    var platform = navigator.platform.toLowerCase();
    var userAgent = navigator.userAgent.toLowerCase();
    var isIos = (userAgent.indexOf('iphone') > -1 ||
        userAgent.indexOf('ipad') > -1 ||
        userAgent.indexOf('ipod') > -1) &&
        (platform.indexOf('iphone') > -1 ||
            platform.indexOf('ipad') > -1 ||
            platform.indexOf('ipod') > -1);
    //alert(isIos);

    var ULPicker = $.ULPicker = function (holder, options) {
        var self = this;
        self.holder = holder;
        self.options = options || {};
        self.bscroll = new BScroll(self.holder.querySelector('.wrapper'), {
            bindToWrapper: true,
            // click: true,
            // tap: true,
        });
        self.init();
        self.initInertiaParams();
        self.calcElementItemPostion(true);
        self.bindEvent();
    };

    ULPicker.prototype.findElementItems = function () {
        var self = this;
        self.elementItems = [].slice.call(self.holder.querySelectorAll('li'));
        return self.elementItems;
    };

    ULPicker.prototype.init = function () {
        var self = this;
        self.list = self.holder.querySelector('ul');
        self.findElementItems();
        self.height = self.holder.offsetHeight;
        self.r = self.height / 2 - BLUR_WIDTH;
        self.d = self.r * 2;
        self.itemHeight = self.elementItems.length > 0 ? self.elementItems[0].offsetHeight : DEFAULT_ITEM_HEIGHT;
        self.itemAngle = parseInt(self.calcAngle(self.itemHeight * 0.8));
        self.hightlightRange = self.itemAngle / 2;
        self.visibleRange = VISIBLE_RANGE;
        self.beginAngle = 0;
        self.beginExceed = self.beginAngle - MAX_EXCEED;
        // self.list.angle = self.beginAngle;
        // if (isIos) {
        //     self.list.style.webkitTransformOrigin = "center center " + self.r + "px";
        // }
    };

    ULPicker.prototype.calcElementItemPostion = function (andGenerateItms) {
        var self = this;
        if (andGenerateItms) {
            self.items = [];
        }
        self.elementItems.forEach(function (item) {
            var index = self.elementItems.indexOf(item);
            self.endAngle = self.itemAngle * index;
            // item.angle = self.endAngle;
            // item.style.webkitTransformOrigin = "center center -" + self.r + "px";
            // item.style.webkitTransform = "translateZ(" + self.r + "px) rotateX(" + (-self.endAngle) + "deg)";
            if (andGenerateItms) {
                var dataItem = {};
                dataItem.text = item.innerHTML || '';
                dataItem.value = item.getAttribute('data-value') || dataItem.text;
                self.items.push(dataItem);
            }
        });
        self.endExceed = self.endAngle + MAX_EXCEED;
        // self.calcElementItemVisibility(self.beginAngle);
    };

    ULPicker.prototype.calcAngle = function (c) {
        var self = this;
        var a = b = parseFloat(self.r);
        //直径的整倍数部分直接乘以 180
        c = Math.abs(c); //只算角度不关心正否值
        var intDeg = parseInt(c / self.d) * 180;
        c = c % self.d;
        //余弦
        var cosC = (a * a + b * b - c * c) / (2 * a * b);
        var angleC = intDeg + rad2deg(Math.acos(cosC));
        return angleC;
    };

    ULPicker.prototype.calcElementItemVisibility = function (angle) {
        var self = this;
        self.elementItems.forEach(function (item) {
            var difference = Math.abs(item.angle - angle);
            if (difference < self.hightlightRange) {
                item.classList.add('highlight');
            } else if (difference < self.visibleRange) {
                item.classList.add('visible');
                item.classList.remove('highlight');
            } else {
                item.classList.remove('highlight');
                item.classList.remove('visible');
            }
        });
    };

    ULPicker.prototype.setAngle = function (angle) {
        var self = this;
        self.list.angle = angle;
        self.list.style.webkitTransform = "perspective(1000px) rotateY(0deg) rotateX(" + angle + "deg)";
        self.calcElementItemVisibility(angle);
    };

    ULPicker.prototype.bindEvent = function () {
        var self = this;
        var lastAngle = 0;
        var startY = null;
        var isPicking = false;
        self.holder.addEventListener($.EVENT_START, function (event) {
            // event.stopImmediatePropagation();
// console.log($.EVENT_START,event);
            // isPicking = true;
            // event.preventDefault();
            // self.list.style.webkitTransition = '';
            // startY = (event.changedTouches ? event.changedTouches[0] : event).pageY;
            // lastAngle = self.list.angle;
            // self.updateInertiaParams(event, true);
        }, false);
        self.holder.addEventListener($.EVENT_END, function (event) {
            // event.stopImmediatePropagation();
// console.log($.EVENT_END,event);
            // isPicking = false;
            // event.preventDefault();
            // self.startInertiaScroll(event);
        }, false);
        self.holder.addEventListener($.EVENT_CANCEL, function (event) {
            // event.stopImmediatePropagation();
// console.log($.EVENT_CANCEL,event);
            // isPicking = false;
            // event.preventDefault();
            // self.startInertiaScroll(event);
        }, false);
        self.holder.addEventListener($.EVENT_MOVE, function (event) {
            // console.log($.EVENT_MOVE, event);
            // return true;
            // event.stopImmediatePropagation();
            // if (!isPicking) {
            //     return;
            // }
            // console.log(self.list.scrollTop,self.list.scrollHeight,self.list.offsetHeight);

            // var endY = (event.changedTouches ? event.changedTouches[0] : event).pageY;
            // var dragRange = endY - startY;
            // if(self.list.scrollTop===0&&dragRange>0){
            //     console.log('prevent default');
            //     event.preventDefault();
            // }else if (self.list.scrollTop!==0&&self.list.scrollTop===self.list.scrollHeight-self.list.offsetHeight&&dragRange<0){
            //     console.log('prevent default');
            //     event.preventDefault();
            // }
            // event.preventDefault();

            // console.log(endY,  self.lastMoveStart);
            // self.list.scrollTop-=endY - self.lastMoveStart;
            //
            // var dragAngle = self.calcAngle(dragRange);
            //
            // var newAngle = dragRange > 0 ? lastAngle - dragAngle : lastAngle + dragAngle;
            // if (newAngle > self.endExceed) {
            //     newAngle = self.endExceed
            // }
            // if (newAngle < self.beginExceed) {
            //     newAngle = self.beginExceed
            // }
            // self.setAngle(newAngle);
            // self.updateInertiaParams(event);
        }, false);
        // --
        self.list.addEventListener('tap', function (event) {
            // console.log(event);

            // alert(event.target.tagName + ',' + event.target.parentElement.tagName);

            // alert(event.path[0].tagName)
            // alert(event.target.tagName);
            // alert(event.path.length);
            // alert(event.path[1].tagName);
            var elementItem = event.target.tagName === 'LI' ? event.target : event.target.parentElement;

            // alert(elementItem);
            // alert('tap');
            if (elementItem) {
                self.elementItems.forEach(
                    function (value) {
                        value.classList.remove('choose');
                    }
                );
                elementItem.classList.add('choose');
                var index = self.elementItems.indexOf(elementItem);
                // alert(index);
                self.setSelectedIndex(index, 200);
            }
        }, false);
    };

    ULPicker.prototype.initInertiaParams = function () {
        var self = this;
        self.lastMoveTime = 0;
        self.lastMoveStart = 0;
        self.stopInertiaMove = false;
    };

    ULPicker.prototype.updateInertiaParams = function (event, isStart) {
        var self = this;
        var point = event.changedTouches ? event.changedTouches[0] : event;
        if (isStart) {
            self.lastMoveStart = point.pageY;
            self.lastMoveTime = event.timeStamp || Date.now();
            self.startAngle = self.list.angle;
        } else {
            var nowTime = event.timeStamp || Date.now();
            // if (nowTime - self.lastMoveTime > 300) {
            self.lastMoveTime = nowTime;
            self.lastMoveStart = point.pageY;
            // }
        }
        self.stopInertiaMove = true;
    };

    ULPicker.prototype.startInertiaScroll = function (event) {
        var self = this;
        var point = event.changedTouches ? event.changedTouches[0] : event;
        /**
         * 缓动代码
         */
        var nowTime = event.timeStamp || Date.now();
        var v = (point.pageY - self.lastMoveStart) / (nowTime - self.lastMoveTime); //最后一段时间手指划动速度
        var dir = v > 0 ? -1 : 1; //加速度方向
        var deceleration = dir * 0.2 * -1;
        var duration = Math.abs(v / deceleration); // 速度消减至0所需时间
        var dist = v * duration / 2; //最终移动多少
        self.list.scrollTop -= dist;

        var startAngle = self.list.angle;
        var distAngle = self.calcAngle(dist) * dir;
        //----
        var srcDistAngle = distAngle;
        if (startAngle + distAngle < self.beginExceed) {
            distAngle = self.beginExceed - startAngle;
            duration = duration * (distAngle / srcDistAngle) * 0.6;
        }
        if (startAngle + distAngle > self.endExceed) {
            distAngle = self.endExceed - startAngle;
            duration = duration * (distAngle / srcDistAngle) * 0.6;
        }
        //----
        if (distAngle == 0) {
            self.endScroll();
            return;
        }
        self.scrollDistAngle(nowTime, startAngle, distAngle, duration);
    };
    ULPicker.prototype.scrollDistAngle = function (nowTime, startAngle, distAngle, duration) {
        var self = this;
        self.stopInertiaMove = false;
        (function (nowTime, startAngle, distAngle, duration) {
            var frameInterval = 13;
            var stepCount = duration / frameInterval;
            var stepIndex = 0;
            (function inertiaMove() {
                if (self.stopInertiaMove) return;
                var newAngle = self.quartEaseOut(stepIndex, startAngle, distAngle, stepCount);
                self.setAngle(newAngle);
                stepIndex++;
                if (stepIndex > stepCount - 1 || newAngle < self.beginExceed || newAngle > self.endExceed) {
                    self.endScroll();
                    return;
                }
                setTimeout(inertiaMove, frameInterval);
            })();
        })(nowTime, startAngle, distAngle, duration);
    };


    ULPicker.prototype.quartEaseOut = function (t, b, c, d) {
        return -c * ((t = t / d - 1) * t * t * t - 1) + b;
    };

    ULPicker.prototype.endScroll = function () {
        var self = this;
        if (self.list.angle < self.beginAngle) {
            self.list.style.webkitTransition = "150ms ease-out";
            self.setAngle(self.beginAngle);
        } else if (self.list.angle > self.endAngle) {
            self.list.style.webkitTransition = "150ms ease-out";
            self.setAngle(self.endAngle);
        } else {
            var index = parseInt((self.list.angle / self.itemAngle).toFixed(0));
            self.list.style.webkitTransition = "100ms ease-out";
            self.setAngle(self.itemAngle * index);
        }
        self.triggerChange();
    };

    ULPicker.prototype.triggerChange = function (force) {
        // console.log('trigger change');
        var self = this;
        setTimeout(function () {
            var index = self.getSelectedIndex();
            // console.log(index);
            var item = self.items[index];
            // console.log(item);
            // if ($.trigger && (index != self.lastIndex || force === true)) {
            if ($.trigger || force === true) {
                $.trigger(self.holder, 'change', {
                    "index": index,
                    "item": item
                });
                //console.log('change:' + index);
            }
            self.lastIndex = index;
            typeof force === 'function' && force();
        }, 0);
    };

    ULPicker.prototype.correctAngle = function (angle) {
        var self = this;
        if (angle < self.beginAngle) {
            return self.beginAngle;
        } else if (angle > self.endAngle) {
            return self.endAngle;
        } else {
            return angle;
        }
    };

    ULPicker.prototype.setItems = function (items) {
        var self = this;
        self.items = items || [];
        var buffer = [];
        self.items.forEach(function (item) {
            if (item !== null && item !== undefined) {
                buffer.push('<li><span>' + (item.text || item) + '</span><i></i></li>');
            }
        });
        self.list.innerHTML = buffer.join('');
        self.findElementItems();
        self.calcElementItemPostion();
        self.setAngle(self.correctAngle(self.list.angle));
        self.triggerChange(true);
    };

    ULPicker.prototype.getItems = function () {
        var self = this;
        return self.items;
    };

    ULPicker.prototype.getSelectedIndex = function () {
        var self = this;
        return self.index;
    };

    ULPicker.prototype.setSelectedIndex = function (index, duration, callback) {
        // console.log('setSelectIndex');
        var self = this;
        self.index = index;
        // console.log(self.index);
        // self.list.style.webkitTransition = '';
        // var angle = self.correctAngle(self.itemAngle * index);
        // if (duration && duration > 0) {
        //     var distAngle = angle - self.list.angle;
        //     self.scrollDistAngle(Date.now(), self.list.angle, distAngle, duration);
        // } else {
        //     self.setAngle(angle);
        // }
        self.triggerChange(callback);
    };

    ULPicker.prototype.getSelectedItem = function () {
        var self = this;
        return self.items[self.getSelectedIndex()];
    };

    ULPicker.prototype.getSelectedValue = function () {
        var self = this;
        return (self.items[self.getSelectedIndex()] || {}).value;
    };

    ULPicker.prototype.getSelectedText = function () {
        var self = this;
        return (self.items[self.getSelectedIndex()] || {}).text;
    };

    ULPicker.prototype.setSelectedValue = function (value, duration, callback) {
        var self = this;
        for (var index in self.items) {
            var item = self.items[index];
            if (item.value == value) {
                self.setSelectedIndex(index, duration, callback);
                return;
            }
        }
    };

    if ($.fn) {
        $.fn.ulpicker = function (options) {
            //遍历选择的元素
            this.each(function (i, element) {
                if (element.ulpicker) return;
                if (options) {
                    element.ulpicker = new ULPicker(element, options);
                } else {
                    var optionsText = element.getAttribute('data-ulpicker-options');
                    var _options = optionsText ? JSON.parse(optionsText) : {};
                    element.ulpicker = new ULPicker(element, _options);
                }
            });
            return this[0] ? this[0].ulpicker : null;
        };

        //自动初始化
        $.ready(function () {
            $('.mui-ulpicker').ulpicker();
        });
    }

})(window.mui || window, window, document, undefined);
//end
/**
 * 弹出选择列表插件
 * 此组件依赖 listpcker ，请在页面中先引入 mui.picker.css + mui.picker.js
 * varstion 1.0.1
 * by Houfeng
 * Houfeng@DCloud.io
 */

(function($, document) {

	//创建 DOM
	$.dom = function(str) {
		if (typeof(str) !== 'string') {
			if ((str instanceof Array) || (str[0] && str.length)) {
				return [].slice.call(str);
			} else {
				return [str];
			}
		}
		if (!$.__create_dom_div__) {
			$.__create_dom_div__ = document.createElement('div');
		}
		$.__create_dom_div__.innerHTML = str;
		return [].slice.call($.__create_dom_div__.childNodes);
	};

	var panelBuffer = '<div class="mui-poppicker">\
		<div class="mui-poppicker-header">\
			<button class="mui-btn mui-poppicker-btn-cancel">取消</button>\
			<button class="mui-btn mui-btn-blue mui-poppicker-btn-ok">确定</button>\
			<div class="mui-poppicker-clear"></div>\
		</div>\
		<div class="mui-poppicker-body">\
		</div>\
	</div>';

	var pickerBuffer = '<div class="mui-picker">\
		<div class="mui-picker-inner">\
			<div class="mui-pciker-rule mui-pciker-rule-ft"></div>\
			<ul class="mui-pciker-list">\
			</ul>\
			<div class="mui-pciker-rule mui-pciker-rule-bg"></div>\
		</div>\
	</div>';

	//定义弹出选择器类
	var PopPicker = $.PopPicker = $.Class.extend({
		//构造函数
		init: function(options) {
			var self = this;
			self.options = options || {};
			self.options.buttons = self.options.buttons || ['取消', '确定'];
			self.panel = $.dom(panelBuffer)[0];
			document.body.appendChild(self.panel);
			self.ok = self.panel.querySelector('.mui-poppicker-btn-ok');
			self.cancel = self.panel.querySelector('.mui-poppicker-btn-cancel');
			self.body = self.panel.querySelector('.mui-poppicker-body');
			self.mask = $.createMask();
			self.cancel.innerText = self.options.buttons[0];
			self.ok.innerText = self.options.buttons[1];
			self.cancel.addEventListener('tap', function(event) {
				self.hide();
			}, false);
			self.ok.addEventListener('tap', function(event) {
				if (self.callback) {
					var rs = self.callback(self.getSelectedItems());
					if (rs !== false) {
						self.hide();
					}
				}
			}, false);
			self.mask[0].addEventListener('tap', function() {
				self.hide();
			}, false);
			self._createPicker();
			//防止滚动穿透
			self.panel.addEventListener($.EVENT_START, function(event) {
				event.preventDefault();
			}, false);
			self.panel.addEventListener($.EVENT_MOVE, function(event) {
				event.preventDefault();
			}, false);
		},
		_createPicker: function() {
			var self = this;
			var layer = self.options.layer || 1;
			var width = (100 / layer) + '%';
			self.pickers = [];
			for (var i = 1; i <= layer; i++) {
				var pickerElement = $.dom(pickerBuffer)[0];
				pickerElement.style.width = width;
				self.body.appendChild(pickerElement);
				var picker = $(pickerElement).picker();
				self.pickers.push(picker);
				pickerElement.addEventListener('change', function(event) {
					var nextPickerElement = this.nextSibling;
					if (nextPickerElement && nextPickerElement.picker) {
						var eventData = event.detail || {};
						var preItem = eventData.item || {};
						nextPickerElement.picker.setItems(preItem.children);
					}
				}, false);
			}
		},
		//填充数据
		setData: function(data) {
			var self = this;
			data = data || [];
			self.pickers[0].setItems(data);
		},
		//获取选中的项（数组）
		getSelectedItems: function() {
			var self = this;
			var items = [];
			for (var i in self.pickers) {
				var picker = self.pickers[i];
				items.push(picker.getSelectedItem() || {});
			}
			return items;
		},
		//显示
		show: function(callback) {
			var self = this;
			self.callback = callback;
			self.mask.show();
			document.body.classList.add($.className('poppicker-active-for-page'));
			self.panel.classList.add($.className('active'));
			//处理物理返回键
			self.__back = $.back;
			$.back = function() {
				self.hide();
			};
		},
		//隐藏
		hide: function() {
			var self = this;
			if (self.disposed) return;
			self.panel.classList.remove($.className('active'));
			self.mask.close();
			document.body.classList.remove($.className('poppicker-active-for-page'));
			//处理物理返回键
			$.back=self.__back;
		},
		dispose: function() {
			var self = this;
			self.hide();
			setTimeout(function() {
				self.panel.parentNode.removeChild(self.panel);
				for (var name in self) {
					self[name] = null;
					delete self[name];
				};
				self.disposed = true;
			}, 300);
		}
	});

})(mui, document);
/**
 * 日期时间插件
 * varstion 1.0.5
 * by Houfeng
 * Houfeng@DCloud.io
 */

(function($, document) {

	//创建 DOM
	$.dom = function(str) {
		if (typeof(str) !== 'string') {
			if ((str instanceof Array) || (str[0] && str.length)) {
				return [].slice.call(str);
			} else {
				return [str];
			}
		}
		if (!$.__create_dom_div__) {
			$.__create_dom_div__ = document.createElement('div');
		}
		$.__create_dom_div__.innerHTML = str;
		return [].slice.call($.__create_dom_div__.childNodes);
	};

	var domBuffer = '<div class="mui-dtpicker" data-type="datetime">\
		<div class="mui-dtpicker-header">\
			<button data-id="btn-cancel" class="mui-btn">取消</button>\
			<button data-id="btn-ok" class="mui-btn mui-btn-blue">确定</button>\
		</div>\
		<div class="mui-dtpicker-title"><h5 data-id="title-y">年</h5><h5 data-id="title-m">月</h5><h5 data-id="title-d">日</h5><h5 data-id="title-h">时</h5><h5 data-id="title-i">分</h5></div>\
		<div class="mui-dtpicker-body">\
			<div data-id="picker-y" class="mui-picker">\
				<div class="mui-picker-inner">\
					<div class="mui-pciker-rule mui-pciker-rule-ft"></div>\
					<ul class="mui-pciker-list">\
					</ul>\
					<div class="mui-pciker-rule mui-pciker-rule-bg"></div>\
				</div>\
			</div>\
			<div data-id="picker-m" class="mui-picker">\
				<div class="mui-picker-inner">\
					<div class="mui-pciker-rule mui-pciker-rule-ft"></div>\
					<ul class="mui-pciker-list">\
					</ul>\
					<div class="mui-pciker-rule mui-pciker-rule-bg"></div>\
				</div>\
			</div>\
			<div data-id="picker-d" class="mui-picker">\
				<div class="mui-picker-inner">\
					<div class="mui-pciker-rule mui-pciker-rule-ft"></div>\
					<ul class="mui-pciker-list">\
					</ul>\
					<div class="mui-pciker-rule mui-pciker-rule-bg"></div>\
				</div>\
			</div>\
			<div data-id="picker-h" class="mui-picker">\
				<div class="mui-picker-inner">\
					<div class="mui-pciker-rule mui-pciker-rule-ft"></div>\
					<ul class="mui-pciker-list">\
					</ul>\
					<div class="mui-pciker-rule mui-pciker-rule-bg"></div>\
				</div>\
			</div>\
			<div data-id="picker-i" class="mui-picker">\
				<div class="mui-picker-inner">\
					<div class="mui-pciker-rule mui-pciker-rule-ft"></div>\
					<ul class="mui-pciker-list">\
					</ul>\
					<div class="mui-pciker-rule mui-pciker-rule-bg"></div>\
				</div>\
			</div>\
		</div>\
	</div>';

	//plugin
	var DtPicker = $.DtPicker = $.Class.extend({
		init: function(options) {
			var self = this;
			var _picker = $.dom(domBuffer)[0];
			document.body.appendChild(_picker);
			$('[data-id*="picker"]', _picker).picker();
			var ui = self.ui = {
				picker: _picker,
				mask: $.createMask(),
				ok: $('[data-id="btn-ok"]', _picker)[0],
				cancel: $('[data-id="btn-cancel"]', _picker)[0],
				y: $('[data-id="picker-y"]', _picker)[0],
				m: $('[data-id="picker-m"]', _picker)[0],
				d: $('[data-id="picker-d"]', _picker)[0],
				h: $('[data-id="picker-h"]', _picker)[0],
				i: $('[data-id="picker-i"]', _picker)[0],
				labels: $('[data-id*="title-"]', _picker),
			};
			ui.cancel.addEventListener('tap', function() {
				self.hide();
			}, false);
			ui.ok.addEventListener('tap', function() {
				var rs = self.callback(self.getSelected());
				if (rs !== false) {
					self.hide();
				}
			}, false);
			ui.y.addEventListener('change', function(e) { //目前的change事件容易导致级联触发
				if (self.options.beginMonth || self.options.endMonth) {
					self._createMonth();
				} else {
					self._createDay();
				}
			}, false);
			ui.m.addEventListener('change', function(e) {
				self._createDay();
			}, false);
			ui.d.addEventListener('change', function(e) {
				if (self.options.beginMonth || self.options.endMonth) { //仅提供了beginDate时，触发day,hours,minutes的change
					self._createHours();
				}
			}, false);
			ui.h.addEventListener('change', function(e) {
				if (self.options.beginMonth || self.options.endMonth) {
					self._createMinutes();
				}
			}, false);
			ui.mask[0].addEventListener('tap', function() {
				self.hide();
			}, false);
			self._create(options);
			//防止滚动穿透
			self.ui.picker.addEventListener($.EVENT_START, function(event) {
				event.preventDefault();
			}, false);
			self.ui.picker.addEventListener($.EVENT_MOVE, function(event) {
				event.preventDefault();
			}, false);
		},
		getSelected: function() {
			var self = this;
			var ui = self.ui;
			var type = self.options.type;
			var selected = {
				type: type,
				y: ui.y.picker.getSelectedItem(),
				m: ui.m.picker.getSelectedItem(),
				d: ui.d.picker.getSelectedItem(),
				h: ui.h.picker.getSelectedItem(),
				i: ui.i.picker.getSelectedItem(),
				toString: function() {
					return this.value;
				}
			};
			switch (type) {
				case 'datetime':
					selected.value = selected.y.value + '-' + selected.m.value + '-' + selected.d.value + ' ' + selected.h.value + ':' + selected.i.value;
					selected.text = selected.y.text + '-' + selected.m.text + '-' + selected.d.text + ' ' + selected.h.text + ':' + selected.i.text;
					break;
				case 'date':
					selected.value = selected.y.value + '-' + selected.m.value + '-' + selected.d.value;
					selected.text = selected.y.text + '-' + selected.m.text + '-' + selected.d.text;
					break;
				case 'time':
					selected.value = selected.h.value + ':' + selected.i.value;
					selected.text = selected.h.text + ':' + selected.i.text;
					break;
				case 'month':
					selected.value = selected.y.value + '-' + selected.m.value;
					selected.text = selected.y.text + '-' + selected.m.text;
					break;
				case 'hour':
					selected.value = selected.y.value + '-' + selected.m.value + '-' + selected.d.value + ' ' + selected.h.value;
					selected.text = selected.y.text + '-' + selected.m.text + '-' + selected.d.text + ' ' + selected.h.text;
					break;
			}
			return selected;
		},
		setSelectedValue: function(value) {
			var self = this;
			var ui = self.ui;
			var parsedValue = self._parseValue(value);
			//TODO 嵌套过多，因为picker的change时间是异步(考虑到性能)的，所以为了保证change之后再setSelected，目前使用回调处理
			ui.y.picker.setSelectedValue(parsedValue.y, 0, function() {
				ui.m.picker.setSelectedValue(parsedValue.m, 0, function() {
					ui.d.picker.setSelectedValue(parsedValue.d, 0, function() {
						ui.h.picker.setSelectedValue(parsedValue.h, 0, function() {
							ui.i.picker.setSelectedValue(parsedValue.i, 0);
						});
					});
				});
			});
		},
		isLeapYear: function(year) {
			return (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);
		},
		_inArray: function(array, item) {
			for (var index in array) {
				var _item = array[index];
				if (_item === item) return true;
			}
			return false;
		},
		getDayNum: function(year, month) {
			var self = this;
			if (self._inArray([1, 3, 5, 7, 8, 10, 12], month)) {
				return 31;
			} else if (self._inArray([4, 6, 9, 11], month)) {
				return 30;
			} else if (self.isLeapYear(year)) {
				return 29;
			} else {
				return 28;
			}
		},
		_fill: function(num) {
			num = num.toString();
			if (num.length < 2) {
				num = 0 + num;
			}
			return num;
		},
		_isBeginYear: function() {
			return this.options.beginYear === parseInt(this.ui.y.picker.getSelectedValue());
		},
		_isBeginMonth: function() {
			return this.options.beginMonth && this._isBeginYear() && this.options.beginMonth === parseInt(this.ui.m.picker.getSelectedValue());
		},
		_isBeginDay: function() {
			return this._isBeginMonth() && this.options.beginDay === parseInt(this.ui.d.picker.getSelectedValue());
		},
		_isBeginHours: function() {
			return this._isBeginDay() && this.options.beginHours === parseInt(this.ui.h.picker.getSelectedValue());
		},
		_isEndYear: function() {
			return this.options.endYear === parseInt(this.ui.y.picker.getSelectedValue());
		},
		_isEndMonth: function() {
			return this.options.endMonth && this._isEndYear() && this.options.endMonth === parseInt(this.ui.m.picker.getSelectedValue());
		},
		_isEndDay: function() {
			return this._isEndMonth() && this.options.endDay === parseInt(this.ui.d.picker.getSelectedValue());
		},
		_isEndHours: function() {
			return this._isEndDay() && this.options.endHours === parseInt(this.ui.h.picker.getSelectedValue());
		},
		_createYear: function(current) {
			var self = this;
			var options = self.options;
			var ui = self.ui;
			//生成年列表
			var yArray = [];
			if (options.customData.y) {
				yArray = options.customData.y;
			} else {
				var yBegin = options.beginYear;
				var yEnd = options.endYear;
				for (var y = yBegin; y <= yEnd; y++) {
					yArray.push({
						text: y + '',
						value: y
					});
				}
			}
			ui.y.picker.setItems(yArray);
			//ui.y.picker.setSelectedValue(current);
		},
		_createMonth: function(current) {
			var self = this;
			var options = self.options;
			var ui = self.ui;

			//生成月列表
			var mArray = [];
			if (options.customData.m) {
				mArray = options.customData.m;
			} else {
				var m = options.beginMonth && self._isBeginYear() ? options.beginMonth : 1;
				var maxMonth = options.endMonth && self._isEndYear() ? options.endMonth : 12;
				for (; m <= maxMonth; m++) {
					var val = self._fill(m);
					mArray.push({
						text: val,
						value: val
					});
				}
			}
			ui.m.picker.setItems(mArray);
			//ui.m.picker.setSelectedValue(current);
		},
		_createDay: function(current) {
			var self = this;
			var options = self.options;
			var ui = self.ui;

			//生成日列表
			var dArray = [];
			if (options.customData.d) {
				dArray = options.customData.d;
			} else {
				var d = self._isBeginMonth() ? options.beginDay : 1;
				var maxDay = self._isEndMonth() ? options.endDay : self.getDayNum(parseInt(this.ui.y.picker.getSelectedValue()), parseInt(this.ui.m.picker.getSelectedValue()));
				for (; d <= maxDay; d++) {
					var val = self._fill(d);
					dArray.push({
						text: val,
						value: val
					});
				}
			}
			ui.d.picker.setItems(dArray);
			current = current || ui.d.picker.getSelectedValue();
			//ui.d.picker.setSelectedValue(current);
		},
		_createHours: function(current) {
			var self = this;
			var options = self.options;
			var ui = self.ui;
			//生成时列表
			var hArray = [];
			if (options.customData.h) {
				hArray = options.customData.h;
			} else {
				var h = self._isBeginDay() ? options.beginHours : 0;
				var maxHours = self._isEndDay() ? options.endHours : 23;
				for (; h <= maxHours; h++) {
					var val = self._fill(h);
					hArray.push({
						text: val,
						value: val
					});
				}
			}
			ui.h.picker.setItems(hArray);
			//ui.h.picker.setSelectedValue(current);
		},
		_createMinutes: function(current) {
			var self = this;
			var options = self.options;
			var ui = self.ui;

			//生成分列表
			var iArray = [];
			if (options.customData.i) {
				iArray = options.customData.i;
			} else {
				var i = self._isBeginHours() ? options.beginMinutes : 0;
				var maxMinutes = self._isEndHours() ? options.endMinutes : 59;
				for (; i <= maxMinutes; i++) {
					var val = self._fill(i);
					iArray.push({
						text: val,
						value: val
					});
				}
			}
			ui.i.picker.setItems(iArray);
			//ui.i.picker.setSelectedValue(current);
		},
		_setLabels: function() {
			var self = this;
			var options = self.options;
			var ui = self.ui;
			ui.labels.each(function(i, label) {
				label.innerText = options.labels[i];
			});
		},
		_setButtons: function() {
			var self = this;
			var options = self.options;
			var ui = self.ui;
			ui.cancel.innerText = options.buttons[0];
			ui.ok.innerText = options.buttons[1];
		},
		_parseValue: function(value) {
			var self = this;
			var rs = {};
			if (value) {
				var parts = value.replace(":", "-").replace(" ", "-").split("-");
				rs.y = parts[0];
				rs.m = parts[1];
				rs.d = parts[2];
				rs.h = parts[3];
				rs.i = parts[4];
			} else {
				var now = new Date();
				rs.y = now.getFullYear();
				rs.m = now.getMonth() + 1;
				rs.d = now.getDate();
				rs.h = now.getHours();
				rs.i = now.getMinutes();
			}
			return rs;
		},
		_create: function(options) {
			var self = this;
			options = options || {};
			options.labels = options.labels || ['年', '月', '日', '时', '分'];
			options.buttons = options.buttons || ['取消', '确定'];
			options.type = options.type || 'datetime';
			options.customData = options.customData || {};
			self.options = options;
			var now = new Date();
			var beginDate = options.beginDate;
			if (beginDate instanceof Date && !isNaN(beginDate.valueOf())) { //设定了开始日期
				options.beginYear = beginDate.getFullYear();
				options.beginMonth = beginDate.getMonth() + 1;
				options.beginDay = beginDate.getDate();
				options.beginHours = beginDate.getHours();
				options.beginMinutes = beginDate.getMinutes();
			}
			var endDate = options.endDate;
			if (endDate instanceof Date && !isNaN(endDate.valueOf())) { //设定了结束日期
				options.endYear = endDate.getFullYear();
				options.endMonth = endDate.getMonth() + 1;
				options.endDay = endDate.getDate();
				options.endHours = endDate.getHours();
				options.endMinutes = endDate.getMinutes();
			}
			options.beginYear = options.beginYear || (now.getFullYear() - 5);
			options.endYear = options.endYear || (now.getFullYear() + 5);
			var ui = self.ui;
			//设定label
			self._setLabels();
			self._setButtons();
			//设定类型
			ui.picker.setAttribute('data-type', options.type);
			//生成
			self._createYear();
			self._createMonth();
			self._createDay();
			self._createHours();
			self._createMinutes();
			//设定默认值
			self.setSelectedValue(options.value);
		},
		//显示
		show: function(callback) {
			var self = this;
			var ui = self.ui;
			self.callback = callback || $.noop;
			ui.mask.show();
			document.body.classList.add($.className('dtpicker-active-for-page'));
			ui.picker.classList.add($.className('active'));
			//处理物理返回键
			self.__back = $.back;
			$.back = function() {
				self.hide();
			};
		},
		hide: function() {
			var self = this;
			if (self.disposed) return;
			var ui = self.ui;
			ui.picker.classList.remove($.className('active'));
			ui.mask.close();
			document.body.classList.remove($.className('dtpicker-active-for-page'));
			//处理物理返回键
			$.back = self.__back;
		},
		dispose: function() {
			var self = this;
			self.hide();
			setTimeout(function() {
				self.ui.picker.parentNode.removeChild(self.ui.picker);
				for (var name in self) {
					self[name] = null;
					delete self[name];
				};
				self.disposed = true;
			}, 300);
		}
	});

})(mui, document);
/**
 * 弹出选择列表插件
 * 此组件依赖 listpcker ，请在页面中先引入 mui.picker.css + mui.picker.js
 * varstion 1.0.0
 * by yayayahei
 * mmwcbz@msn.cn
 */

(function ($, document) {

    //创建 DOM
    $.dom = function (str) {
        if (typeof(str) !== 'string') {
            if ((str instanceof Array) || (str[0] && str.length)) {
                return [].slice.call(str);
            } else {
                return [str];
            }
        }
        if (!$.__create_dom_div__) {
            $.__create_dom_div__ = document.createElement('div');
        }
        $.__create_dom_div__.innerHTML = str;
        return [].slice.call($.__create_dom_div__.childNodes);
    };

    var panelBuffer = '<div class="mui-poppicker">\
		<div class="mui-poppicker-header">\
		    <span class="mui-poppicker-header-text"></span>\
		   <div class="mui-poppicker-btn-close"><span class=" icon fa fa-times " style="font-size: 16px;"></span></div>\
		</div>\
		<div class="mui-poppicker-body">\
		<div class="mui-poppicker-nav">\
		<div class="mui-poppicker-title"></div>\
		</div>\
		</div>\
	</div>';
    var titleBuffer = '<h5 data-id="title"></h5>';
    var pickerBuffer = '<div class="mui-ulpicker">\
		<div class="mui-ulpicker-inner">\
            <div class="wrapper">\
                <ul class="content mui-ulpicker-list">\
                </ul>\
            </div>\
        </div>\
	</div>';

    //定义弹出选择器类
    var MultiLevelPopPicker = $.MultiLevelPopPicker = $.Class.extend({
        //构造函数
        init: function (options) {
            var self = this;
            self.options = options || {};
            self.options.panelTitle = self.options.panelTitle || '';
            self.panel = $.dom(panelBuffer)[0];
            document.body.appendChild(self.panel);
            self.headerText = self.panel.querySelector('.mui-poppicker-header-text');
            self.headerText.innerText = self.options.panelTitle;

            self.close = self.panel.querySelector('.mui-poppicker-btn-close');
            self.title = self.panel.querySelector('.mui-poppicker-title');
            self.body = self.panel.querySelector('.mui-poppicker-body');
            self.mask = $.createMask();
            self.close.addEventListener('tap', function (event) {
                self.hide();
            }, false);
            self.mask[0].addEventListener('tap', function () {
                self.hide();
            }, false);
            self._createPicker();
            //防止滚动穿透
            self.panel.addEventListener($.EVENT_START, function (event) {
                event.preventDefault();
            }, false);
            self.panel.addEventListener($.EVENT_MOVE, function (event) {
                event.preventDefault();
            }, false);
        },
        _createPicker: function () {
            var self = this;
            var layer = self.options.layer || 1;
            var titleWidthLayer = self.options.titleWidthLayer;
            var defaultTitles = self.options.defaultTitles || Array(layer).fill('请选择');
            var width = '100%';
            self.pickers = [];
            self.titles = [];
            self.pickerElements = [];
            for (var i = 1; i <= layer; i++) {
                var pickerElement = $.dom(pickerBuffer)[0];
                pickerElement.setAttribute("data-id", i);
                pickerElement.style.width = width;
                // append title
                var titleElement = $.dom(titleBuffer)[0];
                titleElement.innerText = defaultTitles[i - 1];
                titleElement.setAttribute("data-id", i);
                if (titleWidthLayer) {
                    titleElement.style.width = titleWidthLayer[i - 1] + '%';
                }
                if (i === 1) {
                    titleElement.classList.add('active');
                    pickerElement.classList.add('active');
                }
                titleElement.addEventListener('tap', function (event) {
                    var id = Number(this.getAttribute("data-id"));
                    var index = Number(this.getAttribute("data-value"));
                    var prevIndex = this.previousSibling && Number(this.previousSibling.getAttribute("data-value"));
                    // console.log(prevIndex);
                    for (var _id = 0; _id < layer; _id++) {
                        if (_id + 1 === id) {
                            // active this title
                            self.pickerElements[_id].classList.add('active');
                            self.pickers[_id].bscroll.refresh();
                            self.pickers[_id].bscroll.scrollToElement('.choose');
                            // display corresponding picker,
                            self.titles[_id].classList.add('active');

                        } else {
                            // deactive other picker
                            self.pickerElements[_id].classList.remove('active');
                            // deactive other title
                            self.titles[_id].classList.remove('active');

                        }
                    }
                    // if (id > 1) {
                    //     self.pickers[id - 1].triggerChange();
                    // }
                }, false);
                self.title.appendChild(titleElement);
                self.titles.push(titleElement);
                self.pickerElements.push(pickerElement);
                self.body.appendChild(pickerElement);
                var picker = $(pickerElement).ulpicker();
                self.pickers.push(picker);
                pickerElement.addEventListener('change', function (event) {
                    // console.log('change event',event);
                    var id = Number(this.getAttribute("data-id"));
                    var eventData = event.detail || {};
                    var preItem = eventData.item || {};
                    // console.log('choosed item:', event.detail.item,event);

                    var thisTitleElement = self.titles[id - 1];
                    thisTitleElement.innerText = preItem.text || defaultTitles[id - 1];
                    thisTitleElement.setAttribute('data-value', eventData.index);
                    var nextPickerElement = this.nextSibling;
                    if (nextPickerElement && nextPickerElement.ulpicker) {
                        nextPickerElement.ulpicker.setItems(preItem.children);
                        nextPickerElement.ulpicker.setSelectedIndex(-1);
                        // show next picker
                        if (eventData.index > -1) {
                            for (var _id = 0; _id < layer; _id++) {
                                if (_id === id) {
                                    // active this title
                                    self.pickerElements[_id].classList.add('active');
                                    // display corresponding picker,
                                    self.titles[_id].classList.add('active');
                                    self.pickers[_id].bscroll.refresh();
                                } else {
                                    // deactive other picker
                                    self.pickerElements[_id].classList.remove('active');
                                    // deactive other title
                                    self.titles[_id].classList.remove('active');

                                }
                            }
                        }

                    } else if (eventData.index > -1) {
                        // 点击最后一级
                        if (self.callback) {
                            var rs = self.callback(self.getSelectedItems());
                            if (rs !== false) {
                                self.hide();
                            }
                        }
                    }
                }, false);

                // const scroll = new BScroll(document.querySelector('.mui-ulpicker-inner'));
            }
        },
        //填充数据
        setData: function (data) {
            var self = this;
            data = data || [];
            self.pickers[0].setItems(data);
        },
        //获取选中的项（数组）
        getSelectedItems: function () {
            var self = this;
            var items = [];
            for (var i in self.pickers) {
                var picker = self.pickers[i];
                items.push(picker.getSelectedItem() || {});
            }
            return items;
        },

        //显示
        show: function (callback) {
            var self = this;
            self.callback = callback;
            self.mask.show();
            document.body.classList.add($.className('poppicker-active-for-page'));
            document.documentElement.classList.add($.className('poppicker-active-for-page'));
            self.panel.classList.add($.className('active'));
            //处理物理返回键
            self.__back = $.back;
            $.back = function () {
                self.hide();
            };
        },

        //隐藏
        hide: function () {
            var self = this;
            if (self.disposed) return;
            self.panel.classList.remove($.className('active'));
            self.mask.close();
            document.body.classList.remove($.className('poppicker-active-for-page'));
            document.documentElement.classList.remove($.className('poppicker-active-for-page'));

            //处理物理返回键
            $.back = self.__back;
        },
        dispose: function () {
            var self = this;
            self.hide();
            setTimeout(function () {
                self.panel.parentNode.removeChild(self.panel);
                for (var name in self) {
                    self[name] = null;
                    delete self[name];
                }
                self.disposed = true;
            }, 300);
        }
    });

})(mui, document);