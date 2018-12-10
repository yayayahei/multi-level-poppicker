import * as events from './components/events';
import BScroll from 'better-scroll'
/**
 * 选择列表插件
 * varstion 1.0.0
 * by yayayahei
 * mmwcbz@msn.cn
 */
var MAX_EXCEED = 30;
var VISIBLE_RANGE = 90;
var DEFAULT_ITEM_HEIGHT = 40;
var BLUR_WIDTH = 10;

var rad2deg = function (rad) {
    return rad / (Math.PI / 180);
};

var deg2rad = function (deg) {
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

var ULPicker = function (holder, options) {
    var self = this;
    self.holder = holder;
    self.options = options || {};
    self.bscroll = new BScroll(self.holder.querySelector('.wrapper'), {
        bindToWrapper: true,
        // click: true,
        tap: true,
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
    // self.itemAngle = parseInt(self.calcAngle(self.itemHeight * 0.8));
    // self.hightlightRange = self.itemAngle / 2;
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


// ULPicker.prototype.calcElementItemVisibility = function (angle) {
//     var self = this;
//     self.elementItems.forEach(function (item) {
//         var difference = Math.abs(item.angle - angle);
//         if (difference < self.hightlightRange) {
//             item.classList.add('highlight');
//         } else if (difference < self.visibleRange) {
//             item.classList.add('visible');
//             item.classList.remove('highlight');
//         } else {
//             item.classList.remove('highlight');
//             item.classList.remove('visible');
//         }
//     });
// };

ULPicker.prototype.setAngle = function (angle) {
    var self = this;
    self.list.angle = angle;
    self.list.style.webkitTransform = "perspective(1000px) rotateY(0deg) rotateX(" + angle + "deg)";
    // self.calcElementItemVisibility(angle);
};

ULPicker.prototype.bindEvent = function () {
    var self = this;
    var lastAngle = 0;
    var startY = null;
    var isPicking = false;
    // self.holder.addEventListener(constants.EVENT_START, function (event) {
       
    // }, false);
    // self.holder.addEventListener(constants.EVENT_END, function (event) {
        
    // }, false);
    // self.holder.addEventListener(constants.EVENT_CANCEL, function (event) {
        
    // }, false);
    // self.holder.addEventListener(constants.EVENT_MOVE, function (event) {
        
    // }, false);
    console.log('bind tap for ',self.list)
    self.list.addEventListener('tap', function (event) {
        console.log(event);

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


ULPicker.prototype.triggerChange = function (force) {
    // console.log('trigger change');
    var self = this;
    setTimeout(function () {
        var index = self.getSelectedIndex();
        // console.log(index);
        var item = self.items[index];
        // console.log(item);
        // if ($.trigger && (index != self.lastIndex || force === true)) {
        if (events.trigger || force === true) {
            events.trigger(self.holder, 'change', {
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
    console.log('items in setItems',items);
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
    // self.setAngle(self.correctAngle(self.list.angle));
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

export default function (element, options) {

    //遍历选择的元素
    if (element.ulpicker) return;
        if (options) {
            element.ulpicker = new ULPicker(element, options);
        } else {
            var optionsText = element.getAttribute('data-ulpicker-options');
            var _options = optionsText ? JSON.parse(optionsText) : {};
            element.ulpicker = new ULPicker(element, _options);
        }
    return element?element.ulpicker : null;
};
