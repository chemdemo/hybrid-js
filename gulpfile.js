/*
* @Author: dmyang
* @Date:   2015-06-16 15:19:59
* @Last Modified by:   dmyang
* @Last Modified time: 2016-03-31 19:20:15
*/

'use strict';

const gulp = require('gulp')
const webpack = require('webpack')

const gutil = require('gulp-util')

const webpackConf = require('./webpack.config')

const assets = process.cwd() + '/dist'

// js check
gulp.task('hint', function() {
    let jshint = require('gulp-jshint')
    let stylish = require('jshint-stylish')

    return gulp.src([
            '/lib/**/*.js',
            '/api/**/*.js'
        ])
        .pipe(jshint())
        .pipe(jshint.reporter(stylish))
})

// clean assets
gulp.task('clean', ['hint'], function() {
    let rimraf = require('gulp-rimraf')

    return gulp.src(assets, {read: false}).pipe(rimraf({ force: true }))
})

// run webpack pack
gulp.task('pack', ['clean'], function(done) {
    webpack(webpackConf, function(err, stats) {
        if(err) throw new gutil.PluginError('webpack', err)
        gutil.log('[webpack]', stats.toString({colors: true}))
        done()
    })
})

// compass js files
gulp.task('default', ['pack'], function() {
    let uglify = require('gulp-uglify')
    let rename = require('gulp-rename')

    return gulp
        .src(assets + '/*.js')
        .pipe(uglify())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest(assets))
})
