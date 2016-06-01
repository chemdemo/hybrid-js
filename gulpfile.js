/*
* @Author: dmyang
* @Date:   2015-06-16 15:19:59
* @Last Modified by:   dmyang
* @Last Modified time: 2016-06-01 10:42:59
*/

'use strict';

const gulp = require('gulp');
const webpack = require('webpack');

const gutil = require('gulp-util');

const webpackConf = require('./webpack.config');

const assets = process.cwd() + '/dist';
const exampleAssets = process.cwd() + '/examples/assets'

// clean assets
gulp.task('clean', function() {
    let rimraf = require('gulp-rimraf')

    return gulp.src(assets, {read: false}).pipe(rimraf({ force: true }))
})

gulp.task('clean-examples', () => {
    let rimraf = require('gulp-rimraf')

    return gulp.src(exampleAssets, {read: false}).pipe(rimraf({ force: true }))
})

// run webpack pack
gulp.task('pack', ['clean'], function(done) {
    let webpackConf = require('./webpack.config')

    webpack(webpackConf, (err, stats) => {
        if(err) throw new gutil.PluginError('webpack', err)
        gutil.log('[webpack]', stats.toString({colors: true}))
        done()
    })
})

gulp.task('pack-examples', ['clean-examples'], function(done) {
    let webpackConf = require('./webpack.example.config')

    webpack(webpackConf, (err, stats) => {
        if(err) throw new gutil.PluginError('webpack', err)
        gutil.log('[webpack-examples]', stats.toString({colors: true}))
        done()
    })
})

// compass js files
gulp.task('default', ['pack'], function() {
    let uglify = require('gulp-uglify');
    let rename = require('gulp-rename');

    return gulp
        .src(assets + '/*.js')
        .pipe(uglify())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest(assets))
})
