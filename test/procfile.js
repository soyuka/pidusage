var mockery = require('mockery')

function before () {
  mockery.enable({
    warnOnReplace: false,
    warnOnUnregistered: false,
    useCleanCache: true
  })
}

function after () {
  mockery.deregisterAll()
  mockery.disable()
}

function test (tape) {
  tape.test('procfile stat', function (t) {
    if (require('os').platform() === 'win32') {
      return t.end()
    }

    t.plan(2)
    before()

    var fs = require('fs')
    fs.readFile = function (path, encoding, callback) {
      if (path === '/proc/uptime') {
        callback(null, '100 0')
        return
      }

      // proc/<pid>/stat
      var infos = '0 (test)'
      for (var i = 0; i < 22; i++) {
        if (i === 12) {
          infos += ' ' + currentStime
        } else {
          infos += ' 0'
        }
      }
      callback(null, infos)
    }

    var clockTick = 100

    var os = require('os')
    os.platform = function () { return 'procfile' }

    mockery.registerMock('os', os)
    mockery.registerMock('fs', fs)
    mockery.registerMock('./cpu.js', function (cpu, next) {
      next({
        clockTick: clockTick,
        uptime: clockTick,
        pagesize: 4096
      })
    })

    // set the previous history as if kernel module usage had been called before
    var kernelModulePid = 0
    var currentStime = 10000 * clockTick
    var previousStime = 2000 * clockTick
    var pidusage = require('..')

    pidusage._history[kernelModulePid] = {}
    pidusage._history[kernelModulePid].uptime = 0
    pidusage._history[kernelModulePid].utime = 0
    pidusage._history[kernelModulePid].stime = previousStime

    pidusage.stat(kernelModulePid, function (err, stat) {
      t.error(err)
      t.equal(stat.cpu, (currentStime - previousStime) / clockTick)
      after()
    })
  })
}

module.exports = test
