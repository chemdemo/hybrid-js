/*
* @Author: dmyang
* @Date:   2015-11-10 10:21:42
* @Last Modified by:   dm
* @Last Modified time: 2015-12-30 20:00:17
* @Description: Native api for webapp, require `core.js`
*/

'use strict';

// import JSBridge from './core';
var JSBridge = require('./core');

const _notFnErrStr = 'the type of `callback` should be Function';
const _notIntErrStr = 'the type of `i` should be Integer';

var $ = JSBridge || global.JSBridge;
var $app = $.app;
var each = function(arr, fn) {
    var i = 0;
    while(arr[i]) fn(arr[i++], i, arr);
};

// device
$.assign('app.device.getNetwork', function(callback) {
    if(!$.isFn(callback)) throw TypeError(_notFnErrStr);
    $.invokeApp('device.info.getNetwork', callback);
});

// ui
$.assign('app.ui.alert', function(txt) {
    if($.runtime === 'FlymeOS') $.invokeApp('app.ui.alert', txt);
    else alert(txt);
});

// user
$.assign('app.user.register', function(callback) {
    if(!$.isFn(callback)) throw TypeError(_notFnErrStr);
    $.invokeApp('app.user.register', callback);
});
$.assign('app.user.login', function(callback) {
    if(!$.isFn(callback)) throw TypeError(_notFnErrStr);
    $.invokeApp('app.user.login', callback);
});
$.assign('app.user.logout', function() {
    $.invokeApp('app.user.logout');
});

// data
$.assign('app.data.getCommonParams', function(callback) {
    if(!$.isFn(callback)) throw TypeError(_notFnErrStr);
    $.invokeApp('app.data.getCommonParams', callback);
});

module.export = $;
