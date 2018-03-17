var mockery = require('mockery')
var EventEmitter = require('events')
var streamify = require('string-to-stream')
var through = require('through')

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
  tape.test('ps stat (darwin)', function (t) {
    before()

    var os = require('os')
    os.platform = function () { return 'darwin' }
    mockery.registerMock('os', os)

    var childprocess = require('child_process')
    childprocess.spawn = function (command, args) {
      t.equal(command, 'ps')
      t.deepEqual(args, ['-o', 'pcpu,rss,pid,etime', '-p', process.pid + ',1,2,3'])
      var ee = new EventEmitter()
      var writable = through(function (data) {
        this.queue(data)
      })

      var data = [
        '%CPU   RSS  PID   TIME',
        '0.0  1234 ' + process.pid + ' 7-22:43:36',
        '0.0  1234 1 01:03:20',
        '0.0  1234 2 03:20',
        '0.0 1234 3 00:00:01'
      ]

      ee.stdout = writable
      ee.stderr = through(function (data) { this.queue(data) })
      streamify(data.join(os.EOL)).pipe(writable)

      writable.on('end', function () {
        ee.emit('close', 0)
      })

      return ee
    }

    mockery.registerMock('child_process', childprocess)

    // require after mock
    var pidusage = require('..')
    pidusage.stat([process.pid, 1, 2, 3], function (err, stat) {
      t.error(err)
      t.equal(stat[0].memory, 1263616)
      t.equal(stat[0].pid, process.pid)
      t.equal(stat[0].time, 1593816)
      t.ok(stat[0].start instanceof Date)
      t.equal(stat[1].time, 1 * 3600 + 3 * 60 + 20)
      t.equal(stat[2].time, 60 * 3 + 20)
      t.equal(stat[3].time, 1)
      t.ok(stat[0].start instanceof Date)
      t.end()
      after()
    })
  })

  // get etimes in seconds
  tape.test('ps stat (linux)', function (t) {
    before()

    var os = require('os')
    os.platform = function () { return 'linux' }
    mockery.registerMock('os', os)

    var childprocess = require('child_process')
    childprocess.spawn = function (command, args) {
      t.equal(command, 'ps')
      t.deepEqual(args, ['-o', 'pcpu,rss,pid,etimes', '-p', process.pid + ',0,123'])
      var ee = new EventEmitter()
      var writable = through(function (data) {
        this.queue(data)
      })

      var data = [
        '%CPU   RSS  PID   TIME',
        '0.0  1234 ' + process.pid + ' 5',
        '0.0 1234 0 1'
      ]

      ee.stdout = writable
      ee.stderr = through(function (data) { this.queue(data) })
      streamify(data.join(os.EOL)).pipe(writable)

      writable.on('end', function () {
        ee.emit('close', 0)
      })

      return ee
    }

    mockery.registerMock('child_process', childprocess)

    // require after mock
    var pidusage = require('..')
    pidusage.stat([process.pid, 0, 123], function (err, stat) {
      t.error(err)
      t.equal(stat.length, 3)
      t.equal(stat[0].time, 5)
      t.ok(stat[0].start instanceof Date)
      t.equal(stat[1].time, 1)

      t.end()
      after()
    })
  })
}

module.exports = test
