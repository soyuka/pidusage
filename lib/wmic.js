'use strict'

const os = require('os')
const bin = require('./bin')
const history = require('./history')

function parseDate (datestr) {
  const year = datestr.substring(0, 4)
  const month = datestr.substring(4, 6)
  const day = datestr.substring(6, 8)
  const hour = datestr.substring(8, 10)
  const minutes = datestr.substring(10, 12)
  const seconds = datestr.substring(12, 14)
  const useconds = datestr.substring(15, 21)
  const sign = datestr.substring(21, 22)
  const tmz = parseInt(datestr.substring(22, 25), 10)
  const tmzh = Math.floor(tmz / 60)
  const tmzm = tmz % 60

  return new Date(
    year + '-' + month + '-' + day + 'T' + hour +
    ':' + minutes + ':' + seconds +
    '.' + useconds +
    sign + (tmzh > 9 ? tmzh : '0' + tmzh) + '' + (tmzm > 9 ? tmzm : '0' + tmzm)
  )
}

/**
  * Get pid informations through wmic command.
  * @param  {Number[]} pids
  * @param  {Object} options
  * @param  {Function} done(err, stat)
  */
function wmic (pids, options, done) {
  let whereClause = 'ProcessId=' + pids[0]
  for (let i = 1; i < pids.length; i++) {
    whereClause += ' or ' + 'ProcessId=' + pids[i]
  }

  const args = [
    'PROCESS',
    'where',
    '"' + whereClause + '"',
    'get',
    'CreationDate,ExecutablePath,KernelModeTime,ParentProcessId,ProcessId,UserModeTime,WorkingSetSize',
    '/format:csv'
  ]

  bin('wmic', args, { windowsHide: true, windowsVerbatimArguments: true }, function (err, stdout, code) {
    if (err) {
      if (err.message.indexOf('No Instance(s) Available.') !== -1) {
        const error = new Error('No matching pid found')
        error.code = 'ENOENT'
        return done(error)
      }
      return done(err)
    }
    if (code !== 0) {
      return done(new Error('pidusage wmic command exited with code ' + code))
    }
    const date = Date.now()

    // Note: On Windows the returned value includes fractions of a second.
    // Use Math.floor() to get whole seconds.
    // Fallback on current date when uptime is not allowed (see https://github.com/soyuka/pidusage/pull/130)
    const uptime = Math.floor(os.uptime() || (date / 1000))

    // Example of stdout on Windows 10
    // CreationDate: is in the format yyyymmddHHMMSS.mmmmmmsUUU
    // KernelModeTime: is in units of 100 ns
    // UserModeTime: is in units of 100 ns
    // WorkingSetSize: is in bytes
    //
    // Refs: https://superuser.com/a/937401/470946
    // Refs: https://msdn.microsoft.com/en-us/library/aa394372(v=vs.85).aspx
    // NB: The columns are returned in lexicographical order
    //
    // if format is csv:
    // Node,CreationDate,ExecutablePath,KernelModeTime,ParentProcessId,ProcessId,UserModeTime,WorkingSetSize
    // DESKTOP-55F748A,20220623162750.614250+480,,308281250,0,4,0,884736
    // DESKTOP-55F748A,20220623163014.080933+480,C:\Program Files\Git\usr\bin\bash.exe,468750,11144,11240,468750,10608640
    //
    // else if format is default:
    // CreationDate               KernelModeTime  ParentProcessId  ProcessId  UserModeTime  WorkingSetSize  CommandLine
    // 20150329221650.080654+060  153750000       0                777        8556250000    110821376       "C:\\Program\\ Files\\test.exe"

    stdout = stdout.split(os.EOL)

    let again = false
    const statistics = {}
    const fieldNums = args[args.length - 2].split(',').length
    // the 1th is \r and 2th is head when using csv format
    for (let i = 2; i < stdout.length; i++) {
      const line = stdout[i].split(',')

      if (!line || line.length < fieldNums) {
        continue
      }

      const creation = parseDate(line[1])
      const ppid = parseInt(line[4], 10)
      const pid = parseInt(line[5], 10)
      const kerneltime = Math.round(parseInt(line[3], 10) / 10000)
      const usertime = Math.round(parseInt(line[6], 10) / 10000)
      const memory = parseInt(line[7], 10)

      let hst = history.get(pid, options.maxage)
      if (hst === undefined) {
        again = true
        hst = { ctime: kerneltime + usertime, uptime: uptime }
      }

      // process usage since last call
      const total = (kerneltime + usertime - hst.ctime) / 1000
      // time elapsed between calls in seconds
      const seconds = uptime - hst.uptime
      const cpu = seconds > 0 ? (total / seconds) * 100 : 0

      const command = line[2]

      history.set(pid, { ctime: usertime + kerneltime, uptime: uptime }, options.maxage)

      statistics[pid] = {
        command: command,
        cpu: cpu,
        memory: memory,
        ppid: ppid,
        pid: pid,
        ctime: usertime + kerneltime,
        elapsed: date - creation.getTime(),
        timestamp: date
      }
    }

    if (again) {
      return wmic(pids, options, function (err, stats) {
        if (err) return done(err)
        done(null, Object.assign(statistics, stats))
      })
    }
    done(null, statistics)
  })
}

module.exports = wmic
