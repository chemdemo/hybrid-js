/*
* @Author: dmyang
* @Date:   2015-11-10 10:21:22
* @Last Modified by:   dm
* @Last Modified time: 2015-12-30 20:02:01
* @Description: JSBridge layer code
*/

'use strict';

const win = window;
const ua = navigator.userAgent;
const slice = Array.prototype.slice;
const encode = encodeURIComponent;

const apiRootNsRe = 'web|app';
const webCallbackSnPrefix = '__t_';
const requestSNKey = '__bridge_req_sn';
const callbackSNKey = '__bridge_res_sn';

var callbacks = {};
var JSBridge = win.JSBridge = {};

JSBridge.version = '1.0.0';
JSBridge.desc = 'JSBridge layer for hybrid framework.';
JSBridge.platform = matchArray(ua, ['Android', 'Mac OS', 'Windows']);
// JSBridge.device = matchArray(ua, ['iPad', 'iPhone']);
JSBridge.appName = 'JSBridge';
JSBridge.appVersion = function() {
    var m = ua.match(/\/([^\s\/]+)/g);
    return m ? m[1] : null;
}();

JSBridge.web = {};
JSBridge.app = {};

JSBridge.assign = win.JSBridgeAssign = assignAPI;
JSBridge.invokeApp = win.JSBridgeInvokeApp = invokeAppApi;
JSBridge.invokeWeb = win.JSBridgeInvokeWeb = invokeWebApi;
JSBridge.resolveUrl = resolveUrl;
JSBridge.isFn = isFn;

/**
 * 把指定api包装为固定的调用形式
 * @param  {String}   name     api name
 * @param  {Function} callback 回调函数
 * @usage:
 * assignAPI('app.launchApp', function(result) {});
 * assignAPI('web.dom.getTitle', function() {return $('title').text();});
 */
function assignAPI(name, callback) {
    var names = name.split(/\./);
    var ns = names.shift();

    if(ns === 'JSBridge') throw Error('namespace `JSBridge` has already assigned.');
    if(!apiRootNsRe.test(ns)) throw Error('only `app` or `web` be allowed as root namespace.');

    var fnName = names.pop();
    var root = createNamespace(JSBridge[ns], names);

    // etc.
    // JSBridge.app.launchApp = function(options) {
    //     JSBridge.invokeApp('launchApp', options);
    // };
    // JSBridge.app.foo.bar = function(options) {
    //     JSBridge.invokeApp('foo.bar', options);
    // };
    if(fnName) root[fnName] = callback || noop;
}

/**
 * invoke native
 * @param  {String} api     some api assigned
 * @param  {Object} params calls options
 * @return {Boolean}         is invoke success or not
 * @usage:
 * invokeAppApi('device.connectToWiFi', {callback: function(result) {}});
 */
function invokeAppApi(api, params) {
    if(!api) return false;

    params = isFn(params) ? {callback: params} : (params || {});

    var names = api.split('.');
    var method = names.pop();
    var callback = params.callback;
    var sn;
    var ns;

    // if(names[0] === 'app') names.shift();
    if(!names.length || !method) throw Error('api ' + api + ' has not assigned');
    ns = names.join('.');

    if(isFn(callback)) {
        sn = callbackSign(
            callback,
            params.context || JSBridge,
            params.nextTick !== undefined ? params.nextTick : true
        );
        params[requestSNKey] = sn;
        delete params.callback;
        delete params.context;
        delete params.nextTick;
    }

    params.version = JSBridge.version;

    var url = 'JSBridge://' + encode(ns) + '/' + encode(method) + '?' + serialize(params);

    return openURL(url);
}

/**
 * native 调用web方法
 * 挂在window下面也可以，不过为了方便维护，建议都挂到JSBridge.web对象上
 * @param  {String} api
 * @param  {String} str
 * @usage:
 * webview.loadUrl('javascript: invokeWebApi("dom.getNodeText", "{id: , sn: }")');
 * webview.loadUrl('javascript: invokeWebApi("app.callback", "{sn: }")'); // app回调js
 */
