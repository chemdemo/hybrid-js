/*
 * @Author: dmyang
 * @Date:   2015-11-10 10:42:22
 * @Last Modified by:   dmyang
 * @Last Modified time: 2016-06-01 10:58:48
 */

'use strict';

const path = require('path')
const fs = require('fs')

const webpack = require('webpack')

const assets = './dist/'

let genEntries = () => {
    let jsDir = path.resolve(__dirname, 'api')
    let names = fs.readdirSync(jsDir)
    let map = {}

    names.forEach((name) => {
        let m = name.match(/(.+)\.js(?:x)?$/)
        let entry = m ? m[1] : ''
        let entryPath = entry ? path.resolve(jsDir, name) : ''

        if(entry) map['hybrid-' + entry] = [entryPath]
    })

    return map
}

let entry = genEntries()

entry['hybrid'] = entry['hybrid-base']
delete entry['hybrid-base']

let config = {
    entry: entry,

    output: {
        filename: 'dist/[name].js',
        library: 'HybridJS',
        libraryTarget: 'umd', // 兼容各种模块化写法
    },

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
    }
}

module.exports = config
