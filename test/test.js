var os = require('os')
var path = require('path')
var test = require('tape')
var fork = require('child_process').fork
var platform = require('../lib/platform')
var pidusage = require('../')

test('integration', function (t) {
  t.plan(5)

  t.equal(typeof pidusage.stat, 'function')
  t.equal(typeof pidusage.unmonitor, 'function')

  pidusage.stat(process.pid, function (err, stats) {
    t.comment('Pid: ' + process.pid + '. Platform: ' + os.platform())
    console.log(stats)
    t.error(err)
    t.deepEqual(Object.keys(stats).sort(), ['cpu', 'memory', 'pid', 'start', 'time'])
    t.ok(typeof stats.start, 'Date')
  })
})

test('unmonitor with pid (only wmic and procfile)', function (t) {
  if (platform === 'ps' || platform === platform.UNSUPPORTED) {
    t.end()
    return
  }

  t.plan(3)

  pidusage.stat(process.pid, {advanced: true}, function (err, stats) {
    t.error(err)
    t.ok(pidusage._history[process.pid])
    pidusage.unmonitor(process.pid)
    t.notOk(pidusage._history[process.pid])
  })
})

test('unmonitor without pid (only wmic and procfile)', function (t) {
  if (platform === 'ps' || platform === platform.UNSUPPORTED) {
    t.end()
    return
  }

  t.plan(3)

  pidusage.stat(process.pid, {advanced: true}, function (err, stats) {
    t.error(err)
    t.ok(pidusage._history[process.pid])
    pidusage.unmonitor()
    t.notOk(pidusage._history[process.pid])
  })
})

test('integration mutliple pids', function (t) {
  t.plan(3)
  var p = fork(path.join(__dirname, './fixtures/http.js'))
  var pids = [process.pid, p.pid]

  pidusage.stat(pids, function (err, stats) {
    t.error(err)
    t.equal(stats.length, 2)
    t.deepEqual(Object.keys(stats[1]).sort(), ['cpu', 'memory', 'pid', 'start', 'time'])
    p.kill()
  })
})

require('./procfile')(test)
require('./ps')(test)
require('./wmic')(test)
