'use strict'

function pify (fn, arg1) {
  return new Promise(function (resolve, reject) {
    fn(arg1, function (err, data) {
      if (err) return reject(err)
      resolve(data)
    })
  })
}

var stats = require('./lib/stats')

/**
 * Get pid informations.
 * @public
 * @param  {Number|Number[]|String|String[]} pids A pid or a list of pids.
 * @param  {Function} [callback=undefined] Called when the statistics are ready.
 * If not provided a promise is returned instead.
 * @returns  {Promise.<Object>} Only when the callback is not provided.
 */
function pidusage (pids, callback) {
  if (typeof callback === 'function') {
    stats(pids, callback)
    return
  }
  return pify(stats, pids)
}

module.exports = pidusage
