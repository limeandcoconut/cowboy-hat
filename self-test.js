const cowboyHat = require('./index.js')

cowboyHat({
    forceRewriteCache: true,
})

// This is the reverse of the defalt config.
// It'll resolve and intercept properly but make the test fail! 🎉
// cowboyHat({
//     srcDir: './dist/',
//     distDir: './src/',
//     forceRewriteCache: true,
// })
