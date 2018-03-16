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
  tape.test('wmic stat (win32)', function (t) {
    t.plan(6)
    before()

    var os = require('os')
    os.platform = function () { return 'win32' }
    mockery.registerMock('os', os)

    var childprocess = require('child_process')
    childprocess.spawn = function (command, args) {
      t.equal(command, 'wmic')
      t.deepEqual(args, ['PROCESS', 'where', '"ProcessId=' + process.pid + '"', 'get', 'ProcessId,workingsetsize,usermodetime,kernelmodetime'])
      var ee = new EventEmitter()
      var writable = through(function (data) {
        this.queue(data)
      })

      var data = [
        'KernelModeTime ProcessId UserModeTime WorkingSetSize',
        '153750000 ' + process.pid + ' 8556250000 110821376'
      ]

      ee.stdout = writable
      ee.stderr = through(function () {})
      ee.stdin = {end: function () {}}
      streamify(data.join(os.EOL)).pipe(writable)

      writable.on('end', function () {
        ee.emit('close', 0)
      })

      return ee
    }

    mockery.registerMock('child_process', childprocess)

    // require after mock
    var pidusage = require('..')
    pidusage.stat(process.pid, function (err, stat) {
      t.error(err)
      t.equal(stat.memory, 110821376)
      t.equal(stat.time, 8710000000)
      t.equal(stat.pid, process.pid)
      // @TODO test that the date
      after()
    })
  })
}

module.exports = test
