/*jshint esversion: 6, node: true */
'use strict';

const gutil = require('gulp-util');
const clean = require('gulp-clean');
const gulp = require('gulp');
const gulpDotFlatten = require('./libs/gulp-dot-flatten.js');
const gulpRename = require('gulp-rename');
const gulpScreepsUpload = require('./libs/gulp-screeps-upload.js');
const path = require('path');
const PluginError = require('gulp-util').PluginError;
const ts = require('gulp-typescript');
const tslint = require('gulp-tslint');
const tsProject = ts.createProject('tsconfig.json', { typescript: require('typescript') });
const webpack = require('webpack-stream');
const closureCompiler = require('gulp-closure-compiler');

/********/
/* INIT */
/********/

let config;

try {
  config = require('./config.json');
} catch (error) {
  if (error.code == "MODULE_NOT_FOUND") {
    gutil.log(gutil.colors.red('ERROR'), 'Could not find file "config.json"');
  } else {
    gutil.log(error);
  }
  process.exit();
}

if (!config.target) {
  gutil.log(gutil.colors.red('ERROR'), 'Invalid "config.json" file: cannot find build target');
  process.exit();
}

gutil.log('Successfully loaded', gutil.colors.magenta('config.json'));

if (gutil.env.target) {
  if (!config.targets[gutil.env.target]) {
    gutil.log(gutil.colors.red('ERROR'), 'Invalid build target "' + gutil.env.target + '"');
    gutil.log('Valid build targets are:', '"' + Object.keys(config.targets).join('", "') + '"');
    process.exit();
  }
  gutil.log('Using selected build target', gutil.colors.magenta(gutil.env.target));
} else {
  gutil.log('Using default build target', gutil.colors.magenta(config.defaultTarget));
}

const buildConfig = config.target;

/*********/
/* TASKS */
/*********/

gulp.task('lint', function(done) {
  if (buildConfig.lint) {
    gutil.log('linting ...');
    return gulp.src('src/**/*.ts')
      .pipe(tslint({ formatter: 'prose' }))
      .pipe(tslint.report({
        summarizeFailureOutput: true,
        emitError: buildConfig.lintRequired === true
      }));
  } else {
    gutil.log('skipped lint, according to config');
    return done();
  }
});

gulp.task('clean', function () {
  return gulp.src(['dist/tmp/', 'dist/'], { read: false, allowEmpty: true })
    .pipe(clean());
});

gulp.task('compile', gulp.series(gulp.parallel('lint', 'clean'), function compile() {
  const webpackConfig = require('./webpack.config.js');
  return gulp.src('src/main.ts')
    .pipe(webpack(webpackConfig))
    .pipe(gulp.dest('dist/tmp/'));
}));

gulp.task('optimize', gulp.series('compile', function optimize (compilation) {
    return gulp.src('dist/tmp/**/*.js')
      .pipe(closureCompiler({
        compilerPath: 'node_modules/google-closure-compiler/compiler.jar',
        fileName: 'out.js'
      }))
      .pipe(gulp.dest('dist/'));
}));

gulp.task('watch', function () {
  gulp.watch('src/**/*.ts', gulp.series('build'))
    .on('all', function(event, path, stats) {
      console.log('');
      gutil.log(gutil.colors.green('File ' + path + ' was ' + event + 'ed, running tasks...'));
    })
    .on('error', function () {
      gutil.log(gutil.colors.green('Error during build tasks: aborting'));
    });
});

gulp.task('build', gulp.series('optimize', function buildDone(done) {
  gutil.log(gutil.colors.green('Build done'));
  return done();
}));
gulp.task('test', gulp.series('lint'));
gulp.task('default', gulp.series('watch'));
