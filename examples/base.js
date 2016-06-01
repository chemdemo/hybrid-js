/*
* @Author: dmyang
* @Date:   2016-01-19 14:34:54
* @Last Modified by:   dmyang
* @Last Modified time: 2016-06-01 12:04:45
*/

'use strict'

import HybridJS from '../api/base'

let $ = (id) => {
    return document.querySelector(id)
}

let on = (el, evt, fn) => {
    el.addEventListener(evt, fn)
}

let off = (el, evt, fn) => {
    el.removeEventListener(evt, fn)
}

HybridJS.debug = 1

on($('#open'), 'click', (e) => {
    HybridJS.view.openUrl('./music.html', 1)
})

on($('#open-baidu'), 'click', (e) => {
    HybridJS.view.openUrl('https://www.baidu.com')
})

on($('#sn'), 'click', (e) => {
    HybridJS.device.getSN((sn) => console.log(sn))
})

on($('#toast'), 'click', (e) => {
    HybridJS.ui.toast('This is toast msg.')
})

// event
// emit when mback pressed
HybridJS.on('mback', () => {
    let v = prompt('收到mback事件，如何处理？\r0：不处理（默认）\r1：客户端处理\r2：退出页面')

    FlymeJS.view.back(v ? v : 0)
})

// assign
// HybridJS.invokeWeb('dom.setPageTitle', JSON.stringify({title: 'test'}))
HybridJS.assign('dom.setPageTitle', (params) => {
    document.title = typeof params == 'object' ? params.title : params
})

// HybridJS.invokeWeb('dom.getNodeText', JSON.stringify({req_sn: 'xx', id: '#off-listen-mback'}))
HybridJS.assign('dom.getNodeText', (params) => {
    return document.querySelector(params.id).innerHTML
})
