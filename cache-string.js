const path = require('path')

module.exports = {
    init(srcDir, distDir, testEntry) {
        // Set info that can be reused.
        this.srcDir = srcDir
        this.distDir = distDir
        // Regex to test required paths against.
        // This is a string that will parse as a regex literal when exported.
        this.distRegex = `/(^|[\\/\\.])${path.basename(distDir)}\\//`
        this.resolvedTestEntry = path.resolve(testEntry)
    },
    create(infoUID, interceptFiles) {
        return `module.exports = {
    infoUID: '${infoUID}', /* This identifies this cache as unique to it's args and intercepts. */
    interceptFiles: ${JSON.stringify(interceptFiles)},
    distRegex: ${this.distRegex},
    srcDir: '${this.srcDir}',
    distDir: '${this.distDir}',
    testEntry: '${this.resolvedTestEntry}',
}`
    },
}
