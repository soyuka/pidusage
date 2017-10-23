/* global beforeEach, afterEach, it, describe */
var mockery = require('mockery')
var expect = require('chai').expect

// classic "drop somewhere"... yeah I'm a lazy guy
var formatBytes = function (bytes, precision) {
  var kilobyte = 1024
  var megabyte = kilobyte * 1024
  var gigabyte = megabyte * 1024
  var terabyte = gigabyte * 1024

  if ((bytes >= 0) && (bytes < kilobyte)) {
    return bytes + ' B   '
  } else if ((bytes >= kilobyte) && (bytes < megabyte)) {
    return (bytes / kilobyte).toFixed(precision) + ' KB  '
  } else if ((bytes >= megabyte) && (bytes < gigabyte)) {
    return (bytes / megabyte).toFixed(precision) + ' MB  '
  } else if ((bytes >= gigabyte) && (bytes < terabyte)) {
    return (bytes / gigabyte).toFixed(precision) + ' GB  '
  } else if (bytes >= terabyte) {
    return (bytes / terabyte).toFixed(precision) + ' TB  '
  } else {
    return bytes + ' B   '
  }
}

describe('pid usage', function () {
  this.timeout(10000)

  beforeEach(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
  })

  afterEach(function () {
    mockery.deregisterAll()
    mockery.disable()
  })

  it('should get pid usage', function (cb) {
    var pusage = require('../').stat
    pusage(process.pid, function (err, stat) {
      expect(err).to.equal(null)
      expect(stat).to.be.an('object')
      expect(stat).to.have.property('cpu')
      expect(stat).to.have.property('memory')

      console.log('Pcpu: %s', stat.cpu)
      console.log('Mem: %s', formatBytes(stat.memory))

      cb()
    })
  })

  it('should get advanced pid usage', function (cb) {
    var pusage = require('../').stat
    pusage(process.pid, {advanced: true}, function (err, stat) {
      expect(err).to.equal(null)
      expect(stat).to.be.an('object')
      expect(stat).to.have.property('cpu')
      expect(stat).to.have.property('memory')
      expect(stat).to.have.property('time')
      expect(stat).to.have.property('start')

      console.log('Pcpu: %s', stat.cpu)
      console.log('Mem: %s', formatBytes(stat.memory))

      cb()
    })
  })

  it('should get pid usage multiple time', function (cb) {
    var pusage = require('../').stat
    var num = 0
    var interval

    function launch () {
      pusage(process.pid, function (err, stat) {
        expect(err).to.equal(null)
        expect(stat).to.be.an('object')
        expect(stat).to.have.property('cpu')
        expect(stat).to.have.property('memory')

        console.log('Pcpu: %s', stat.cpu)
        console.log('Mem: %s', formatBytes(stat.memory))

        if (++num === 5) {
          clearInterval(interval)
          cb()
        } else {
          setTimeout(launch, 100)
        }
      })
    }

    interval = setTimeout(launch, 1000)
  })

  it('should calculate correct cpu when user space time is zero (kernel module)', function (cb) {
    // force platform to linux to test this case
    var os = require('os')
    os.platform = function () {
      return 'linux'
    }

    // override readFile to simulate the system time only (kernel module) case
    var fs = require('fs')
    var clockTick = 100

    fs.readFile = function (path, encoding, callback) {
      if (path === '/proc/uptime') {
        callback(null, '0 0')
      } else { // proc/<pid>/stat
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
    }

    var helpers = require('../lib/helpers')
    helpers.cpu = function (next) {
      next(null, {
        clockTick: clockTick,
        uptime: clockTick,
        pagesize: 4096
      })
    }

    // mock out to simulate kernel module and linux platform
    mockery.registerMock('fs', fs)
    mockery.registerMock('os', os)
    mockery.registerMock('./helpers.js', helpers)

    var pusage = require('..')
    // set the previous history as if kernel module usage had been called before
    var kernelModulePid = 0
    var currentStime = 10000 * clockTick
    var previousStime = 2000 * clockTick

    pusage._history[kernelModulePid] = {}
    pusage._history[kernelModulePid].uptime = 0
    pusage._history[kernelModulePid].utime = 0
    pusage._history[kernelModulePid].stime = previousStime

    pusage.stat(kernelModulePid, function (err, stat) {
      if (err) {
        return cb(err)
      }

      expect(stat.cpu).to.be.equal((currentStime - previousStime) / clockTick)
      cb()
    })
  })
})
