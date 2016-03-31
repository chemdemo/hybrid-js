/**
 * @Author: dmyang
 * @Date:   2015-06-29 18:42:30
 * @Last Modified by:   dmyang
 * @Last Modified time: 2016-03-31 19:27:26
 */

'use strict';

// load native modules
const http = require('http')
const path = require('path')
const util = require('util')

// load 3rd modules
const opn = require('opn')
const koa = require('koa')
const router = require('koa-router')()
const serve = require('koa-static')
const colors = require('colors')

// load local modules
const pkg = require('../package.json')
const port = pkg.config.devPort
const host = pkg.config.devHost
const env = process.argv[2] || process.env.NODE_ENV
const debug = 'production' !== env
const staticDir = path.resolve(__dirname, '../examples/' + (debug ? '' : 'dist'))

// load routes
const routes = require('./routes')

// init framework
let app = koa()

colors.setTheme({
    silly: 'rainbow',
    input: 'grey',
    verbose: 'cyan',
    prompt: 'grey',
    info: 'green',
    data: 'grey',
    help: 'cyan',
    warn: 'yellow',
    debug: 'blue',
    error: 'red'
})

// basic settings
app.keys = [pkg.name, pkg.description]
app.proxy = true

// global events listen
app.on('error', (err, ctx) => {
    err.url = err.url || ctx.request.url
    console.error(err, ctx)
})

// handle favicon.ico
app.use(function*(next) {
    if (this.url.match(/favicon\.ico$/)) this.body = ''
    yield next
})

// logger
app.use(function*(next) {
    console.log(this.method.info, this.url)
    yield next
})

// use routes
routes(router, app, staticDir)
app.use(router.routes())

if(debug) {
    let webpackDevMiddleware = require('koa-webpack-dev-middleware');
    let webpack = require('webpack');
    let webpackConf = require('../webpack.dev.config');

    app.use(webpackDevMiddleware(webpack(webpackConf), webpackConf.devServer));
}

app.use(serve(staticDir, {
    maxage: 0
}))

app = http.createServer(app.callback())

app.listen(port, host, function() {
    let url = `http://localhost:${port}`

    console.log('Listening at %s', url);

    opn(url)
})
