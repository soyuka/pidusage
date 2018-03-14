// Statistics processor files
var wmic = require('./wmic')
var ps = require('./ps')
var procfile = require('./procfile')

/**
 * Just a callback wrapper to keep backward compatibility
 */
function callback (err, statistics, options, done) {
  if (err) return done(err, null)

  // BC
  if (statistics.length === 1) {
    return done(null, statistics[0])
  }

  return done(null, statistics)
}

module.exports = {
  procfile: function (pid, options, done) {
    procfile(pid, options, function (err, statistics) {
      callback(err, statistics, options, done)
    })
  },
  ps: function (pid, options, done) {
    ps(pid, options, function (err, statistics) {
      callback(err, statistics, options, done)
    })
  },
  wmic: function (pid, options, done) {
    wmic(pid, options, function (err, statistics) {
      callback(err, statistics, options, done)
    })
  }
}
