var gulp = require("gulp");
var pkg = require("./package.json");
var uglify = require("gulp-uglify");
var minifycss = require('gulp-minify-css');
var del = require('del');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var header = require('gulp-header');
const babel = require('gulp-babel');
const sourcemaps = require('gulp-sourcemaps');
const webpack = require('webpack-stream');
const watch = require('gulp-watch');
 

gulp.task('clear_picker', function (cb) {
    del(['dist/js/*.js', 'dist/css/*.css'], cb);
});
gulp.task('build', ["clear_picker"], function () {
    gulp.src(["./img/**"])
    .pipe(gulp.dest("./dist/img/"));
    gulp.src('js/**/*.js')
        .pipe(sourcemaps.init())
        .pipe(babel({
            presets: ['@babel/env']
        }))
        .on('error', console.error.bind(console))
        .pipe(webpack())
        .pipe(concat('all.js'))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist/js'))
});
gulp.task('test',function () {
    return watch(['js/**/*.js','test/src/**/*.js'],function () {
        //img
        gulp.src(["./img/**"])
        .pipe(gulp.dest("test/dist/img/"));
        gulp.src('test/src/**/*.js')
        .pipe(sourcemaps.init())
        .pipe(babel({
            presets:['@babel/env']
        }))
        .on('error',console.error.bind(console))
        .pipe(webpack())
        .on('error',console.error.bind(console))
        .pipe(concat('index.js'))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('test/dist'))
    })
    
});

gulp.task('default', ["build"]);