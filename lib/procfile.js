var fs = require('fs')
var path = require('path')
var updateCpu = require('./helpers/cpu')
var parallel = require('./helpers/parallel')
var history = require('./history')
var cpuInfo = null

function readProcFile (pid, options, done) {
  var hst = history.get(pid, options.maxage)
  if (hst === undefined) hst = {}

  // Arguments to path.join must be strings
  fs.readFile(path.join('/proc', '' + pid, 'stat'), 'utf8', function (err, infos) {
    if (err) {
      if (err.code === 'ENOENT') {
        err.message = 'No maching pid found'
      }
      return done(err, null)
    }
    var date = Date.now()

    // https://github.com/arunoda/node-usage/commit/a6ca74ecb8dd452c3c00ed2bde93294d7bb75aa8
    // preventing process space in name by removing values before last ) (pid (name) ...)
    var index = infos.lastIndexOf(')')
    infos = infos.substr(index + 2).split(' ')

    // according to http://man7.org/linux/man-pages/man5/proc.5.html (index 0 based - 2)
    // In kernels before Linux 2.6, start was expressed in jiffies. Since Linux 2.6, the value is expressed in clock ticks
    var stat = {
      ppid: parseInt(infos[1]),
      utime: parseFloat(infos[11]),
      stime: parseFloat(infos[12]),
      cutime: parseFloat(infos[13]),
      cstime: parseFloat(infos[14]),
      start: parseFloat(infos[19]) / cpuInfo.clockTick,
      rss: parseFloat(infos[21]),
      uptime: cpuInfo.uptime
    }

    var memory = stat.rss * cpuInfo.pageSize

    // https://stackoverflow.com/a/16736599/3921589
    var childrens = options.childrens ? stat.cutime + stat.cstime : 0
    // process usage since last call in seconds
    var total = (stat.stime - (hst.stime || 0) + stat.utime - (hst.utime || 0) + childrens) / cpuInfo.clockTick
    // time elapsed between calls in seconds
    var seconds = Math.abs(hst.uptime !== undefined ? stat.uptime - hst.uptime : stat.start - stat.uptime)
    var cpu = seconds > 0 ? (total / seconds) * 100 : 0

    history.set(stat, options.maxage)

    return done(null, {
      cpu: Math.min(cpu, 100.0),
      usage: cpu,
      memory: memory,
      ctime: (stat.utime + stat.stime) / cpuInfo.clockTick,
      elapsed: date - (stat.start * 1000),
      timestamp: stat.start * 1000, // start date
      pid: pid,
      ppid: stat.ppid
    })
  })
}

function procfile (pid, options, done) {
  updateCpu(cpuInfo, function (err, result) {
    if (err) return done(err)

    cpuInfo = result
    var fns = {}

    pid.forEach(function (id, i) {
      fns[id] = function (cb) {
        readProcFile(id, options, cb)
      }
    })

    parallel(fns, {graceful: true}, done)
  })
}

module.exports = procfile
