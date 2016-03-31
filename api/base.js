/*
* @Author: dmyang
* @Date:   2016-01-15 10:44:29
* @Last Modified by:   dmyang
* @Last Modified time: 2016-03-31 19:25:26
* @Description: hybridjs公共api
*/

'use strict';

import HybridJS from '../lib/core'

let $ = HybridJS

// 通知app，H5需要监听mback键
$.wrapAPI('app.listenMBack', () => {
    $.invokeApp('sdk.set_status', {key: 'interceptOnBack', value: 1})
})

// 取消app监听mback键
$.wrapAPI('app.cancelListenMBack', () => {
    $.invokeApp('sdk.set_status', {key: 'interceptOnBack', value: 0})
})

// 默认将mback交回客户端处理
$.wrapAPI('app.back', (value = 1) => {
    if($.isInApp) $.invokeApp('sdk.back', {value})
    else window.history.back()
})

// $.on('app.mback', () => {
//     // todo...
//     $.app.back(1)
// });

$.wrapAPI('app.open', (url, type = 0) => {
    if($.isInApp) $.invokeApp('sdk.jump', {url, type})
    else location.href = url
})

// 设置native状态
$.wrapAPI('app.set', (key, value) => {
    $.invokeApp('sdk.set_status', {key, value})
})

/**
 * HybridJS.app.getStatus('network', function(result) {}});
 */
$.wrapAPI('app.get', (key, callback) => {
    $.invokeApp('sdk.get_status', {key, callback})
})

// 进入H5页面之后先reset mback的监听
HybridJS.app.cancelListenMBack()

module.exports = $