function invokeWebApi(api, str) {
    if(typeof api !== 'string' || (str && typeof str !== 'string')) return;

    // js调用app后，app又回调结果给js
    if(/.*app\.callback$/.test(api)) {
        appCallbackJS(str);
        return;
    }

    var names = api.split(/\./);

    if(names[0] === 'web') names.shift();

    if(!names.length) return;

    var fnName = names.pop();
    var root = createNamespace(JSBridge.web, names);
    var fn = root[fnName] || createNamespace(win, names)[fnName];

    if(!isFn(fn)) return;

    if(str) {
        var params;

        str = decodeURIComponent(str);

        try {
            params = JSON.parse(str);
        } catch(e) {
            fn(str);
            return;
        }

        if(!(callbackSNKey in params) || typeof params[callbackSNKey] !== 'string') {
            fn(params);
            return;
        }

        var sn = params[callbackSNKey];
        var val = fn(params);
        var result = {};

        if(typeof val == 'object') {
            if(val instanceof HTMLElement)
                throw Error('HTMLElement instance is not allowed to return to native.');

            try {
                // 必须是一个可序列化的对象
                val = JSON.stringify(val);
            } catch(e) {
                throw e;
            }
        }

        result[requestSNKey] = sn;
        result['data'] = val;
        result['code'] = 0;

        // native must assign api `*.js.callback` first
        JSBridge.invokeApp('js.callback', result);
    } else {
        fn();
    }
}

function appCallbackJS(result) {
    if(!result) return;

    result = decodeURIComponent(result);

    var params;
    var sn;

    try {
        params = JSON.parse(result);
    } catch(e) {
        alert(e)
        throw e;
    }

    var sn = params[requestSNKey];
    var fn;

    if(sn) {
        fn = callbacks[sn];
        if(isFn(fn)) fn(params);
    }
}

function createNamespace(root, names) {
    var i = 0;
    var a;

    while(a = names[i++]) {
        !root[a] && (root[a] = {});
        root = root[a];
    }

    return root;
}

function callbackSign(callback, context, nextTick) {
    if(isFn(callback)) {
        var fn = callback;
        var sn = webCallbackSnPrefix + Date.now();

        callbacks[sn] = function() {
            var args = slice.call(arguments);

            if(!nextTick) {
                fn.apply(context, args);
            } else {
                setTimeout(function() {
                    fn.apply(context, args);
                }, 0);
            }

            delete callbacks[sn];
        };

        return sn;
    }

    return '';
}

function openURL(url) {
    var isInApp = JSBridge.appName == 'JSBridge';
    var isAndroidApp = isInApp && JSBridge.platform == 'Android';

    // for debug in browsers
    if(!isAndroidApp) return console.info('JSBridge schema:', url);

    var iframe = document.createElement('iframe');

    // Android必须先赋值再append
    document.body.appendChild(iframe);

    iframe.style.cssText = 'display:none;width:0px;height:0px;';
    iframe.src = url;
    // iframe.onload = function() {};

    setTimeout(function(){
        iframe.parentNode.removeChild(iframe);
    }, 0);

    return true;
}

function serialize(obj) {
    var r = [];
    var k;

    for(k in obj) r.push(encode(String(k)) + '=' + encode(String(obj[k])));

    return r.join('&');
}

function matchArray(str, arr) {
    for(var i=0; i<arr.length; i++) {
        if(new RegExp(arr[i]).test(str)) return arr[i].replace(/\s+/, '');
    }

    return 'Other';
}

function resolveUrl(url) {
    if(!url) return url;

    url = url.trim();

    if(!/^http(''|s)?:\/\//.test(url)) {
        var parsed = parseUrl(url);

        url = url.replace(/^(?:\.)?\//,'');
        url = parsed.protocol + '//' + parsed.host + '/' + url;
    }

    return url;
}

function parseUrl(url) {
    var a = document.createElement('a');

    a.href = (url || 'x.html');

    return {
        host: a.host,
        protocol: a.protocol
    };
}

function isFn(fn) {
    return typeof fn === 'function';
}

function noop() {
    var args = slice.call(arguments);
    var callback = args.length && args[args.length - 1];

    return isFn(callback) ? callback(null) : null;
}

module.exports = JSBridge;
