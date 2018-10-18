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

//var banner = ['/**',
//	' * <%= pkg.name %> - <%= pkg.description %>',
//	' * @version v<%= pkg.version %>',
//	' * @link <%= pkg.homepage %>',
//	' * @license <%= pkg.license %>',
//	' */',
//	''
//].join('\r\n');

var picker_banner = ['/**',
    '* 选择列表插件',
    '* varstion 2.0.0',
    '* by Houfeng',
    '* Houfeng@DCloud.io',
    '**/',
    ''
].join('\r\n');

gulp.task('clear_picker', function (cb) {
    del(['dist/js/*.js', 'dist/css/*.css'], cb);
});

gulp.task('build', ["clear_picker"], function () {
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

gulp.task('default', ["build"]);