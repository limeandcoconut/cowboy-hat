# Cowboy Hat

```
     .~~~~`\~~\
    ;       ~~ \
    |           ;
 ,--------,______|---.
/          \-----`    \
`.__________`-_______-'
```
<sub> Art by Tom Youderian <sub>

A package for testing code from the other universe (of uncompiled code).

## What?

This is designed for use when generating code coverage reports on a project using babel.js or other compilation tools. Cowboy Hat allows you to write your tests against your compiled code but generate quick coverage reports against your source as you write and fulfill your tests. Also, it's a small [Futurama reference](https://nodei.co/npm/cowboy-hat/).

[![Futurama](http://i.imgur.com/HtsigPd.jpg)](https://nodei.co/npm/cowboy-hat/)

e.g.

Say you have a some code you want to test and you've written your tests against your babel output because you are a responsible person who wants to ensure that your end product is ready to be published. You want to run an in depth coverage report with a tool like [nyc](https://www.npmjs.com/package/nyc) once you're ready to publish but you'd also really like to watch your codebase for file changes and generate *quick* coverage reports maybe even for use with line highlighting in your editor. **Now You Can!** Simply tell cowboy hat which files to watch, where your compiled code is, and where your original code is.

`tests/test.js`
```js
const CodeToTest = require('../dist/code-to-test.js');

describe('A test', function() {
    // Stuffs here
});
```

Run tests written for files in `dist/` against `src/`.
```sh
cowboy-hat --from '../dist/' --to '../src/'
```

This will watch files in `src/` and `test/` for changes and report like so:
```sh
=============================== Coverage summary ===============================
Statements   : 100% ( 236/236 )
Branches     : 95.76% ( 113/118 )
Functions    : 92.73% ( 51/55 )
Lines        : 100% ( 234/234 )
================================================================================
```

## How?

```sh
cowboy-hat --from '../dist/' --to '../src/'
```

or
```sh
cowboy-hat -f '../dist/' -t '../src/'
```

With config file
```sh
cowboy-hat
```

As a lib
```js
const cowboyHat = require('cowboy-hat');
const config = require('./cowboy-hat.config.js');

cowboyHat(config);
```

## API

### From
The diretory that your tests are written against.
Default: `../dist/`
Type: String
Argument: --from or -f

### To
The directory that your tests will run against.
Default: `../src/`
Type: String
Argument: --to or -t

### Test Directory
The directory where your tests are kept.
Default: `./test/*.js`
Type: String
Argument: --testDir or -d

### Test Entry Point
The entry point for running tests.
Default: `<testDir>`
Type: String
Argument: --testEntry or -e

### Watch
An array of files to watch for changes.
Default: `[<to>, <testDir>]`
Type: Array
Argument: --watch or -w

## Config file
You can use a config file `cowboy-hat.config.js` for any of these arguments. Cowboy hat will look for it when it is run from the command line and any arguments supplied to the cli will override the config.

```js
module.exports = {
    from: '../dist/',
    to: '../src/',
    watch: [], // This will be overridden with the default listed above because it is empty
    testDir: 'test/*.js',
    testEntry: 'test.js',
};
```

## Testing Cowboy Hat
To test it just pull the repo and run `cowboy-hat` in it's root dir and make trigger a change on either `test/test.js` or `src/mock-code.js`. Everything is passing if you have 100% line coverage.

## TODO:

[ ] *FAASSTERR*
[ ] Make watching optional
[ ] Switch to (webpack-esque) constructor syntax
[ ] Add better tests

## Usage Stats

[![NPM](https://nodei.co/npm/cowboy-hat.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/cowboy-hat/)

## License

MIT, see [LICENSE.md](http://github.com/limeandcoconut/cowboy-hat/blob/master/LICENSE.md) for details.
