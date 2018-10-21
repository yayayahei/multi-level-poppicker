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
 

gulp.task('clear', function (cb) {
    del(['dist/**'], cb);
});
gulp.task('css',function(){
    gulp.src(["src/css/**"]).pipe(gulp.dest("dist/css/"));
})
gulp.task('build', ['css'], function () {
    gulp.src('src/**/*.js')
        .pipe(sourcemaps.init())
        .pipe(babel({
            presets: ['@babel/env']
        }))
        .on('error', console.error.bind(console))
        .pipe(webpack())
        .pipe(concat('multi-level-poppicker.js'))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist/'))
});

gulp.task('test-clear', function (cb) {
    del(['test/dist/**'], cb);
});
gulp.task('test-css',function(){
    gulp.src(["src/css/**"]).pipe(gulp.dest("test/dist/css/"));
})
gulp.task('test-data',function(){
    gulp.src(["test/src/data.json"]).pipe(gulp.dest("test/dist/"));
})
gulp.task('test',function () {
    gulp.src('test/src/*.js')
    .pipe(sourcemaps.init())
    .pipe(babel({
        presets:['@babel/env']
    }))
    .on('error',console.error.bind(console))
    .pipe(webpack())
    .on('error',console.error.bind(console))
    .pipe(concat('index.js'))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('test/dist'));
});

gulp.task('default', ["build"]);