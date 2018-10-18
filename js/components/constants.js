export var CLASS_POPOVER = 'mui-popover';
export var CLASS_POPOVER_ARROW = 'mui-popover-arrow';
export var CLASS_ACTION_POPOVER = 'mui-popover-action';
export var CLASS_BACKDROP = 'mui-backdrop';
export var CLASS_BAR_POPOVER = 'mui-bar-popover';
export var CLASS_BAR_BACKDROP = 'mui-bar-backdrop';
export var CLASS_ACTION_BACKDROP = 'mui-backdrop-action';
export var CLASS_ACTIVE = 'mui-active';
export var CLASS_BOTTOM = 'mui-bottom';

var isTouchable, EVENT_START, EVENT_MOVE, EVENT_END;
if ('ontouchstart' in window) {
    isTouchable = true;
    EVENT_START = 'touchstart';
    EVENT_MOVE = 'touchmove';
    EVENT_END = 'touchend';
} else {
    isTouchable = false;
    EVENT_START = 'mousedown';
    EVENT_MOVE = 'mousemove';
    EVENT_END = 'mouseup';
}
export {
    isTouchable,
    EVENT_START,
    EVENT_MOVE,
    EVENT_END
};
export var EVENT_CANCEL = 'touchcancel';
export var EVENT_CLICK = 'click';