const path = require('path')
const chalk = require('chalk')
// Get cached path information.
const cowboyHatPath = path.dirname(require.resolve('cowboy-hat'))
const pathsCache = path.resolve(cowboyHatPath, './.paths.cache.js')
const {interceptFiles, distRegex, srcDir, distDir, testEntry} = require(pathsCache)

console.log(`\nFiles to be intercepted: \n${chalk.green(interceptFiles)}`)

const requireHacker = require('require-hacker')

// Intercept all requires after this point.
requireHacker.resolver((requirePath, module) => {
    // If the file shares a name with one of our intercept targets and matches the dist dir resolve it to the src dir.
    if (interceptFiles.includes(path.basename(requirePath)) && distRegex.test(requirePath)) {
        requirePath = requirePath.replace(distDir, srcDir)
        return requireHacker.resolve(requirePath, module)
    }
})

// Require the user's tests.
require(testEntry)
