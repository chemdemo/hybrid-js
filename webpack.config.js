/*
 * @Author: dmyang
 * @Date:   2015-11-10 10:42:22
 * @Last Modified by:   dmyang
 * @Last Modified time: 2016-03-31 19:26:52
 */

'use strict';

const path = require('path')
const fs = require('fs')

const webpack = require('webpack')

// const HtmlWebpackPlugin = require('html-webpack-plugin')

const debug = process.env.NODE_ENV === 'development'
const assets = './dist/'
const examples = './examples/'

let genEntries = () => {
    let jsDir = path.resolve(__dirname, debug ? 'examples' : 'api')
    let names = fs.readdirSync(jsDir)
    let map = {}

    names.forEach((name) => {
        let m = name.match(/(.+)\.js(?:x)?$/)
        let entry = m ? m[1] : ''
        let entryPath = entry ? path.resolve(jsDir, name) : ''

        if(entry) map[(debug ? '' : 'flymejs-') + entry] = [entryPath]
    })

    return map
}

let entry = genEntries()

if(!debug) {
    entry['flymejs'] = entry['flymejs-base']
    delete entry['flymejs-base']
}

let output = {
    filename: 'dist/[name].js',
    library: 'FlymeJS',
    libraryTarget: 'umd', // 兼容各种模块化写法
}

if(debug) {
    output = {
        // path: path.resolve('__build'),
        path: '/',
        filename: '[name].js',
        publicPath: '/'
    }
}

let config = {
    entry: entry,

    output: output,

    resolve: {
        root: __dirname,
        extensions: ['', '.js', '.jsx']
    },

    module: {
        loaders: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                loader: 'babel?presets[]=es2015'
            },
            {
                test: /\.less$/,
                loader: 'style!css!less'
            },
            {
                test: /\.css$/,
                loader: 'style!css'
            },
            {
                test: /\.(png|jpg)$/,
                loader: 'url?limit=8192&prefix=img/'
            }
        ]
    },

    devServer: {
        hot: true,
        noInfo: false,
        inline: true,
        publicPath: output.publicPath,
        stats: {
            cached: false,
            colors: true
        }
    }
}

module.exports = config
