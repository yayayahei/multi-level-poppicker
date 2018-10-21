
export default function (str) {
    if (typeof(str) !== 'string') {
        if ((str instanceof Array) || (str[0] && str.length)) {
            return [].slice.call(str);
        } else {
            return [str];
        }
    }
    let __create_dom_div__=null;
    if (!__create_dom_div__) {
        __create_dom_div__ = document.createElement('div');
    }
    __create_dom_div__.innerHTML = str;
    return [].slice.call(__create_dom_div__.childNodes);
};