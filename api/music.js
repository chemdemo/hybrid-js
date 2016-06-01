/*
* @Author: dmyang
* @Date:   2015-11-10 10:21:42
* @Last Modified by:   dmyang
* @Last Modified time: 2016-06-01 10:33:02
* @Description: 音乐app相关api
*/

'use strict'

import HybridJS from './base'

const $ = HybridJS

$.wrapAPI('music.play', (id, type, name, position = 0) => {
    $.invokeApp('music.play', {id, type, name, position})
})

// etc.
// $.on('music.stateChange', (data) => {
//     ;
// })

module.exports = $
