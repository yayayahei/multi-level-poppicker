/**
 * mui isArray
 */
export var isArray = Array.isArray ||
    function (object) {
        return object instanceof Array;
    };
/**
 * setTimeout封装
 * @param {Object} fn
 * @param {Object} when
 * @param {Object} context
 * @param {Object} data
 */
export var later = function (fn, when, context, data) {
    when = when || 0;
    var m = fn;
    var d = data;
    var f;
    var r;

    if (typeof fn === 'string') {
        m = context[fn];
    }

    f = function () {
        m.apply(context, isArray(d) ? d : [d]);
    };

    r = setTimeout(f, when);

    return {
        id: r,
        cancel: function () {
            clearTimeout(r);
        }
    };
};
