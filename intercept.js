const path = require('path')
// Get cached path information.
const {proxyFiles, distRegex, srcDir, distDir} = require('./.paths.cache.js')

const requireHacker = require('require-hacker')

// Intercept all requires after this point.
requireHacker.resolver((requirePath, module) => {
    // See if the path is not something like /distdir/ return.
    if (!distRegex.test(requirePath)) {
        return
    }
    let {ext, name} = path.parse(requirePath)
    // If the file is a .js file or if it has no extension continue.
    // By checking the extension early we can avoid .includes() on non .js files. Marginally more efficient.
    if (ext.length && ext !== '.js') {
        return
    }
    // Ensure the extension .js.
    let filename = name + '.js'
    // If the file is not one of our proxy files return.
    if (!proxyFiles.includes(filename)) {
        return
    }
    // Get the full path to the requested module.
    // This could throw and rightfully so if the file doesn't exist.
    // This is saved til last so we do as few path resolves as possible.
    requirePath = requireHacker.resolve(requirePath, module)
    // If the file is in *exactly* the dist dir.
    if (path.dirname(requirePath) === distDir) {
        // Return the src file instead.
        // No need to resolve as we know that the file exists
        return path.join(srcDir, filename)
    }
})
