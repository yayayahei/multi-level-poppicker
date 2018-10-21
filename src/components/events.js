export var preventDefault = function (e) {
    e.preventDefault();
};
/**
 * trigger event
 * @param {type} element
 * @param {type} eventType
 * @param {type} eventData
 * @returns {_L8.$}
 */
export var trigger = function (element, eventType, eventData) {
    element.dispatchEvent(new CustomEvent(eventType, {
        detail: eventData,
        bubbles: true,
        cancelable: true
    }));
    return this;
};
