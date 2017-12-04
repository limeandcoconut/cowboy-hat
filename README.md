# Cowboy Hat

```
     .~~~~`\~~\
    ;       ~~ \
    |           ;
 ,--------,______|---.
/          \-----`    \
`.__________`-_______-'
```

> Testing code from the other universe (of uncompiled code).

Cowboy Hat allows you to **write your tests against compiled code but generate quick line coverage reports and highlighting against your source as you work on it**. Also, it's a small [Futurama reference](http://futurama.wikia.com/wiki/I_Dated_a_Robot).

![Futurama](http://i.imgur.com/HtsigPd.jpg)

- [Why cowboy-hat](#why-cowboy-hat)
- [Usage](#usage)
- [CLI Usage](#cli)
- [JS API](#js)
- [Configuration](#configuration)
- [Documentation](#documentation)
- [Testing Cowboy Hat](#testing-cowboy-hat)
- [Feedback](#feedback-✉️)
- [TODO](#todo)
- [Credits](#credits)
- [Stats](#usage-stats)
- [License](#license)

## Why Cowboy Hat?
### Run that by me again?
### Alright, but lets talk about you.

You wan't to write your tests against your compiled dist, because [you're responsible, and quality minded, but you also want fast cycle time in dev,](https://softwareengineering.stackexchange.com/questions/296757/in-ci-should-tests-be-run-against-src-or-dist) which comes from not waiting a geological age for your code to compile every time you save - because who has time for that shit anyway.

So you'd just bite the bullet 👨‍💻🔫 and wait for things to compile. *It's not that long anyway right?*

Whatever.

We all know what you're really going to do. You're going to pretend you'll wait - really, you will - right up until it matters when you're going to think: "I'm already taking a bunch of time to write tests for this thing, I'm NOT waiting forever to get the results every time I want to check coverage".

So that's how it'll go because **here's the clincher: *you want line highlighting.*** Of course you do. You're not some incompetient boring slug, hunting and pecking away at his machine like he's just made it out of the bronze age. You're an adept technocrat, and you stand tall knowing that you write quality, tested, covered, code and that you won't be waiting another second to know that `line 31` is covered but the branch starting on `line 32` needs just a little more of your valuable time.

So screw it! amirite? You're writing tests. You need coverage reports. And `lcovs`! So that you - who's time is of paramount value - don't have to strain or guess to see which lines you'll be pouring your attention into next. You don't need to write tests against compiled code. *Pfft!* The chance that you have an error which would cause a difference because of compilation is fucking negligable anyway.

You're just gonna write them against your source.

Well now you don't have to worry about all that; your time is *waaay* too valuable. Too valuable to spend two hours ripping your hair out when you eventually do have that breaking bug caused by compilation. `cowboy-hat` lets you have your cake, and eat it too. 👨‍🍳🎂🍽

Just run it and watch your tests execute against your source while you write them. And allow the windows into your code filled soul to gaze down on the verdent gutters of your editing pane as line after line whispers up to you: "I'm cool now, you can forget about me".

Yeaah, you need this tool.

### So how's it work?

Just tell Cowboy Hat which files to watch, where your compiled code is, and where your original code is.

Cowboy Hat watches and, on change, kicks off a coverage report using [nyc](https://www.npmjs.com/package/nyc) and [AVA](https://github.com/avajs/ava) generating an a `locv.info`. While doing this it will resolve any `require()` calls for something in your compiled code to the parallell file in your working source. You put `require('../dist/index.js')` in your tests and it resolves as if `require('../src/index.js)`.

This means that you don't have to recompile while you're working on your project but your tests are officially written against the output, and you can run them normally when you `build`, `prepublish`, etc.

**Any** `require()` to a file name which exists in both `distDir` and `srcDir` will be intelligently proxied.

## Usage

### Add cowboy-hat to your project

```console
$ yarn add --dev cowboy-hat // 🤠
```
-or-
```console
$ yarn global add cowboy-hat // 🤷‍
``` 

#### Peer dependencies

[AVA](https://github.com/avajs/ava) and [nyc](https://www.npmjs.com/package/nyc) are peer dependences. Which makes sense cause you need to be testing with AVA and using nyc for coverage to have the problem that this solves.

```console
$ yarn add --dev nyc ava
```

### Write some code to test
Write some code in a source file `./src/code-to-test.js`.
```js
const path = require('path')
module.exports = () => {
    let dirs = ['dist', 'src']
    let thisDir = path.basename(__dirname)
    return dirs.indexOf(thisDir)
}
```

Compile it to something like `./dist/code-to-test.js`.
```js
const path = require('path');
module.exports = () => {
    let dirs = ['dist', 'src'];
    let thisDir = path.basename(__dirname);
    return dirs.indexOf(thisDir);
};
//# sourceMappingURL=code-to-test.js.map
```

[Create your tests with AVA](https://github.com/avajs/ava#create-your-test-file).
`./test/test.js`
```js
const test = require('ava')
// Returns ../src/code-to-test.js when using cowboy-hat.
const dirTest = require('../dist/code-to-test.js')

test('A test', (t) => {
    t.true(dirTest() === 1) // yep
})
```
### Run cowboy-hat
```console
$ cowboy-hat
```

This will watch files in `src/` and `test/` for changes and generate coverage reports like so:

![Starting up cowboy-hat](https://imgur.com/5UPvETi.gif)

And when you save a file in the glob that it's watching:

![cowboy-hat watching](https://imgur.com/6DIK2fg.gif)

## CLI

```console
$ cowboy-hat --help
  Options:
    --version                Show version number                         [boolean]
    --distDir, -d            The directory that will be proxied       [string]
    --srcDir, -s             The directory that will be the destination   [string]
    --testDir, -t            The directory that holds your tests          [string]
    --testEntry, -e          The entry file for testing                   [string]
    --watch, -w              A glob of directories to watch                [array]
    --forceRewriteCache, -f  Force the internal paths cache to update    [boolean]
    --verbose, -v            Start cowboy hat in verbose mode            [boolean]
    --useConfigFile, -c      Use config file if present                  [boolean]
    --usePackageConfig, -p   Use package.json as config file if present  [boolean]
    --help                   Show help                                   [boolean]
```

*Note that by default the CLI will not use either the config file or `package.json`. To do this you must pass a flag and either of those flags are not compatible with any other.*

All options but `-c` and `-p` can be passed simultaneously.

#### CLI examples

```sh
# With the default options.
$ cowboy-hat

# With a config file.
$ cowboy-hat -c

# Using package.json as the config.
$ cowboy-hat -p

# Passing args in.
$ cowboy-hat -d './compiled/' -s './source/' -t './tst'
```

## JS

Cowboy Hat can be used as a module in javascript files with the same API as when running it from the CLI. Simply `require()` it and pass in an object with any arguments; they will be destructred out.

```js
const cowboyHat = require('cowboy-hat')
const config = require('./cowboy-hat.config.js')

cowboyHat(config);
```
-or-

```js
const cowboyHat = require('cowboy-hat')

cowboyHat({
    srcDir: './source/',
    distDir: './prod/',
    watch: [
        './source/',
        './index.js',
    ],
})
```
-or-

![Enjoying cowboy-hat](https://imgur.com/M9oXB4i.gif)

## Configuration

The CLI has two options that are not used in the config files. The options `-c` and `-p` tell the cli to use the config file `cowboy-hat.config.js` or `package.json` respectively. For obvious reasons these cannot be set in either config.

### Config File

A config file must be named `cowboy-hat.config.js` to be recognized when passing the `-c` option to the CLI.

```js
module.exports = {
    srcDir: './src/',
    distDir: './dist/',
    testDir: './test/',
    testEntry: './test/test.js',
    watch: [
        './src/',
        './test/',
    ],
    forceRewriteCache: false,
    verbose: false,
}
```

### package.json config

All the above arguments also apply to the `cowboy-hat` section of your `package.json`.

```json
{
    "cowboy-hat": {
        "srcDir": "./src/"
        // etc.
    }
}
```

There is no precedence to either config. In the CLI or in JS, whatever you pass is what is used. They are mutually exclusive.

### Options

*All paths should be relative to where `cowboy-hat` is run from.*

+ `distDir`: The directory for which all `require()` calls will be intercepted.  
   Default: `'./dist/'`
+ `srcDir`: The directory that intercepted `require()` calls will be proxied to.  
   Default: `'./src/'`
+ `testDir`: The directory where you keep your tests.  
   Default: `'./test/'`
+ `testEntry`: The entry point for your tests.  
   Default: `path.join(testDir, './test.js')`   
   So... `./test/test.js` by default, default.
+ `watch`: A glob of files or directores that you want to watch for changes.  
   Default: `[path.resolve(srcDir), path.resolve(testDir)]`  
   So... something like `['/Users/jacob/Sites/cowboy-hat/src/', '/Users/yadda/yadda/yadda/test/']`.
+ `forceRewriteCache`: A flag telling Cowboy Hat to flush its' internal cache of path information. This cache **always** unique to the arguments passed so this flag is probably only useful for internal Cowboy Hat dev.  
   Default: `false`
+ `verbose`: A flag telling Cowboy Hat to start in verbose mode.  
   Default: `false`

### Directory Structure
By default Cowboy Hat expects that your direcory structure to look something like this:

```
project -
    |____dist +
    |   |____code-to-test.js
    |    
    |____src +
    |   |____code-to-test.js
    |
    |____test +
    |   |____test.js
    |
    |____cowboy-hat.config.js
```

But hey, go crazy. Do whatever, yo! 💃 🕺

*Note that, as mentioned above and below, all `.js` files and only those that are present in both your `distDir` and `srcDir` will be proxied. They must share a name and only `.js` files are affected.* 

## Documentation

Tests must be written using [AVA](https://github.com/avajs/ava) and coverage is generated using [nyc](https://www.npmjs.com/package/nyc). 

Tests and coverage are run on every file change inside of the watched directories then nyc generates an `lcov.info` so that you can use it for hightlighting.

![cowboy-hat in action in an editor](https://imgur.com/VAN5Zap.gif)

When Cowboy hat is run it creates an internal cache of some information and, notably, the files that it will be proxying. The next time Cowboy Hat is started it will look for a cache and if necessary update it. 

Cowboy Hat also watches the `srcDir` and `distDir` for file adds and removes. When one occurs it will decide wether or not to add it to the files that it is proxying and then run coverage normally. In this way you can get updates when adding files to `distDir` but not on file changes.


The option `forceRewriteCache` will do what it says. Since the cache is updated every time the files or Cowboy Hat's arguments change it should probably only be used for development on Cowboy Hat.

Only `.js` files will be proxied. 

Cowboy Hat returns a Promise that resolves just after the watchers for various files have been set up. 

```js
cowboyHat(config).then(() => {
    console.log('It\'s watching. 👀')
})
```

## Testing Cowboy Hat
To test it just pull the repo, run `cowboy-hat` in the root dir, and trigger a change on either `test/test.js` or `src/code-to-test.js`. Everything is passing if you have 100% line coverage. The generated `lcov.info` applies to `src/code-to-test.js`; check it out to really see if it works.

## Feedback ✉️
It is greatly appreciated! 🎉
Please hit me up, I'd love to hear what you have to say!

[messagethesmith@gmail.com](messagethesmith@gmail.com)

[https://github.com/limeandcoconut](https://github.com/limeandcoconut)

[@limeandcoconut](https://twitter.com/limeandcoconut)

Cheers!

## TODO:

- [ ] Better example of compiled code.
- [ ] *FAASSTERR*
- [ ] Make issues for yargs.
- [ ] Make issue for nyc.
- [ ] See how nested dirs under dist ard src act.
- [x] new gifs.
- [x] Add emojis! 🎉
- [x] Add links to other packages in readme.
- [x] Test global install.
- [x] Document that dist are watched for paths cache.
- [x] Test peer dependencies and document.
- [x] Test if src and dir can be at different levels.
- [x] Add verbose mode. For logging args and things.
- [x] Document.
- [x] Handle .js only or perhaps multiple file types to prevent filename intersection.
- [x] Document promise nature of package.
- [x] Make cowboy-hat exit when no files are being watched.

### Maybe
- [ ] Watch for adds in regular watch dirs.
- [ ] Coroutines to prevent race conditions on massive file adds and unlinks.
- [ ] Always ignore node_modules etc when watching.
- [ ] Make watching optional.
- [ ] Switch to (webpack-esque) constructor syntax.
- [ ] Add better tests.

## Credits

ASCII art in header by: Tom Youderian

## Usage Stats

[![NPM](https://nodei.co/npm/cowboy-hat.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/cowboy-hat/)

## License

ISC, see [LICENSE.md](http://github.com/limeandcoconut/cowboy-hat/blob/master/LICENSE.md) for details.
