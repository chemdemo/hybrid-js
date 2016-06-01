/*
 * @Author: dmyang
 * @Date:   2015-11-10 10:42:22
 * @Last Modified by:   dmyang
 * @Last Modified time: 2016-04-07 16:51:15
 */

'use strict';

const path = require('path')
const fs = require('fs')

const webpack = require('webpack')
const glob = require('glob')

const HtmlWebpackPlugin = require('html-webpack-plugin')

const debug = global.debug || process.env.NODE_ENV === 'develoption'
const src = './examples/'
const assets = './examples/assets'
const publicPath = ''

let genEntries = () => {
    let entryFiles = glob.sync(src + '/*.{js,jsx}')
    let map = {}

    entryFiles.forEach((filePath) => {
        let filename = filePath.substring(filePath.lastIndexOf('\/') + 1, filePath.lastIndexOf('.'))
        map[filename] = filePath
    })

    return map
}

let entries = genEntries()

let getPlugins = () => {
    let entryHtml = glob.sync(src + '/*.html')
    let r = []

    entryHtml.forEach((filePath) => {
        let filename = filePath.substring(filePath.lastIndexOf('\/') + 1, filePath.lastIndexOf('.'))
        let conf = {
            template: filePath,
            filename: filename + '.html'
        }

        if(filename in entries) {
            conf.inject = 'body'
            conf.chunks = ['common', filename]
        }

        r.push(new HtmlWebpackPlugin(conf))
    })

    return r
}

let config = {
    entry: entries,

    output: {
        path: path.resolve(assets),
        filename: debug ? '[name].js' : 'js/[chunkhash:8].[name].min.js',
        publicPath: publicPath
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
                loader: 'url?limit=8192&name=img/'
            }
        ]
    },

    plugins: getPlugins(),

    devServer: {
        hot: true,
        noInfo: false,
        inline: true,
        publicPath: publicPath,
        stats: {
            cached: false,
            colors: true
        }
    }
}

module.exports = config
