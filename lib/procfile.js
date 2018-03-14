var fs = require('fs')
var path = require('path')
var updateCpu = require('./cpu')
var parallel = require('./parallel')

var cpu = null

function readProcFile (pid, options, done) {
  var hst = options.history[pid] ? options.history[pid] : {}

  // Arguments to path.join must be strings
  fs.readFile(path.join('/proc', '' + pid, 'stat'), 'utf8', function (err, infos) {
    if (err) {
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
      utime: parseFloat(infos[11]),
      stime: parseFloat(infos[12]),
      cutime: parseFloat(infos[13]),
      cstime: parseFloat(infos[14]),
      start: parseFloat(infos[19]) / cpu.clockTick,
      rss: parseFloat(infos[21])
    }

    // http://stackoverflow.com/questions/16726779/total-cpu-usage-of-an-application-from-proc-pid-stat/16736599#16736599
    var childrens = options.childrens ? stat.cutime + stat.cstime : 0
    var total = (stat.stime - (hst.stime || 0) + stat.utime - (hst.utime || 0) + childrens) / cpu.clockTick
    // time elapsed between calls in seconds
    var seconds = Math.abs(hst.uptime !== undefined ? cpu.uptime - hst.uptime : stat.start - cpu.uptime)
    if (seconds === 0) seconds = 1 // we sure can't divide through 0

    options.history[pid] = stat
    options.history[pid].uptime = cpu.uptime

    var cpuPercent = (total / seconds) * 100
    var memory = stat.rss * cpu.pageSize

    return done(null, {
      cpu: cpuPercent,
      memory: memory,
      time: ((stat.utime + stat.stime) / cpu.clockTick) * 1000, // elapsed time in ms
      start: new Date(date - seconds * 1000), // start date
      pid: pid
    })
  })
}

function procfile (pid, options, done) {
  updateCpu(cpu, function (err, result) {
    if (err) return done(err)

    cpu = result
    var fns = []

    if (!Array.isArray(pid)) {
      pid = [pid]
    }

    pid.forEach(function (id, i) {
      fns[i] = function (cb) {
        readProcFile(id, options, cb)
      }
    })

    parallel(fns, done)
  })
}

module.exports = procfile
