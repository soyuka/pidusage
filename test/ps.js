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
    t.plan(4)
    before()

    var os = require('os')
    os.platform = function () { return 'darwin' }
    mockery.registerMock('os', os)

    var childprocess = require('child_process')
    childprocess.spawn = function (command, args) {
      t.equal(command, 'ps')
      t.deepEqual(args, ['-o', 'pcpu,rss,pid,time', '-p', process.pid])
      var ee = new EventEmitter()
      var writable = through(function (data) {
        this.queue(data)
      })

      var data = [
        '%CPU   RSS  PID   TIME',
        '0.0  1234 ' + process.pid + ' 7-22:43:36'
      ]

      ee.stdout = writable
      streamify(data.join(os.EOL)).pipe(writable)

      writable.on('end', function () {
        ee.emit('close')
      })

      return ee
    }

    mockery.registerMock('child_process', childprocess)

    // require after mock
    var pidusage = require('..')
    pidusage.stat(process.pid, {advanced: true}, function (err, stat) {
      t.error(err)
      t.equal(stat.time, 68658036000)
      // @TODO test that the date given is 7 days, 22 hours, 43 minutes and 36 seconds in the past
      after()
    })
  })
}

module.exports = test
