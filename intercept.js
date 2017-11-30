const {interceptFiles, distRegex, srcDir, distDir, testEntry} = require('./.paths.cache.js')
const path = require('path')
const srcDirRelative = srcDir.split(path.sep).pop()
const distDirRelative = distDir.split(path.sep).pop()

const requireHacker = require('require-hacker')

requireHacker.resolver((requirePath, module) => {
    let justBaseName = path.basename(requirePath, path.extname(requirePath))
    if (!interceptFiles.includes(justBaseName) || !distRegex.test(requirePath)) {
        return
    }
    requirePath = requirePath.replace(distDirRelative, srcDirRelative)
    return requireHacker.resolve(requirePath, module)
})

require(testEntry)
