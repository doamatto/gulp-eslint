# gulp-eslint [![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fflaganalytics%2Fgulp-eslint.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fflaganalytics%2Fgulp-eslint?ref=badge_shield)

> A [gulp](https://gulpjs.com/) plugin for [ESLint](https://eslint.org/) based off [Adametry's gulp-eslint package](https://github.com/adametry/gulp-eslint)

## Installation
```sh
yarn add -D @doamatto/gulp-eslint

npm install --dev @doamatto/gulp-eslint
```

## Usage
```js
const {src, task} = require('gulp');
const eslint = require('gulp-eslint');

task('default', () => {
    return src(['scripts/*.js'])
        // eslint() attaches the lint output to the "eslint" property
        // of the file object so it can be used by other modules.
        .pipe(eslint())
        // eslint.format() outputs the lint results to the console.
        // Alternatively use eslint.formatEach() (see Docs).
        .pipe(eslint.format())
        // To have the process exit with an error code (1) on
        // lint error, return the stream and pipe to failAfterError last.
        .pipe(eslint.failAfterError());
});
```

Or use the plugin API to do things like:
```js
gulp.src(['**/*.js','!node_modules/**'])
	.pipe(eslint({
		rules: {
			'my-custom-rule': 1,
			'strict': 2
		},
		globals: [
			'jQuery',
			'$'
		],
		envs: [
			'browser'
		]
	}))
	.pipe(eslint.formatEach('compact', process.stderr));
```

For additional examples, look through the [example directory](https://github.com/doamatto/gulp-eslint/tree/master/example).

## API
You can read this plugin's documentation [here](https://github.com/doamatto/gulp-eslint/wiki), which should answer all your questions you might have. If you still have some, see if an issue hasn't already been made and (if it isn't a duplicate) [create an issue](https://github.com/doamatto/gulp-eslint/issues). We'll try to help out ASAP.

## Configuration
ESLint may be configured explicity by using any of the following plugin options: `config`, `rules`, `globals`, or `env`. If the [useEslintrc option](#useEslintrc) is not set to `false`, ESLint will attempt to resolve a file by the name of `.eslintrc` within the same directory as the file to be linted. If not found there, parent directories will be searched until `.eslintrc` is found or the directory root is reached.

## Ignore Files
ESLint will ignore files that do not have a `.js` file extension at the point of linting ([some plugins](https://github.com/contra/gulp-coffee) may change file extensions mid-stream). This avoids unintentional linting of non-JavaScript files.

ESLint will also detect an `.eslintignore` file at the cwd or a parent directory. See the [ESLint docs](https://eslint.org/docs/user-guide/configuring#ignoring-files-and-directories) to learn how to construct this file.

## Extensions
ESLint results are attached as an "eslint" property to the vinyl files that pass through a Gulp.js stream pipeline. This is available to streams that follow the initial `eslint` stream. The [eslint.result](#result) and [eslint.results](#results) methods are made available to support extensions and custom handling of ESLint results.

#### Gulp ESLint Extensions:
* [gulp-eslint-if-fixed](https://github.com/lukeapage/gulp-eslint-if-fixed)
* [gulp-eslint-threshold](https://github.com/krmbkt/gulp-eslint-threshold)

## License
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fflaganalytics%2Fgulp-eslint.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fflaganalytics%2Fgulp-eslint?ref=badge_large)
