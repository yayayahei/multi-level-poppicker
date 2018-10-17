import * as consts from './constants';
import * as events from './events';
import * as utils from './util';
export default createMask = function(callback) {
    var element = document.createElement('div');
    element.classList.add(consts.CLASS_BACKDROP);
    element.addEventListener(consts.EVENT_MOVE, events.preventDefault);
    element.addEventListener('tap', function() {
        mask.close();
    });
    var mask = [element];
    mask._show = false;
    mask.show = function() {
        mask._show = true;
        element.setAttribute('style', 'opacity:1');
        document.body.appendChild(element);
        return mask;
    };
    mask._remove = function() {
        if (mask._show) {
            mask._show = false;
            element.setAttribute('style', 'opacity:0');
            utils.later(function() {
                var body = document.body;
                element.parentNode === body && body.removeChild(element);
            }, 350);
        }
        return mask;
    };
    mask.close = function() {
        if (callback) {
            if (callback() !== false) {
                mask._remove();
            }
        } else {
            mask._remove();
        }
    };
    return mask;
};