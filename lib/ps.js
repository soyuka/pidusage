'use strict'

var os = require('os')
var bin = require('./bin')

var PLATFORM = os.platform()

function parseTime (timestr, fraction) {
  var time = 0
  var tpart = timestr.split(/-|:|\./)
  var i = tpart.length - 1
  if (i >= 0 && fraction && PLATFORM === 'darwin') { // Fractions of second
    time += parseInt(tpart[i--], 10) * 600
  }
  if (i >= 0) { // Seconds
    time += parseInt(tpart[i--], 10) * 1000
  }
  if (i >= 0) { // Minutes
    time += parseInt(tpart[i--], 10) * 60000
  }
  if (i >= 0) { // Hours
    time += parseInt(tpart[i--], 10) * 3600000
  }
  if (i >= 0) { // Days
    time += parseInt(tpart[i--], 10) * 86400000
  }
  return time
}

/**
  * Get pid informations through ps command.
  * @param  {Number[]} pids
  * @param  {Object} options
  * @param  {Function} done(err, stat)
  */
function ps (pids, options, done) {
  var pArg = pids.join(',')

  var args = ['-o', 'etime,pid,ppid,pcpu,rss,time', '-p', pArg]

  if (PLATFORM === 'aix') {
    args = ['-o', 'etime,pid,ppid,pcpu,rsssize,time', '-p', pArg]
  }

  bin('ps', args, function (err, stdout, code) {
    if (err) return done(err)
    if (code === 1) {
      return done(new Error('No maching pid found'))
    }
    if (code !== 0) {
      return done(new Error('pidusage ps command exited with code ' + code))
    }
    var date = Date.now()

    // Example of stdout on *nix.
    // ELAPSED: format is [[dd-]hh:]mm:ss
    // RSS: is counted as blocks of 1024 bytes
    // TIME: format is [[dd-]hh:]mm:ss
    //
    // Refs: http://www.manpages.info/linux/ps.1.html
    // NB: The columns are returned in the order given inside the -o option
    //
    //    ELAPSED   PID  PPID  %CPU     RSS        TIME
    // 2-40:50:53   430     1   3.0    5145  1-02:03:04
    //   40:50:53   432   430   0.0    2364  1-01:02:03
    //   01:50:50   727     1  10.0  348932       14:27
    //      00:20  7166     1   0.1    3756        0:00

    // Example of stdout on Darwin
    // ELAPSED: format is [[dd-]hh:]mm:ss
    // RSS: is counted as blocks of 1024 bytes
    // TIME: format is [[dd-]hh:]ss:mm.pp (pp is the percentage of a minute)
    //
    // Refs: https://ss64.com/osx/ps.html
    // NB: The columns are returned in the order given inside the -o option
    //
    //    ELAPSED   PID  PPID  %CPU     RSS           TIME
    // 2-40:50:53   430     1   3.0    5145  1-02:03:04.07
    //   40:50:53   432   430   0.0    2364  1-01:02:03.10
    //   01:50:50   727     1  10.0  348932       14:27.26
    //      00:20  7166     1   0.1    3756        0:00.02

    stdout = stdout.split(os.EOL)

    var statistics = {}
    for (var i = 1; i < stdout.length; i++) {
      var line = stdout[i].trim().split(/\s+/)

      if (!line || line.length !== 6) {
        continue
      }

      var pid = parseInt(line[1], 10)
      var ppid = parseInt(line[2], 10)
      var cpu = parseFloat(line[3].replace(',', '.'), 10)
      var memory = parseInt(line[4], 10) * 1024
      var etime = parseTime(line[0])
      var ctime = parseTime(line[5], true)

      statistics[pid] = {
        cpu: Math.min(Math.round(cpu * 1000) / 1000, 100.0),
        memory: memory,
        ppid: ppid,
        pid: pid,
        ctime: ctime,
        elapsed: etime,
        timestamp: date
      }
    }

    done(null, statistics)
  })
}

module.exports = ps
