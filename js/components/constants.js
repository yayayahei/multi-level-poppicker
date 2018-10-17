export var CLASS_POPOVER = 'mui-popover';
export var CLASS_POPOVER_ARROW = 'mui-popover-arrow';
export var CLASS_ACTION_POPOVER = 'mui-popover-action';
export var CLASS_BACKDROP = 'mui-backdrop';
export var CLASS_BAR_POPOVER = 'mui-bar-popover';
export var CLASS_BAR_BACKDROP = 'mui-bar-backdrop';
export var CLASS_ACTION_BACKDROP = 'mui-backdrop-action';
export var CLASS_ACTIVE = 'mui-active';
export var CLASS_BOTTOM = 'mui-bottom';


if ('ontouchstart' in window) {
    export var isTouchable = true;
    export var EVENT_START = 'touchstart';
    export var EVENT_MOVE = 'touchmove';
    export var EVENT_END = 'touchend';
} else {
    export var isTouchable = false;
    export var EVENT_START = 'mousedown';
    export var EVENT_MOVE = 'mousemove';
    export var EVENT_END = 'mouseup';
}
export var EVENT_CANCEL = 'touchcancel';
export var EVENT_CLICK = 'click';