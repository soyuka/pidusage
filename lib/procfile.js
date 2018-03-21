var fs = require('fs')
var path = require('path')
var updateCpu = require('./helpers/cpu')
var parallel = require('./helpers/parallel')
var history = require('./history')
var cpu = null

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
      start: parseFloat(infos[19]) / cpu.clockTick,
      rss: parseFloat(infos[21]),
      uptime: cpu.uptime
    }

    // http://stackoverflow.com/questions/16726779/total-cpu-usage-of-an-application-from-proc-pid-stat/16736599#16736599
    var childrens = options.childrens ? stat.cutime + stat.cstime : 0
    var total = (stat.stime - (hst.stime || 0) + stat.utime - (hst.utime || 0) + childrens) / cpu.clockTick
    // time elapsed between calls in seconds
    var seconds = Math.abs(hst.uptime !== undefined ? stat.uptime - hst.uptime : stat.start - stat.uptime)
    if (seconds === 0) seconds = 1 // we sure can't divide through 0

    history.set(stat, options.maxage)

    var cpuPercent = Math.min(Math.round((total / seconds) * 100000) / 1000, 100.0)
    var memory = stat.rss * cpu.pageSize

    return done(null, {
      cpu: cpuPercent,
      memory: memory,
      ctime: (stat.utime + stat.stime) / cpu.clockTick,
      elapsed: date - (stat.start * 1000),
      timestamp: stat.start * 1000, // start date
      pid: pid,
      ppid: stat.ppid
    })
  })
}

function procfile (pid, options, done) {
  updateCpu(cpu, function (err, result) {
    if (err) return done(err)

    cpu = result
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
