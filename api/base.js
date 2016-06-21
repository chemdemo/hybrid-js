/*
* @Author: dmyang
* @Date:   2016-01-15 10:44:29
* @Last Modified by:   dmyang
* @Last Modified time: 2016-06-21 19:57:06
* @Description: hybridjs公共api
*/

'use strict'

import HybridJS from '../lib/core'

const HANDLER_ROOT = 'com.companyName.hybridSDK.handler.'

const $ = HybridJS

/**
 * launch another app via package name
 * usage:
 * HybridJS.view.openUrl('./detail.html')
**/
$.wrapAPI('view.openUrl', (url) => {
    if($.isInApp) $.invokeApp(`${HANDLER_ROOT}ForwardHandler/startPage`, { url })
    else location.href = url
})

/**
 * launch another app via package name
 * usage:
 * HybridJS.view.launchApp('com.tencent.weixin')
**/
$.wrapAPI('view.launchApp', (pkg) => {
    $.invokeApp(`${HANDLER_ROOT}ForwardHandler/startApp`, { pkg })
})

/**
 * webview back
 * usage:
 * HybridJS.view.back()
**/
$.wrapAPI('view.back', (value = 1) => {
    if($.isInApp) $.invokeApp(`${HANDLER_ROOT}MBack/back`, {value})
    else window.history.back()
})

/**
 * get device sn
 * usage:
 * HybridJS.device.getSN((sn) => console.log(sn))
**/
$.wrapAPI('device.getSN', (callback) => {
    $.invokeApp(`${HANDLER_ROOT}DeviceInfoHandler/getSN`, {callback})
})

/**
 * Native UI component
 * usage:
 * HybridJS.ui.toast('msg ...')
**/
$.wrapAPI('ui.toast', (msg) => {
    if(msg) $.invokeApp(`${HANDLER_ROOT}InteractHandler/toast`, { msg })
})

module.exports = $
