import mockery from 'mockery'
import test from 'ava'
import os from 'os'

const IS_WIN = os.platform().match(/^win/)

test.before(() => {
  mockery.enable({
    warnOnReplace: false,
    warnOnUnregistered: false,
    useCleanCache: true
  })
})

test.beforeEach(() => {
  mockery.resetCache()
})

test.after(() => {
  mockery.disable()
})

test('procfile stat', async t => {
  if (IS_WIN) {
    t.pass()
    return
  }

  var fs = require('fs')
  var openCalled = 0

  fs.open = function (path, mode, cb) {
    openCalled++
    cb(null, 10)
  }

  fs.readFile = function (path, encoding, callback) {
    if (path === '/proc/uptime') {
      callback(null, '100 0')
    }
  }

  fs.read = function (fd, buffer, offset, length, position, callback) {
    // proc/<pid>/stat
    var infos = '0 (test)'
    for (var i = 0; i < 22; i++) {
      if (i === 12) {
        infos += ' ' + 10000 // currentStime 10000 * clockTick
      } else {
        infos += ' 0'
      }
    }

    buffer.write(infos)
    callback(null, infos.length, buffer)
  }

  fs.existsSync = function (path) {
    if (path === '/etc/alpine-release') { return true }
    return false
  }

  var os = require('os')
  os.platform = function () { return 'linux' }

  mockery.registerMock('os', os)
  mockery.registerMock('fs', fs)
  mockery.registerMock('./cpu.js', function (cpu, next) {
    next({
      clockTick: 100,
      uptime: 100,
      pagesize: 4096
    })
  })

  var m = require('..')
  var stat = await m(10)
  t.is(stat.cpu, 0)
  t.is(stat.memory, 0)
  t.is(stat.ppid, 0)
  t.is(stat.pid, 10)
  t.is(typeof stat.elapsed, 'number', 'elapsed')
  t.false(isNaN(stat.elapsed), 'elapsed')
  t.is(typeof stat.timestamp, 'number', 'timestamp')
  t.false(isNaN(stat.timestamp), 'timestamp')

  stat = await m(10)
  t.is(openCalled, 1)
})
