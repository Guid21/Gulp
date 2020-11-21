const fs = require('fs');

const PROJECT = 'dist',
  SOURCE = 'src',
  PATH = {
    build: {
      html: `${PROJECT}/`,
      css: `${PROJECT}/css/`,
      js: `${PROJECT}/js/`,
      img: `${PROJECT}/img/`,
      fonts: `${PROJECT}/fonts/`,
    },
    src: {
      html: [`${SOURCE}/*.html`, `!${SOURCE}/_*.html`],
      css: `${SOURCE}/scss/style.scss`,
      js: `${SOURCE}/js/script.js`,
      img: `${SOURCE}/img/**/*.{jpg,png,svg,gif,ico,webp}`,
      fonts: `${SOURCE}/fonts/*.ttf`,
    },
    watch: {
      html: `${SOURCE}/**/*.html`,
      css: `${SOURCE}/scss/**/*.scss`,
      js: `${SOURCE}/js/**/*.js`,
      img: `${SOURCE}/img/**/*.{jpg,png,svg,gif,ico,webp}`,
    },
    clean: `./${PROJECT}/`,
  };

const { src, dest, ...gulp } = require('gulp'),
  browsersync = require('browser-sync').create(),
  fileinclude = require('gulp-file-include'),
  del = require('del'),
  scss = require('gulp-sass'),
  autoprefixer = require('gulp-autoprefixer'),
  groupMedia = require('gulp-group-css-media-queries'),
  cleanCSS = require('gulp-clean-css'),
  rename = require('gulp-rename'),
  uglify = require('gulp-uglify-es').default,
  babel = require('gulp-babel'),
  imagemin = require('gulp-imagemin'),
  webp = require('gulp-webp'),
  webpHTML = require('gulp-webp-html'),
  spriteSVG = require('gulp-svg-sprite'),
  ttf2woff = require('gulp-ttf2woff'),
  ttf2woff2 = require('gulp-ttf2woff2'),
  fonter = require('gulp-fonter');

const browserSync = () =>
  browsersync.init({
    server: {
      baseDir: PATH.clean,
    },
    port: 3000,
    notify: false,
  });

const html = () =>
  src(PATH.src.html)
    .pipe(fileinclude())
    .pipe(webpHTML())
    .pipe(dest(PATH.build.html))
    .pipe(browsersync.stream());

const css = () =>
  src(PATH.src.css)
    .pipe(
      scss({
        outputStyle: 'expanded',
      })
    )
    .pipe(groupMedia())
    .pipe(
      autoprefixer({
        overrideBrowserslist: ['last 5 versions'],
        cascade: true,
      })
    )
    .pipe(dest(PATH.build.css))
    .pipe(cleanCSS())
    .pipe(
      rename({
        extname: '.min.css',
      })
    )
    .pipe(dest(PATH.build.css))
    .pipe(browsersync.stream());

const js = () =>
  src(PATH.src.js)
    .pipe(fileinclude())
    .pipe(
      babel({
        presets: ['@babel/preset-env'],
      })
    )
    .pipe(dest(PATH.build.js))
    .pipe(uglify())
    .pipe(
      rename({
        extname: '.min.js',
      })
    )
    .pipe(dest(PATH.build.js))
    .pipe(browsersync.stream());

const images = () =>
  src(PATH.src.img)
    .pipe(
      webp({
        quality: 70,
      })
    )
    .pipe(dest(PATH.build.img))
    .pipe(src(PATH.src.img))
    .pipe(
      imagemin({
        progressive: true,
        svgoPlugins: [{ removeViewBox: false }],
        interlaced: true,
        optimizationLevel: 3, // 0 to 7
      })
    )
    .pipe(dest(PATH.build.img))
    .pipe(browsersync.stream());

const fonts = () =>
  src(PATH.src.fonts)
    .pipe(ttf2woff())
    .pipe(dest(PATH.build.fonts))
    .pipe(src(PATH.src.fonts))
    .pipe(ttf2woff2())
    .pipe(dest(PATH.build.fonts));

gulp.task('otf2ttf', () =>
  src([`${SOURCE}/fonts/*.otf`])
    .pipe(fonter({ formats: ['ttf'] }))
    .pipe(dest(`${SOURCE}/fonts/`))
);

gulp.task('spriteSVG', () =>
  gulp
    .src([`${SOURCE}/iconsprite/*.svg`])
    .pipe(
      spriteSVG({
        mode: {
          stack: {
            sprite: '../icons/icons.svg',
            example: true,
          },
        },
      })
    )
    .pipe(dest(PATH.build.img))
);

const fontsStyle = () => {
  const fileContent = fs.readFileSync(`${SOURCE}/scss/fonts.scss`);

  if (fileContent.toString() === '') {
    fs.writeFile(`${SOURCE}/scss/fonts.scss`, '', () => {});

    return fs.readdir(PATH.build.fonts, (_, items) => {
      if (items) {
        let cFontname;

        for (let i = 0; i < items.length; i++) {
          const fontname = items[i].split('.')[0];

          if (cFontname !== fontname) {
            fs.appendFile(
              `${SOURCE}/scss/fonts.scss`,
              `@include font("${fontname}", "${fontname}", "400", "normal");\r\n`,
              () => {}
            );
          }
          cFontname = fontname;
        }
      }
    });
  }
};

const watchFiles = () => {
  gulp.watch([PATH.watch.html], html);
  gulp.watch([PATH.watch.css], css);
  gulp.watch([PATH.watch.js], js);
  gulp.watch([PATH.watch.img], images);
};

const clean = () => del(PATH.clean);

const build = gulp.series(
  clean,
  gulp.parallel(html, css, js, images, fonts),
  fontsStyle
);
const watch = gulp.parallel(build, watchFiles, browserSync);

exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;
