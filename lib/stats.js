'use strict'

var fs = require('fs')
var os = require('os')

var platformToMethod = {
  darwin: 'ps',
  sunos: 'ps',
  freebsd: 'ps',
  netbsd: 'ps',
  win: 'wmic',
  linux: 'ps',
  aix: 'ps'
}

var useProcfile = fs.existsSync('/etc/alpine-release')
var platform = os.platform()
if (platform.match(/^win/)) {
  platform = 'win'
}

var stat
try {
  stat = useProcfile ? require('./procfile') : require('./' + platformToMethod[platform])
} catch (err) {}

/**
 * @callback pidCallback
 * @param {Error} err A possible error.
 * @param {Object} statistics The object containing the statistics.
 */

/**
 * Get pid informations.
 * @public
 * @param  {Number|Number[]|String|String[]} pids A pid or a list of pids.
 * @param  {Object} [options={}] Options object
 * @param  {pidCallback} callback Called when the statistics are ready.
 */
function get (pids, options, callback) {
  if (stat === undefined) {
    return callback(new Error(os.platform() + ' is not supported yet, please open an issue (https://github.com/soyuka/pidusage)'))
  }

  var single = false
  if (!Array.isArray(pids)) {
    single = true
    pids = [pids]
  }

  if (pids.length === 0) {
    return callback(new TypeError('You must provide at least one pid'))
  }

  for (var i = 0; i < pids.length; i++) {
    pids[i] = parseInt(pids[i], 10)
    if (isNaN(pids[i]) || pids[i] < 0) {
      return callback(new TypeError('One of the pids provided is invalid'))
    }
  }

  stat(pids, options, function (err, stats) {
    if (err) {
      return callback(err)
    }

    if (single) {
      callback(null, stats[pids[0]])
    } else {
      callback(null, stats)
    }
  })
}

module.exports = get
