/*
* @Author: dmyang
* @Date:   2016-01-19 11:30:49
* @Last Modified by:   dmyang
* @Last Modified time: 2016-03-31 19:35:48
*/

'use strict';

import HybridJS from '../api/music'

let $ = (id) => {
    return document.querySelector(id)
}

let on = (el, evt, fn) => {
    el.addEventListener(evt, fn)
}

HybridJS.debug = 1

on($('#api-play'), 'submit', (e) => {
    e.preventDefault()
    HybridJS.music.play($('#id').value, $('#type').value, $('#name').value, $('#position').value)
})

HybridJS.on('music.stateChange', function onStateChange(data) {
    alert(`music state change, data ${JSON.stringify(data)}`)
})
