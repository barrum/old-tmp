const { src, dest, parallel, series, watch } = require('gulp');
const del = require('del');
const less = require('gulp-less');
const fileinclude = require('gulp-file-include');
const pug = require('gulp-pug');
const newer = require('gulp-newer');
const changed = require('gulp-changed');
const cache = require('gulp-cache');
const concat = require('gulp-concat');
const sourcemaps = require('gulp-sourcemaps');
const autoprefixer = require('gulp-autoprefixer');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const browserSync = require('browser-sync').create();

// ============= C ФРЕЙМВОРКОМ UIKIT =============
function uikitStyles() {
  return src('node_modules/uikit/src/less/components/**')
    .pipe(dest('_src/less/uikit'));
}

function uikitJs() {
  return src(['node_modules/uikit/dist/js/uikit-icons.min.js', 'node_modules/uikit/dist/js/uikit.min.js'])
    .pipe(dest('_src/js'));
}

// ============= БЕЗ ФРЕЙМВОРКА =============
function jquery() {
  return src('node_modules/jquery/dist/jquery.min.js')
    .pipe(dest('_src/js'));
}

function normalize() {
  return src('node_modules/normalize.css/normalize.css')
    .pipe(rename('normalize.less'))
    .pipe(dest('_src/less'));
}
// ============= /.БЕЗ ФРЕЙМВОРКА =============

function clean() {
  return del(['build']);
}

// Используй простое включение html в html
// актуально для быстрой разработки на uikit
// или используй pug, расскомментировав задачу ниже
function html() {
  return src('_src/html/index.html')
    .pipe(fileinclude({
      prefix: '<!-- @@',
      suffix: ' -->',
      basepath: '_src/html/inc'
    }))
    .pipe(dest('build'))
    .pipe(browserSync.stream());
}

function pugWay() {
  return src(['_src/pug/**/*.pug', '!_src/pug/includes/**', '!_src/pug/templates/**'])
    .pipe(pug({ pretty: true })) // чтобы не сжимался на выходе
    .pipe(dest('build'))
    .pipe(browserSync.stream());
}

function styles() {
  return src('_src/less/styles.less')
    // .pipe(newer('build/css'))
    .pipe(sourcemaps.init())
    .pipe(less())
    // .pipe(cache(less())) //- есть проблема с sourcemaps для less
    // .pipe(cache(less(), { fileCache: new cache.Cache({ cacheDirName: 'gulp-cache' })}))
    .pipe(autoprefixer({ overrideBrowserslist: ['last 5 versions'], cascade: false }))
    .pipe(sourcemaps.write('./'))
    .pipe(dest('build/css'))
    .pipe(browserSync.stream());
}

function scripts() {
  // Если без фремворка, не забыть заменить скрипты uikit на jquery _src/js/jquery.min.js
  return src(['_src/js/uikit-icons.min.js', '_src/js/uikit.min.js', '_src/js/custom.js'])
    .pipe(concat('scripts.js'))
    .pipe(uglify())
    .pipe(dest('build/js'))
    .pipe(browserSync.stream());
}

function copyFiles() {
  // base требуется для корректного переноса файлов и папок
  // в данном пример для fonts (чтобы шрифты после переноса также находились в папке fonts)
  return src(['_src/fonts/**', '_src/*.ico', '_src/robots.txt'], { 'base': '_src' })
    // .pipe(newer('build'))
    .pipe(dest('build'));
}

function watching() {
  browserSync.init({
    server: {
      baseDir: './build'
    }
  });
  watch('_src/js/**/*.js', scripts); // следит за скриптами в _src и запускает задачу scripts
  watch('_src/less/**/*.less', styles); // следит за стилями
  watch('_src/html/**/*.html', html); // следит за html
  watch('_src/pug/**/*.pug', pugWay); // следит за pug
  watch(['_src/fonts/**', '_src/*.ico', '_src/robots.txt'], copyFiles); // следит за файлами
  watch('build/*.html').on('change', browserSync.reload); // перегружает браузер, если файлы html в build изменились
}

exports.clean = clean;
// Если без фреймворка = gulp simple
exports.simple = parallel(normalize, jquery);
// Если с фреймворком = gulp uikit (по-умолчанию)
exports.uikit = parallel(uikitStyles, uikitJs);
exports.default = series(clean, parallel(pugWay, styles, scripts, copyFiles), watching);
