/*
 * @Author: dmyang
 * @Date:   2015-11-10 10:42:22
 * @Last Modified by:   dm
 * @Last Modified time: 2015-12-30 20:04:21
 */

'use strict';

var path = require('path');
var fs = require('fs');

var path = require('path');
var webpack = require('webpack');

var UglifyJsPlugin = webpack.optimize.UglifyJsPlugin;
var CommonsChunkPlugin = webpack.optimize.CommonsChunkPlugin;

var pageSrc = path.resolve(process.cwd(), 'src');
var assets = './assets/';

module.exports = {
    entry: {
        'hybridjs': ['./src/core.js', './src/api.js']
    },

    output: {
        path: assets,
        filename: '[name].min.js',
        publicPath: ''
    },

    resolve: {
        root: [pageSrc],
        alias: {},
        extensions: ['', '.js', '.jsx']
    },

    resolveLoader: {
        root: path.join(__dirname, 'node_modules')
    },

    plugins: [
        new UglifyJsPlugin()
    ],

    module: {
        loaders: [{
            test: /\.js?$/,
            exclude: /node_modules/,
            loader: 'babel'
        }]
    }
};
