/*
* @Author: dmyang
* @Date:   2015-11-26 11:33:58
* @Last Modified by:   dmyang
* @Last Modified time: 2016-03-31 19:16:47
*/

'use strict';

const fs = require('fs')

const render = require('koa-ejs')
const proxy = require('koa-proxy')

module.exports = (router, app, staticDir) => {
    render(app, {
        root: __dirname,
        layout: false,
        viewExt: 'html',
        cache: false,
        debug: true
    })

    router.get('/', function*() {
        let pages = fs.readdirSync(staticDir);

        pages = pages.filter((page) => {
            return /\.html$/.test(page)
        })

        yield this.render('home', {pages: pages || []})
    })
}
