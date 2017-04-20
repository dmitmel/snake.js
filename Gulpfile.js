/* global require */

'use strict';

var gulp = require('gulp'),
    cleanCSS = require('gulp-clean-css'),
    uglify = require('gulp-uglify'),
    sourcemaps = require('gulp-sourcemaps'),
    autoprefixer = require('gulp-autoprefixer'),
    watch = require('gulp-watch'),
    rimraf = require('rimraf');

var paths = {
    srcDir: './src',
    distDir: './dist'
};
paths.src = {
    js: paths.srcDir + '/js',
    css: paths.srcDir + '/css',
    fonts: paths.srcDir + '/fonts'
};
paths.dist = {
    js: paths.distDir + '/js',
    css: paths.distDir + '/css',
    fonts: paths.distDir + '/fonts'
};

gulp.task('css:build', function() {
    return gulp.src(paths.src.css + '/**/*.css')
        .pipe(sourcemaps.init())
        .pipe(autoprefixer())
        .pipe(cleanCSS())
        .pipe(sourcemaps.write('.', { includeContent: true, sourceRoot: '../../src/js' }))
        .pipe(gulp.dest(paths.dist.css));
});

gulp.task('fonts:build', function() {
    return gulp.src(paths.src.fonts + '/**/*.{css,eot,svg,woff,woff2}')
        .pipe(gulp.dest(paths.dist.fonts));
});

gulp.task('js:build', function() {
    return gulp.src(paths.src.js + '/**/*.js')
        .pipe(sourcemaps.init())
        .pipe(uglify({ preserveComments: 'license' }))
        .pipe(sourcemaps.write('.', { includeContent: true, sourceRoot: '../../src/js' }))
        .pipe(gulp.dest(paths.dist.js));
});

gulp.task('build', ['js:build', 'css:build', 'fonts:build']);

gulp.task('watch', function() {
    watch([paths.src.css], function() {
        return gulp.start('css:build');
    });
    watch([paths.src.js], function() {
        return gulp.start('js:build');
    });
    watch([paths.src.fonts], function() {
        return gulp.start('fonts:build');
    });
});

gulp.task('clean', function(cb) {
    rimraf(paths.distDir, cb);
});

gulp.task('default', ['build']);
