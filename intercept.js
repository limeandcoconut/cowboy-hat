const path = require('path')
const chalk = require('chalk')
// Get cached path information.
const {interceptFiles, distRegex, srcDir, distDir, testEntry} = require('./.paths.cache.js')

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
