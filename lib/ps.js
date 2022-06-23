'use strict'

const os = require('os')
const bin = require('./bin')
const history = require('./history')

const PLATFORM = os.platform()

function parseTime (timestr, centisec) {
  let time = 0
  const tpart = timestr.split(/-|:|\./)
  let i = tpart.length - 1
  if (i >= 0 && centisec && PLATFORM === 'darwin') {
    time += parseInt(tpart[i--], 10) * 10
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
  const pArg = pids.join(',')
  const displayArg = PLATFORM === 'aix' ? 'etime,pid,ppid,pcpu,rssize,time,comm' : 'etime,pid,ppid,pcpu,rss,time,comm'
  const args = ['-o', displayArg, '-p', pArg]

  bin('ps', args, function (err, stdout, code) {
    if (err) {
      if (PLATFORM === 'os390' && /no matching processes found/.test(err)) {
        err = new Error('No matching pid found')
        err.code = 'ENOENT'
      }

      return done(err)
    }
    if (code === 1) {
      const error = new Error('No matching pid found')
      error.code = 'ENOENT'
      return done(error)
    }
    if (code !== 0) {
      return done(new Error('pidusage ps command exited with code ' + code))
    }
    const date = Date.now()

    // Example of stdout on *nix.
    // ELAPSED: format is [[dd-]hh:]mm:ss
    // RSS: is counted as blocks of 1024 bytes
    // TIME: format is [[dd-]hh:]mm:ss
    // %CPU: goes from 0 to vcore * 100
    //
    // Refs: http://www.manpages.info/linux/ps.1.html
    // NB: The columns are returned in the order given inside the -o option
    //
    //    ELAPSED   PID  PPID  %CPU     RSS        TIME            COMMAND
    // 2-40:50:53   430     1   3.0    5145  1-02:03:04   /sbin/launchdout
    //   40:50:53   432   430   0.0    2364  1-01:02:03            /bin/sh
    //   01:50:50   727     1  10.0  348932       14:27         /bin/topst
    //      00:20  7166     1   0.1    3756        0:00        /sbin/vimst

    // Example of stdout on Darwin
    // ELAPSED: format is [[dd-]hh:]mm:ss
    // RSS: is counted as blocks of 1024 bytes
    // TIME: format is [[dd-]hh:]mm:ss.cc (cc are centiseconds)
    // %CPU: goes from 0 to vcore * 100
    //
    // Refs: https://ss64.com/osx/ps.html
    // NB: The columns are returned in the order given inside the -o option
    //
    //    ELAPSED   PID  PPID  %CPU     RSS           TIME            COMMAND
    // 2-40:50:53   430     1   3.0    5145  1-02:03:04.07   /sbin/launchdout
    //   40:50:53   432   430   0.0    2364  1-01:02:03.10            /bin/sh
    //   01:50:50   727     1  10.0  348932       14:27.26         /bin/topst
    //      00:20  7166     1   0.1    3756        0:00.02        /sbin/vimst

    stdout = stdout.split(os.EOL)

    const statistics = {}
    const fieldNums = displayArg.split(',').length
    for (let i = 1; i < stdout.length; i++) {
      const line = stdout[i].trim().split(/\s+/)

      if (!line || line.length < fieldNums) {
        continue
      }

      const pid = parseInt(line[1], 10)
      let hst = history.get(pid, options.maxage)
      if (hst === undefined) hst = {}

      const ppid = parseInt(line[2], 10)
      const memory = parseInt(line[4], 10) * 1024
      const etime = parseTime(line[0])
      const ctime = parseTime(line[5], true)

      const total = (ctime - (hst.ctime || 0))
      // time elapsed between calls in seconds
      const seconds = Math.abs(hst.elapsed !== undefined ? etime - hst.elapsed : etime)
      const cpu = seconds > 0 ? (total / seconds) * 100 : 0

      const command = line.filter((_, i) => i >= fieldNums - 1).join(' ')

      statistics[pid] = {
        command: command,
        cpu: cpu,
        memory: memory,
        ppid: ppid,
        pid: pid,
        ctime: ctime,
        elapsed: etime,
        timestamp: date
      }

      history.set(pid, statistics[pid], options.maxage)
    }

    done(null, statistics)
  })
}

module.exports = ps
