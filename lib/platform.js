var os = require('os')
var UNSUPPORTED = 'unsupported'
// Also available "procfile" removed in 2.0.0 because of crappy benchmarks compared to ps
var platformToMethod = {
  darwin: 'ps',
  sunos: 'ps',
  freebsd: 'ps',
  netbsd: 'ps',
  win: 'wmic',
  linux: 'ps',
  aix: 'ps',
  procfile: 'procfile',
  unsupported: UNSUPPORTED
}

var platform = os.platform()
if (platform.match(/^win/)) platform = 'win' // nor is windows a winner...
if (!platformToMethod[platform]) platform = UNSUPPORTED

module.exports = platformToMethod[platform]
module.exports.UNSUPPORTED = UNSUPPORTED
