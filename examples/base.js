/*
* @Author: dmyang
* @Date:   2016-01-19 14:34:54
* @Last Modified by:   chemdemo
* @Last Modified time: 2016-04-02 00:09:39
*/

'use strict';

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

on($('#setv'), 'click', (e) => {
    let v = prompt('Input:')

    HybridJS.app.set('test-key', v);
})

on($('#getv'), 'click', (e) => {
    HybridJS.app.get('network', (r) => {
        alert(JSON.stringify(r))
    })
})

on($('#open'), 'click', (e) => {
    HybridJS.app.open('http://172.17.140.148:8085/music.html', 1)
})

on($('#open-baidu'), 'click', (e) => {
    HybridJS.app.open('https://www.baidu.com')
})

// 通知app，H5需要监听mback键
on($('#on-listen-mback'), 'click', (e) => {
    HybridJS.app.listenMBack()

    HybridJS.on('mback', onMBack)
})

on($('#off-listen-mback'), 'click', (e) => {
    HybridJS.app.cancelListenMBack()
    HybridJS.off('mback', onMBack)
})

function onMBack() {
    let v = prompt('收到mback事件，如何处理？\r0：不处理（默认）\r1：客户端处理\r2：退出页面')

    HybridJS.app.back(v ? v : 0)
}


// assign
// HybridJS.invokeWeb('dom.setPageTitle', JSON.stringify({title: 'test'}))
HybridJS.assign('dom.setPageTitle', (params) => {
    document.title = typeof params == 'object' ? params.title : params
})

// HybridJS.invokeWeb('dom.getNodeText', JSON.stringify({req_sn: 'xx', id: '#off-listen-mback'}))
HybridJS.assign('dom.getNodeText', (params) => {
    return document.querySelector(params.id).innerHTML
})
