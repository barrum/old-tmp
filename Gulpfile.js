const { src, dest, parallel, series, watch } = require('gulp');
const del = require('del');
const less = require('gulp-less');
const fileinclude = require('gulp-file-include');
const pug = require('gulp-pug');
const changed = require('gulp-changed');
const concat = require('gulp-concat');
const sourcemaps = require('gulp-sourcemaps');
const autoprefixer = require('gulp-autoprefixer');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const browserSync = require('browser-sync').create();

// ============= УДАЛЯЕТ ПАПКУ BUILD =============
function clean() {
  return del(['build']);
}

// ============= HTML таск (gulp-file-include) =============
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

// ============= PUG =============
function pugWay() {
 return src(['_src/pug/**/*.pug', '!_src/pug/includes/**', '!_src/pug/templates/**'])
   .pipe(pug({ pretty: true })) // чтобы не сжимался на выходе
   .pipe(dest('build'))
   .pipe(browserSync.stream());
}

// ============= СКРИПТЫ =============
function scripts() {
  // return src(['_src/js/uikit-icons.min.js', '_src/js/uikit.min.js', '_src/js/custom.js']) // Расскоментировать если нужен UIKIT
  return src(['_src/js/custom.js']) // Закоментировать, если расскоментирована строчка выше
    .pipe(concat('scripts.js'))
    .pipe(uglify())
    .pipe(dest('build/js'))
    .pipe(browserSync.stream());
}

// ============= СТИЛИ =============
function styles() {
  return src('_src/less/styles.less')
    .pipe(sourcemaps.init())
    .pipe(less())
    .pipe(autoprefixer({ overrideBrowserslist: ['last 5 versions'], cascade: false }))
    .pipe(sourcemaps.write('./'))
    .pipe(dest('build/css'))
    .pipe(browserSync.stream());
}

// ============= КОПИРУЕТ ФАЙЛЫ И ПАПКИ ИЗ SRC В BUILD =============
function copyFiles() {
  return src(['_src/img/**', '_src/fonts/**', '_src/*.ico', '_src/robots.txt'], { 'base': '_src' }) // base треб. для кор-го переноса файлов и папок (для fonts)
    .pipe(dest('build'));
}

// ============= СЛЕДИТ ЗА ИЗМЕНЕНИЯМИ В ФАЙЛАХ И ПАПКАХ И РЕФРЕШИТ БРАУЗЕР =============
function watching() {
  browserSync.init({
    server: {
      baseDir: './build'  // сервер запускается в этой директории
    },
    browser: ["chrome"]
  });
  watch('_src/js/**/*.js', scripts); // следит за скриптами в _src и запускает задачу scripts
  watch('_src/less/**/*.less', styles); // следит за стилями
  watch('_src/html/**/*.html', html); // следит за html
  watch('_src/pug/**/*.pug', pugWay); // следит за pug
  watch(['_src/img/**', '_src/fonts/**', '_src/*.ico', '_src/robots.txt'], copyFiles); // следит за файлами
  watch('build/*.html').on('change', browserSync.reload); // перегружает браузер, если файлы html в build изменились
}

// ============= C ФРЕЙМВОРКОМ UIKIT настроить шаги: =============
// 1. Выполнить таск gulp uikit (скопируются стили и скрипты фреймворка в папку src)
// 2. В таске скрипты расскоментировать return src(['_src/js/uikit-icons.min.js', '_src/js/uikit.min.js', '_src/js/custom.js'])
// 3. В таске скрипты закоментировать return src(['_src/js/custom.js'])
// 4. в index.html и layout.pug закоментировать normalize и jquery
// 5. В styles.less расскоментировать @import "uikit/_import.less";
// 6. Если нужен pug вместо html, то заменить  exports.default = series(clean, parallel(pugWay, styles, scripts, copyFiles), watching);

function uikitStyles() {
  return src('node_modules/uikit/src/less/components/**')
    .pipe(dest('_src/less/uikit'));
}

function uikitJs() {
  return src(['node_modules/uikit/dist/js/uikit-icons.min.js', 'node_modules/uikit/dist/js/uikit.min.js'])
    .pipe(dest('_src/js'));
}

//************* ЗАПУСК ТАСКОВ *************
exports.clean = clean; // gulp clean
exports.uikit = parallel(uikitStyles, uikitJs); // gulp uikit
exports.default = series(clean, parallel(html, styles, scripts, copyFiles), watching); // gulp (по-умолчанию: html + normalize cdn + jquery cdn)
