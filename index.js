var os = require('os')
var stats = require('./lib/stats')
var platform = require('./lib/platform')
var history = {}

var wrapper = function (method) {
  return function (pid, options, cb) {
    if (typeof options === 'function') {
      cb = options
      options = {}
    }

    if (method === platform.UNSUPPORTED) {
      return cb(new Error(os.platform() + ' is not supported yet, please open an issue (https://github.com/soyuka/pidusage)'), null)
    }

    options.history = history
    return stats[method](pid, options, cb)
  }
}

exports.stat = wrapper(platform)

exports.unmonitor = function (pid) {
  if (!pid) {
    for (var i in history) {
      delete history[i]
    }
    return
  }

  delete history[pid]
}

exports._history = history
